import { Router } from 'express'
import axios from 'axios'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { spawn, execSync } from 'child_process'
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomBytes } from 'crypto'
import { db } from '../firebase/client.js'
import { authenticate } from '../middleware/auth.js'
import { problems } from '../data/problems.js'

const router = Router()
const hasGemini = () => !!(process.env.GEMINI_API_KEY)
const hasOpenAI = () => !!(process.env.OPENAI_API_KEY)

// ─────────────────────────────────────────────────────────────────────────────
// TIER 1: Local execution via child_process (no API key needed)
// ─────────────────────────────────────────────────────────────────────────────

function commandExists(cmd) {
  try { execSync(`${cmd} --version`, { stdio: 'ignore', timeout: 3000 }); return true }
  catch { return false }
}

const RUNTIMES = {
  python:     commandExists('python')  ? 'python'  : commandExists('python3') ? 'python3' : null,
  javascript: commandExists('node')    ? 'node'    : null,
  java:       commandExists('javac')   ? 'javac'   : null,
  cpp:        commandExists('g++')     ? 'g++'     : commandExists('clang++')  ? 'clang++' : null,
}
console.log('[LocalExec] Available runtimes:', JSON.stringify(RUNTIMES))

function runProc(cmd, args, stdin, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = '', stderr = ''
    child.stdout.on('data', d => { stdout += d.toString() })
    child.stderr.on('data', d => { stderr += d.toString() })
    if (stdin) child.stdin.write(stdin)
    child.stdin.end()
    const timer = setTimeout(() => { child.kill(); resolve({ stdout, stderr: 'Time Limit Exceeded (8s)', exitCode: -1 }) }, timeoutMs)
    child.on('close', (code) => { clearTimeout(timer); resolve({ stdout, stderr, exitCode: code }) })
    child.on('error', (err) => { clearTimeout(timer); resolve({ stdout: '', stderr: err.message, exitCode: -1 }) })
  })
}

function makeResult({ stdout = '', stderr = '', compileErr = '', exitCode = 0 }) {
  return {
    success:        !stderr && !compileErr && exitCode === 0,
    stdout:         stdout.trim(),
    stderr:         stderr.trim(),
    compileErr:     compileErr.trim(),
    isCompileError: !!compileErr,
    executionTime:  null,
  }
}

