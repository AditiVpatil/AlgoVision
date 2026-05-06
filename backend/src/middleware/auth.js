import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

// Support multiple fallback secrets so old browser tokens still work
// after a .env change. Order: env value, common dev fallback, empty-string fallback.
const SECRETS = [
  process.env.JWT_SECRET,
  'fallback-secret-for-dev',
  'algovi-dev-secret-change-in-prod-2024',
].filter(Boolean)

export async function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' })
  }

  const token = header.split(' ')[1]

  // Try each secret — whichever signed the token will succeed
  for (const secret of SECRETS) {
    try {
      const decoded = jwt.verify(token, secret)
      req.user = decoded
      return next()
    } catch {
      // try next secret
    }
  }

  console.error('JWT Verification Failed: no matching secret for token')
  return res.status(401).json({ message: 'Invalid or expired token — please log in again' })
}
