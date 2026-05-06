import express from 'express'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'
import { topics as staticTopics } from '../data/topics.js'
import { problems as staticProblems } from '../data/problems.js'
import { db } from '../firebase/client.js'
import { authenticate } from '../middleware/auth.js'

dotenv.config()
const router = express.Router()

const hasGemini = () => !!(process.env.GEMINI_API_KEY)
const hasOpenAI = () => !!(process.env.OPENAI_API_KEY)

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — try Firestore first, fall back to static data arrays
// ─────────────────────────────────────────────────────────────────────────────

async function getTopics() {
  if (!db) return staticTopics
  try {
    const snap = await db.collection('topics').get()
    if (snap.empty) return staticTopics
    return snap.docs.map(d => d.data())
  } catch {
    return staticTopics
  }
}

async function getTopicById(id) {
  if (!db) return staticTopics.find(t => t.id === id) || null
  try {
    const doc = await db.collection('topics').doc(id).get()
    if (doc.exists) return doc.data()
    return staticTopics.find(t => t.id === id) || null
  } catch {
    return staticTopics.find(t => t.id === id) || null
  }
}

async function getProblems(filters = {}) {
  if (!db) {
    let result = [...staticProblems]
    if (filters.topic)      result = result.filter(p => p.topic === filters.topic)
    if (filters.difficulty) result = result.filter(p => p.difficulty.toLowerCase() === filters.difficulty.toLowerCase())
    return result
  }
  try {
    let query = db.collection('problems')
    if (filters.topic)      query = query.where('topic', '==', filters.topic)
    if (filters.difficulty) query = query.where('difficulty', '==', filters.difficulty)
    const snap = await query.get()
    if (snap.empty) {
      let result = [...staticProblems]
      if (filters.topic)      result = result.filter(p => p.topic === filters.topic)
      if (filters.difficulty) result = result.filter(p => p.difficulty.toLowerCase() === filters.difficulty.toLowerCase())
      return result
    }
    return snap.docs.map(d => d.data())
  } catch {
    let result = [...staticProblems]
    if (filters.topic)      result = result.filter(p => p.topic === filters.topic)
    if (filters.difficulty) result = result.filter(p => p.difficulty.toLowerCase() === filters.difficulty.toLowerCase())
    return result
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/topics
// ─────────────────────────────────────────────────────────────────────────────
router.get('/topics', async (req, res) => {
  try {
    const all = await getTopics()
    const summary = all.map(({ id, title, difficulty, description, completed, total, color, icon }) => ({
      id, title, difficulty, description, completed, total, color, icon
    }))
    res.json({ success: true, data: summary })
  } catch (err) {
    console.error('Topics fetch error:', err.message)
    res.status(500).json({ success: false, message: 'Failed to fetch topics' })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/topics/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/topics/:id', async (req, res) => {
  try {
    const topic = await getTopicById(req.params.id)
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' })
    res.json({ success: true, data: topic })
  } catch (err) {
    console.error('Topic fetch error:', err.message)
    res.status(500).json({ success: false, message: 'Failed to fetch topic' })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/problems
// ─────────────────────────────────────────────────────────────────────────────
router.get('/problems', async (req, res) => {
  try {
    const { topic, difficulty } = req.query
    const result = await getProblems({ topic, difficulty })
    res.json({ success: true, data: result, total: result.length })
  } catch (err) {
    console.error('Problems fetch error:', err.message)
    res.status(500).json({ success: false, message: 'Failed to fetch problems' })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ask-ai  — AI Tutor with streaming
// Priority: Gemini (free) → OpenAI → Offline tips
// ─────────────────────────────────────────────────────────────────────────────
router.post('/ask-ai', authenticate, async (req, res) => {
  const { question, topic, code, history = [] } = req.body

  if (!question?.trim()) {
    return res.status(400).json({ success: false, message: 'Question is required' })
  }

  const topicData = await getTopicById(topic)
  const context = topicData?.content?.explanation
    ? `\nTopic Context: ${topicData.content.explanation}` : ''

  const systemPrompt = `You are an expert DSA tutor on AlgoVision. Be clear, concise, and encouraging.
Topic: **${topic || 'General DSA'}**${code ? `\n\nStudent's current code:\n\`\`\`\n${code}\n\`\`\`` : ''}${context}
Keep responses under 300 words. Use Markdown formatting. Be conversational.`

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Transfer-Encoding', 'chunked')
  res.setHeader('X-Content-Type-Options', 'nosniff')

  // ── GEMINI (primary — free tier available) ──────────────────────────────
  if (hasGemini()) {
    try {
      console.log('[Gemini] AI Tutor answering...')
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt,
      })

      // Convert history to Gemini format — Gemini REQUIRES:
      // 1. History must start with role 'user' (never 'model')
      // 2. Roles must alternate user → model → user → model
      // 3. No empty messages
      let geminiHistory = history
        .filter(m => (m.text || m.content || '').trim())
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: (m.text || m.content || '').trim() }],
        }))

      // Drop any leading 'model' messages (Gemini rejects them)
      while (geminiHistory.length > 0 && geminiHistory[0].role === 'model') {
        geminiHistory.shift()
      }

      // Ensure strict alternation (remove consecutive same-role messages)
      const cleanHistory = []
      for (const msg of geminiHistory) {
        const last = cleanHistory[cleanHistory.length - 1]
        if (!last || last.role !== msg.role) {
          cleanHistory.push(msg)
        }
        // If same role, skip (dedup consecutive)
      }

      console.log(`[Gemini] Sending with ${cleanHistory.length} history messages`)
      const chat = model.startChat({ history: cleanHistory })
      const result = await chat.sendMessageStream(question)

      for await (const chunk of result.stream) {
        const text = chunk.text()
        if (text) res.write(text)
      }
      return res.end()
    } catch (err) {
      console.error('[Gemini] Tutor error:', err.message)
      if (res.headersSent) return res.end('\n\n[Gemini error — try again]')
      // Fall through to OpenAI
    }
  }


  // ── OPENAI (fallback) ────────────────────────────────────────────────────
  if (hasOpenAI()) {
    try {
      console.log('[OpenAI] AI Tutor answering...')
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text || m.content || '' })),
        { role: 'user', content: question },
      ]
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini', messages, temperature: 0.7, max_tokens: 800, stream: true,
      })
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) res.write(content)
      }
      return res.end()
    } catch (err) {
      console.error('[OpenAI] Tutor error:', err.message)
      if (res.headersSent) return res.end('\n\n[OpenAI error — try again]')
    }
  }

  // ── Offline fallback ─────────────────────────────────────────────────────
  res.write(`## 🤖 AlgoVision Tutor (Offline Mode)\n\n`)
  res.write(`_No AI key configured. To enable the AI Tutor, do ONE of the following:_\n\n`)
  res.write(`**Option 1 — Gemini (FREE, recommended):**\n`)
  res.write(`1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)\n`)
  res.write(`2. Sign in with Google → click **Create API Key**\n`)
  res.write(`3. Add to \`backend/.env\`: \`GEMINI_API_KEY=your-key-here\`\n\n`)
  res.write(`**Option 2 — OpenAI:**\n`)
  res.write(`Add \`OPENAI_API_KEY=sk-...\` to \`backend/.env\`\n\n`)
  res.write(`---\n### Quick Tips for **${topic || 'DSA'}**:\n`)
  res.write(`- Break problems into smaller sub-problems\n`)
  res.write(`- Always analyse **Time Complexity** and **Space Complexity**\n`)
  res.write(`- Use the **Visualize Optimal** button (after Submit) to see the best approach!`)
  return res.end()
})

export default router
