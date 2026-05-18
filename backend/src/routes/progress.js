import { Router } from 'express'
import { db } from '../firebase/client.js'
import { authenticate } from '../middleware/auth.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const router = Router()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROGRESS_FILE = path.join(__dirname, '..', 'data', 'progress.json')
const QUIZ_FILE = path.join(__dirname, '..', 'data', 'quiz.json')

let MOCK_PROGRESS = {}
let MOCK_QUIZ = []
try {
  if (fs.existsSync(PROGRESS_FILE)) MOCK_PROGRESS = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
  if (fs.existsSync(QUIZ_FILE)) MOCK_QUIZ = JSON.parse(fs.readFileSync(QUIZ_FILE, 'utf-8'))
} catch {}

const saveProgress = () => {
  try {
    if (!fs.existsSync(path.dirname(PROGRESS_FILE))) fs.mkdirSync(path.dirname(PROGRESS_FILE), { recursive: true })
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(MOCK_PROGRESS, null, 2))
    fs.writeFileSync(QUIZ_FILE, JSON.stringify(MOCK_QUIZ, null, 2))
  } catch (err) {}
}

// POST /api/progress/quiz
router.post('/quiz', authenticate, async (req, res) => {
  const { topicId, score, total } = req.body
  if (!topicId || score == null || !total)
    return res.status(400).json({ message: 'topicId, score, total required' })

  if (!db) {
    const docId = `${req.user.id}_${topicId}`
    if (!MOCK_PROGRESS[docId]) MOCK_PROGRESS[docId] = { userId: req.user.id, topicId, stepReached: 0 }
    MOCK_PROGRESS[docId].stepReached = Math.max(MOCK_PROGRESS[docId].stepReached, 2)
    MOCK_PROGRESS[docId].updatedAt = new Date().toISOString()
    MOCK_QUIZ.push({ userId: req.user.id, topicId, score, total, accuracy: (score / total) * 100, createdAt: new Date().toISOString() })
    saveProgress()
    return res.json({ id: `local_${Date.now()}`, topicId, score, total })
  }

  try {
    const ref = await db.collection('quizResults').add({
      userId: req.user.id, topicId, score, total,
      accuracy: (score / total) * 100,
      createdAt: new Date().toISOString(),
    })
    // Update topic progress step
    await db.collection('topicProgress').doc(`${req.user.id}_${topicId}`).set(
      { userId: req.user.id, topicId, stepReached: 2, updatedAt: new Date().toISOString() },
      { merge: true }
    )
    res.json({ id: ref.id, topicId, score, total })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to save quiz result' })
  }
})

// POST /api/progress/topic
router.post('/topic', authenticate, async (req, res) => {
  const { topicId, stepReached, completed } = req.body
  if (!topicId) return res.status(400).json({ message: 'topicId required' })

  const update = {
    userId: req.user.id, topicId,
    stepReached: stepReached ?? 0,
    completed: completed ?? false,
    completedAt: completed ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
  }

  if (!db) {
    const docId = `${req.user.id}_${topicId}`
    MOCK_PROGRESS[docId] = { ...(MOCK_PROGRESS[docId] || {}), ...update }
    saveProgress()
    return res.json(update)
  }

  try {
    const docId = `${req.user.id}_${topicId}`
    await db.collection('topicProgress').doc(docId).set(update, { merge: true })
    res.json(update)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update progress' })
  }
})

// GET /api/progress/topic/:topicId
router.get('/topic/:topicId', authenticate, async (req, res) => {
  if (!db) {
    const docId = `${req.user.id}_${req.params.topicId}`
    return res.json(MOCK_PROGRESS[docId] || { stepReached: 0, completed: false })
  }
  try {
    const doc = await db.collection('topicProgress')
      .doc(`${req.user.id}_${req.params.topicId}`).get()
    res.json(doc.exists ? doc.data() : { stepReached: 0, completed: false })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch progress' })
  }
})

// GET /api/progress/all
router.get('/all', authenticate, async (req, res) => {
  if (!db) {
    const progress = {}
    Object.values(MOCK_PROGRESS).filter(p => p.userId === req.user.id).forEach(p => progress[p.topicId] = p)
    return res.json({ success: true, data: progress })
  }
  try {
    const snap = await db.collection('topicProgress')
      .where('userId', '==', req.user.id).get()
    const progress = {}
    snap.forEach(doc => {
      const data = doc.data()
      progress[data.topicId] = data
    })
    res.json({ success: true, data: progress })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch all progress' })
  }
})

// GET /api/progress/dashboard
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    let progressDocs = []
    let submissionsDocs = []
    let quizDocs = []

    if (!db) {
      // Use local files
      const SUBMISSIONS_FILE = path.join(__dirname, '..', 'data', 'submissions.json')
      
      progressDocs = Object.values(MOCK_PROGRESS).filter(p => p.userId === userId)
      quizDocs = MOCK_QUIZ.filter(q => q.userId === userId)
      
      if (fs.existsSync(SUBMISSIONS_FILE)) {
        try {
          const allSubs = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf-8'))
          submissionsDocs = allSubs.filter(s => s.userId === userId)
        } catch(e) {}
      }
    } else {
      const [progressSnap, submissionsSnap, quizSnap] = await Promise.all([
        db.collection('topicProgress').where('userId', '==', userId).get(),
        db.collection('submissions').where('userId', '==', userId).get(),
        db.collection('quizResults').where('userId', '==', userId).get(),
      ])
      progressDocs = progressSnap.docs.map(d => d.data())
      submissionsDocs = submissionsSnap.docs.map(d => d.data())
      quizDocs = quizSnap.docs.map(d => d.data())
    }

    const topicsCompleted = progressDocs.filter(d => d.completed).length
    const submissions = submissionsDocs.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
    const quizResults = quizDocs

    const problemsSolved = new Set(submissions.map(s => s.problemId)).size
    const avgOptimizationScore = submissions.length
      ? Math.round(submissions.reduce((a, s) => a + (s.optimizationScore || 0), 0) / submissions.length)
      : 0

    // Quiz accuracy per topic
    const quizByTopic = {}
    quizResults.forEach(r => {
      if (!quizByTopic[r.topicId]) quizByTopic[r.topicId] = []
      quizByTopic[r.topicId].push(r.accuracy)
    })
    const quizAccuracy = Object.entries(quizByTopic).map(([topicId, scores]) => ({
      topicId,
      accuracy: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }))

    const optimizationGrowth = submissions.map(s => ({
      problem: String(s.problemId).replace(/-/g, ' '),
      score: s.optimizationScore || 0,
      date: s.createdAt,
    }))

    res.json({
      topicsCompleted,
      problemsSolved,
      avgOptimizationScore,
      totalSubmissions: submissions.length,
      quizAccuracy,
      optimizationGrowth,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch dashboard data' })
  }
})

export default router
