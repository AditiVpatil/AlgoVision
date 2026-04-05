import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))

let db

function initFirebase() {
  if (admin.apps.length > 0) {
    db = admin.firestore()
    return db
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  const projectId = process.env.FIREBASE_PROJECT_ID

  if (!serviceAccountPath || !projectId) {
    console.warn(
      '⚠️  Missing Firebase config (FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID in .env). Firebase will be bypassed.'
    )
    return null
  }

  try {
    const serviceAccount = JSON.parse(
      readFileSync(resolve(__dirname, '../..', serviceAccountPath), 'utf8')
    )

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId,
    })

    db = admin.firestore()
    console.log(`✅ Firestore connected → project: ${projectId}`)
    return db
  } catch (err) {
    throw new Error(
      `❌  Could not load Firebase service account from "${serviceAccountPath}".\n` +
      `    Error: ${err.message}`
    )
  }
}

// Initialize on import
initFirebase()

export { db, admin }
export default db