async function runLocally(code, language, stdin) {
  const id  = randomBytes(8).toString('hex')
  const dir = join(tmpdir(), `av_${id}`)
  mkdirSync(dir, { recursive: true })
  const rm = (...f) => f.forEach(p => { try { unlinkSync(p) } catch {} })

  if (language === 'python' && RUNTIMES.python) {
    const f = join(dir, 'sol.py')
    writeFileSync(f, code)
    const r = await runProc(RUNTIMES.python, [f], stdin)
    rm(f)
    return makeResult(r)
  }

  if (language === 'javascript' && RUNTIMES.javascript) {
    const f = join(dir, 'sol.js')
    writeFileSync(f, code)
    const r = await runProc(RUNTIMES.javascript, [f], stdin)
    rm(f)
    return makeResult(r)
  }

  if (language === 'java' && RUNTIMES.java) {
    const f = join(dir, 'Solution.java')
    writeFileSync(f, code)
    const compile = await runProc('javac', [f], '')
    if (compile.stderr) { rm(f); return makeResult({ compileErr: compile.stderr }) }
    const r = await runProc('java', ['-cp', dir, 'Solution'], stdin)
    rm(f, join(dir, 'Solution.class'))
    return makeResult(r)
  }

  if (language === 'cpp' && RUNTIMES.cpp) {
    const src = join(dir, 'sol.cpp')
    const bin = join(dir, 'sol.exe')
    writeFileSync(src, code)
    const compile = await runProc(RUNTIMES.cpp, [src, '-o', bin, '-std=c++17'], '')
    if (compile.stderr || !existsSync(bin)) { rm(src); return makeResult({ compileErr: compile.stderr || 'Compilation failed' }) }
    const r = await runProc(bin, [], stdin)
    rm(src, bin)
    return makeResult(r)
  }

  return null // runtime not available
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER 2: Self-hosted or whitelisted Piston API
// ─────────────────────────────────────────────────────────────────────────────
const PISTON_URL = process.env.PISTON_API_URL || ''

const PISTON_LANG_MAP = {
  python:     { language: 'python',      version: '3.10.0' },
  javascript: { language: 'javascript',  version: '18.15.0', runtime: 'node' },
  java:       { language: 'java',        version: '15.0.2' },
  cpp:        { language: 'c++',         version: '10.2.0', runtime: 'gcc' },
}

async function runWithPiston(code, language, stdin) {
  if (!PISTON_URL) return null
  const lang = PISTON_LANG_MAP[language]
  if (!lang) return null

  const ext = { python: 'py', javascript: 'js', java: 'java', cpp: 'cpp' }[language]
  const payload = {
    language: lang.language,
    version:  lang.version,
    files:    [{ name: `solution.${ext}`, content: code }],
    stdin,
    args:     [],
    compile_timeout: 10000,
    run_timeout:      8000,
  }
  if (lang.runtime) payload.runtime = lang.runtime

  const headers = { 'Content-Type': 'application/json' }
  if (process.env.PISTON_API_KEY) headers['Authorization'] = process.env.PISTON_API_KEY

  const { data } = await axios.post(`${PISTON_URL}/execute`, payload, { headers, timeout: 25000 })
  if (!data?.run) throw new Error('Invalid Piston response')

  const stdout     = (data.run?.stdout     || '').trim()
  const stderr     = (data.run?.stderr     || '').trim()
  const compileErr = (data.compile?.stderr || '').trim()
  return { success: !stderr && !compileErr, stdout, stderr, compileErr, isCompileError: !!compileErr, executionTime: data.run?.wall_time ?? null }
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER 3: OpenAI simulation fallback
// ─────────────────────────────────────────────────────────────────────────────
async function runWithAI(code, language, stdin) {
  const stdinNote = stdin ? ` Stdin: \`${stdin}\`` : ''
  const prompt = `Simulate running this ${language} code exactly.${stdinNote}
Return ONLY JSON (no markdown): { "success": bool, "stdout": "exact output", "stderr": "", "compileErr": "" }
\`\`\`${language}\n${code}\n\`\`\``

  // Try Gemini first
  if (hasGemini()) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      })
      const result = await model.generateContent(prompt)
      const raw = result.response.text().trim()
      const r = JSON.parse(raw)
      return { ...r, stdout:(r.stdout||'').trim(), stderr:(r.stderr||'').trim(), compileErr:(r.compileErr||'').trim(), isCompileError:!!(r.compileErr), executionTime:null, aiSimulated:true }
    } catch (e) { console.warn('[Gemini Sim]', e.message) }
  }

  // Fall back to OpenAI
  if (hasOpenAI()) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1, max_tokens: 500,
        response_format: { type: 'json_object' },
      })
      const r = JSON.parse(res.choices[0].message.content?.trim() || '{}')
      return { ...r, stdout:(r.stdout||'').trim(), stderr:(r.stderr||'').trim(), compileErr:(r.compileErr||'').trim(), isCompileError:!!(r.compileErr), executionTime:null, aiSimulated:true }
    } catch (e) { console.warn('[OpenAI Sim]', e.message) }
  }

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/code/run — tries all tiers in order
// ─────────────────────────────────────────────────────────────────────────────
router.post('/run', authenticate, async (req, res) => {
  const { code, language, stdin = '' } = req.body
  if (!code || !language) return res.status(400).json({ message: 'code and language required' })
  if (!PISTON_LANG_MAP[language]) return res.status(400).json({ message: `Unsupported language: ${language}` })

  // Tier 1: local
  try {
    const r = await runLocally(code, language, stdin)
    if (r) { console.log(`[LocalExec] OK — ${language}`); return res.json(r) }
  } catch (e) { console.warn('[LocalExec] error:', e.message) }

  // Tier 2: Piston (self-hosted)
  if (PISTON_URL) {
    try {
      const r = await runWithPiston(code, language, stdin)
      if (r) { console.log(`[Piston] OK — ${language}`); return res.json(r) }
    } catch (e) { console.warn('[Piston] error:', e.message) }
  }

  // Tier 3: OpenAI/Gemini
  try {
    const r = await runWithAI(code, language, stdin)
    if (r) { console.log(`[AI Sim] OK — ${language}`); return res.json(r) }
  } catch (e) { console.warn('[AI Sim] error:', e.message) }

  // Final: clear error
  res.status(503).json({
    success: false, stdout: '',
    stderr: 'Execution unavailable. Your options:\n' +
      '  1. Install Python/Node/g++ locally (already detected for some languages)\n' +
      '  2. Self-host Piston: docker run -d --name piston --privileged -p 2000:2000 ghcr.io/engineer-man/piston\n' +
      '     Then set PISTON_API_URL=http://localhost:2000/api/v2/piston in backend/.env\n' +
      '  3. Set GEMINI_API_KEY/OPENAI_API_KEY in backend/.env for AI simulation',
    compileErr: '', isCompileError: false, executionTime: null,
  })
})

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
