import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'

export async function generateUniqueUsername(): Promise<string> {
  let attempts = 0
  const maxAttempts = 100

  while (attempts < maxAttempts) {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const username = `user${randomNum}`

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1)

    if (!existing) {
      return username
    }

    attempts++
  }

  return `user${Date.now()}`
}
