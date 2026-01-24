import { User } from '#models/index'

export async function generateUniqueUsername(): Promise<string> {
  let attempts = 0
  const maxAttempts = 100

  while (attempts < maxAttempts) {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const username = `user${randomNum}`

    const existing = await User.findBy('username', username)

    if (!existing) {
      return username
    }

    attempts++
  }

  return `user${Date.now()}`
}
