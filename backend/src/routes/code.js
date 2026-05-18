import { Router } from 'express'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { db } from '../firebase/client.js'
import { authenticate } from '../middleware/auth.js'
import { problems } from '../data/problems.js'

const router = Router()
const hasGemini = () => !!(process.env.GEMINI_API_KEY)
const hasOpenAI = () => !!(process.env.OPENAI_API_KEY)

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/code/analyze
// Priority: Gemini (free) → OpenAI → Heuristic offline
// ─────────────────────────────────────────────────────────────────────────────
router.post('/analyze', authenticate, async (req, res) => {
  const { code, language, problemId, topicId, problemDescription, testResults = [] } = req.body
  if (!code || !language) return res.status(400).json({ message: 'code and language required' })

  const prompt = `You are an expert DSA coach analyzing a student's ${language} solution.
PROBLEM: ${problemDescription || 'A DSA problem'}
STUDENT CODE:
\`\`\`${language}
${code}
\`\`\`
Respond with ONLY valid JSON (no markdown, no extra text):
{
  "score": <integer 0-100>,
  "timeComplexity": "<e.g. O(N^2)>",
  "spaceComplexity": "<e.g. O(N)>",
  "optimalTimeComplexity": "<best possible>",
  "optimalSpaceComplexity": "<best possible>",
  "currentApproach": "<1-2 sentences>",
  "improvements": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "optimizedCode": "<COMPLETE runnable ${language} optimal solution with main/print>",
  "optimizedApproachName": "<algorithm name e.g. Hash Map>",
  "encouragement": "<one motivating sentence>"
}
Score: 90-100=near-optimal, 70-89=good, 40-69=inefficient, 0-39=brute force.
IMPORTANT: optimizedCode must be a complete runnable program.`

  const normalise = (a) => {
    a.score                  = Math.max(0, Math.min(100, a.score || 50))
    a.timeComplexity         = a.timeComplexity         || 'Unknown'
    a.spaceComplexity        = a.spaceComplexity        || 'Unknown'
    a.optimalTimeComplexity  = a.optimalTimeComplexity  || 'Unknown'
    a.optimalSpaceComplexity = a.optimalSpaceComplexity || 'Unknown'
    a.improvements           = a.improvements           || []
    a.optimizedCode          = a.optimizedCode          || ''
    a.encouragement          = a.encouragement          || 'Keep going!'
    a.passed                 = a.score >= 70
    return a
  }

  const saveToDb = (analysis) => {
    if (db) db.collection('submissions').add({ userId: req.user?.id || 'anon', problemId: String(problemId || ''), code, language, optimizationScore: analysis.score, passed: analysis.passed, createdAt: new Date().toISOString() }).catch(() => {})
  }

  // ── Gemini (primary — free) ───────────────────────────────────────────────
  if (hasGemini()) {
    try {
      console.log('[Gemini] Analyzing code...')
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      })
      const result = await model.generateContent(prompt)
      const analysis = normalise(JSON.parse(result.response.text()))
      saveToDb(analysis)
      return res.json(analysis)
    } catch (err) { console.warn('[Gemini] Analyze error:', err.message) }
  }

  // ── OpenAI (fallback) ─────────────────────────────────────────────────────
  if (hasOpenAI()) {
    try {
      console.log('[OpenAI] Analyzing code...')
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }],
        max_tokens: 2500, temperature: 0.2, response_format: { type: 'json_object' },
      })
      const analysis = normalise(JSON.parse(completion.choices[0].message.content?.trim() || '{}'))
      saveToDb(analysis)
      return res.json(analysis)
    } catch (err) { console.warn('[OpenAI] Analyze error:', err.message) }
  }

  // ── Heuristic offline fallback ────────────────────────────────────────────
  console.warn('[Analyze] No AI key — using heuristic')
  const problem   = problems.find(p => String(p.id) === String(problemId))
  const optimal   = problem?.optimal || { time: 'O(N)', space: 'O(N)', approach: 'Efficient Approach', code: '' }
  const cleanCode = code.replace(/\/\/.*|#.*/g, '').trim()
  const lines     = cleanCode.split('\n').filter(l => l.trim()).length

  if (lines < 5) {
    return res.json({ score: 0, passed: false, encouragement: 'Write your solution first!', timeComplexity: '—', spaceComplexity: '—', optimalTimeComplexity: optimal.time, optimalSpaceComplexity: optimal.space, improvements: ['Implement the logic.'], optimizedCode: `// ${optimal.approach}`, optimizedApproachName: optimal.approach, currentApproach: 'No logic detected.' })
  }

  const passCount  = testResults.filter(r => r.passed).length
  const totalTests = testResults.length
  const passRatio  = totalTests > 0 ? passCount / totalTests : 0.5
  const hasNested  = /for[\s\S]{0,60}for|while[\s\S]{0,60}while/.test(code)
  const hasHash    = /dict|HashMap|Map\(|Set\(|\{\}/i.test(code)
  let score = Math.round(passRatio * 70)
  if (optimal.time === 'O(N)')     { if (!hasNested) score += 15; if (hasHash) score += 15 }
  if (optimal.time === 'O(log N)' && (code.includes('/ 2') || code.includes('>> 1'))) score += 30
  score = Math.min(100, score)

  const heuristic = {
    score, passed: score >= 70 && passRatio >= 0.5,
    timeComplexity: hasNested ? 'O(N²)' : optimal.time,
    spaceComplexity: hasHash ? 'O(N)' : 'O(1)',
    optimalTimeComplexity: optimal.time, optimalSpaceComplexity: optimal.space,
    currentApproach: `Passed ${passCount}/${totalTests || '?'} tests.`,
    improvements: [`Target time: ${optimal.time}`, `Use ${optimal.approach}.`, 'Add GEMINI_API_KEY to .env for free AI feedback!'],
    optimizedCode: optimal.code || `// ${optimal.approach}\n// Add GEMINI_API_KEY to backend/.env for the full optimal solution`,
    optimizedApproachName: optimal.approach,
    encouragement: score >= 90 ? 'Optimal!' : 'Keep going!',
  }
  saveToDb(heuristic)
  return res.json(heuristic)
})

export default router
