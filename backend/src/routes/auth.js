import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { db } from '../firebase/client.js'
import { authenticate } from '../middleware/auth.js'

dotenv.config()
const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json')

let MOCK_USERS = []
try {
  if (fs.existsSync(USERS_FILE)) {
    MOCK_USERS = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
  }
} catch (err) {
  console.warn('Could not load users.json, starting fresh.')
}

const saveUsers = () => {
  try {
    if (!fs.existsSync(path.dirname(USERS_FILE))) fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true })
    fs.writeFileSync(USERS_FILE, JSON.stringify(MOCK_USERS, null, 2))
  } catch (err) {
    console.error('Failed to save users:', err)
  }
}

// Helper: Sign Token
const signToken = (user) => {
  return jwt.sign({ id: user.id || user.uid, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, username } = req.body
  console.log('👤 Registration attempt:', email, db ? '(Firestore)' : '(Mock Memory)')
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' })

  // Safety check for missing DB
  if (!db) {
    console.log('⚠️ Firebase DB missing, using local memory for registration.')
    const existing = MOCK_USERS.find(u => u.email === email)
    if (existing) return res.status(409).json({ message: 'User already exists' })
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const newUser = { id: Date.now().toString(), email, password: hashedPassword, username: username || email.split('@')[0], createdAt: new Date().toISOString() }
    MOCK_USERS.push(newUser)
    saveUsers()
    const token = signToken(newUser)
    const { password: _, ...userNoPw } = newUser
    return res.status(201).json({ token, user: userNoPw })
  }

  try {
    // Check if exists
    const userRef = db.collection('users').where('email', '==', email).limit(1)
    const snap = await userRef.get()
    if (!snap.empty) return res.status(409).json({ message: 'User already exists' })

    // Hash & Create
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const docRef = db.collection('users').doc()
    const newUser = {
      id: docRef.id,
      email,
      password: hashedPassword,
      username: username || email.split('@')[0],
      createdAt: new Date().toISOString()
    }

    await docRef.set(newUser)

    const token = signToken(newUser)
    const { password: _, ...userNoPw } = newUser
    res.status(201).json({ token, user: userNoPw })
  } catch (err) {
    if (err.message.includes('UNAUTHENTICATED') || err.message.includes('identity')) {
      console.log('Firebase auth failed, falling back to local memory setup.')
      const existing = MOCK_USERS.find(u => u.email === email)
      if (existing) return res.status(409).json({ message: 'User already exists' })
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)
      const newUser = { id: Date.now().toString(), email, password: hashedPassword, username: username || email.split('@')[0], createdAt: new Date().toISOString() }
      MOCK_USERS.push(newUser)
      saveUsers()
      const token = signToken(newUser)
      const { password: _, ...userNoPw } = newUser
      return res.status(201).json({ token, user: userNoPw })
    }
    console.error(err)
    res.status(500).json({ message: 'Registration failed' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' })

  // Safety check for missing DB
  if (!db) {
    console.log('Firebase DB missing, using local memory setup for login.')
    const user = MOCK_USERS.find(u => u.email === email)
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' })
    const token = signToken(user)
    const { password: _, ...userNoPw } = user
    return res.json({ token, user: userNoPw })
  }

  try {
    const snap = await db.collection('users').where('email', '==', email).limit(1).get()
    if (snap.empty) return res.status(401).json({ message: 'Invalid credentials' })

    const user = snap.docs[0].data()
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' })

    const token = signToken(user)
    const { password: _, ...userNoPw } = user
    res.json({ token, user: userNoPw })
  } catch (err) {
    if (err.message.includes('UNAUTHENTICATED') || err.message.includes('identity')) {
      const user = MOCK_USERS.find(u => u.email === email)
      if (!user) return res.status(401).json({ message: 'Invalid credentials' })
      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' })
      const token = signToken(user)
      const { password: _, ...userNoPw } = user
      return res.json({ token, user: userNoPw })
    }
    console.error(err)
    res.status(500).json({ message: 'Login failed' })
  }
})

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  if (!db) {
    const user = MOCK_USERS.find(u => u.id === req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found in mock storage' })
    const { password: _, ...userNoPw } = user
    return res.json({ user: userNoPw })
  }

  try {
    const doc = await db.collection('users').doc(req.user.id).get()
    if (!doc.exists) return res.status(404).json({ message: 'User not found' })
    const user = doc.data()
    const { password: _, ...userNoPw } = user
    res.json({ user: userNoPw })
  } catch (err) {
    res.status(500).json({ message: 'Sync error' })
  }
})

// PATCH /api/auth/profile
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { username } = req.body
    if (!username?.trim()) return res.status(400).json({ message: 'Username required' })
    if (!db) {
      const userIdx = MOCK_USERS.findIndex(u => u.id === req.user.id)
      if (userIdx === -1) return res.status(404).json({ message: 'User not found' })
      const existing = MOCK_USERS.find(u => u.username === username)
      if (existing && existing.id !== req.user.id) return res.status(409).json({ message: 'Username already taken' })
      MOCK_USERS[userIdx].username = username
      saveUsers()
      return res.json({ user: { ...req.user, username } })
    }
    const snap = await db.collection('users').where('username', '==', username).limit(1).get()
    if (!snap.empty && snap.docs[0].id !== req.user.id)
      return res.status(409).json({ message: 'Username already taken' })
    await db.collection('users').doc(req.user.id).update({ username })
    res.json({ user: { ...req.user, username } })
  } catch (err) {
    res.status(500).json({ message: 'Profile update failed' })
  }
})

export default router
