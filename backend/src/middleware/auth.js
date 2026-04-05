import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev'

export async function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' })
  }

  const token = header.split(' ')[1]
  try {
    // Verify the custom JWT
    const decoded = jwt.verify(token, JWT_SECRET)

    // Append decoded payload.
    // decoded contains { id, email, role, etc. }
    req.user = decoded

    next()
  } catch (err) {
    console.error('JWT Verification Failed:', err.message)
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}
