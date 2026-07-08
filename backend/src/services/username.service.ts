import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'

const MAX_LENGTH = 20
const MIN_LENGTH = 3

async function isTaken(username: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1)
  return !!existing
}

// Dérive une base de username depuis la partie locale de l'email, conforme
// aux règles du validator (3-20 chars, [a-zA-Z0-9_]) :
// "s.prigent+test@gmail.com" → "s_prigent"
function baseFromEmail(email: string): string {
  const local = email.split('@')[0] || ''
  const base = local
    .split('+')[0] // suffixe d'alias gmail
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_') // ., -, accents… → _
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, MAX_LENGTH)
  return base.length >= MIN_LENGTH ? base : ''
}

export async function generateUniqueUsername(email: string): Promise<string> {
  const base = baseFromEmail(email)

  if (base) {
    if (!(await isTaken(base))) return base
    // Collision : suffixe numérique croissant (en gardant ≤ 20 chars)
    for (let i = 1; i <= 500; i++) {
      const suffix = String(i)
      const candidate = base.slice(0, MAX_LENGTH - suffix.length) + suffix
      if (!(await isTaken(candidate))) return candidate
    }
  }

  // Fallback (partie locale inutilisable ou 500 collisions) : userXXXX
  for (let attempts = 0; attempts < 100; attempts++) {
    const username = `user${Math.floor(1000 + Math.random() * 9000)}`
    if (!(await isTaken(username))) return username
  }

  return `user${Date.now()}`
}
