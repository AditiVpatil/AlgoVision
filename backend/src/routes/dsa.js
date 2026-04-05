import express from 'express'
import OpenAI from 'openai'
import dotenv from 'dotenv'
import { topics } from '../data/topics.js'
import { problems } from '../data/problems.js'
import { authenticate } from '../middleware/auth.js'

dotenv.config()
const router = express.Router()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'dummy_key_to_prevent_crash' })

// GET /api/topics  — list all topics (without full content for performance)
router.get('/topics', (req, res) => {
  const summary = topics.map(({ id, title, difficulty, description, completed, total, color, icon }) => ({
    id, title, difficulty, description, completed, total, color, icon
  }))
  res.json({ success: true, data: summary })
})

// GET /api/topics/:id  — full topic detail including explanation, code, dry run
router.get('/topics/:id', (req, res) => {
  const topic = topics.find(t => t.id === req.params.id)
  if (!topic) {
    return res.status(404).json({ success: false, message: 'Topic not found' })
  }
  res.json({ success: true, data: topic })
})

// GET /api/problems  — list all problems, optional ?topic= filter
router.get('/problems', (req, res) => {
  const { topic, difficulty } = req.query
  let result = [...problems]

  if (topic)      result = result.filter(p => p.topic === topic)
  if (difficulty) result = result.filter(p => p.difficulty.toLowerCase() === difficulty.toLowerCase())

  res.json({ success: true, data: result, total: result.length })
})

// POST /api/ask-ai  — AI tutor using real OpenAI API
router.post('/ask-ai', authenticate, async (req, res) => {
  const { question, topic } = req.body

  if (!question || !question.trim()) {
    return res.status(400).json({ success: false, message: 'Question is required' })
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is missing')
    }

    const prompt = `You are an expert DSA tutor bot on a platform called AlgoVision.
Your goal is to explain concepts clearly, concisely, and with a encouraging tone.
Analyze this student doubt on the topic: **${topic || 'General DSA'}**.
Question: "${question}"

Respond with helpful explanations, patterns to follow, and maybe a small hint if they are stuck.
Keep it strictly under 300 words. Use Markdown for formatting (bolding, lists, code snippets).`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    })

    const answer = completion.choices[0].message.content

    res.json({
      success: true,
      data: {
        question,
        answer,
        topic: topic || 'general',
        timestamp: new Date().toISOString(),
      }
    })
  } catch (err) {
    console.error('OpenAI Error:', err.message)
    res.status(503).json({ 
      success: false, 
      message: 'AI Service currently unavailable. Please check back later.',
      error: err.message
    })
  }
})

export default router
