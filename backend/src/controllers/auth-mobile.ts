import type { Context } from 'hono'
import bcrypt from 'bcrypt'
import { and, asc, eq, lt, or } from 'drizzle-orm'
import { db } from '../db/index.js'
import { refreshTokens, users } from '../db/schema.js'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateTokenId,
  REFRESH_TOKEN_EXPIRY_DAYS,
} from '../services/jwt.js'
import { exchangeGoogleCodeMobile } from '../services/google-oauth.js'
import { generateUniqueUsername } from '../services/username.js'
import { googleMobileSchema, refreshMobileSchema, loginSchema, signupSchema } from '../validators/auth.js'
import type { AppEnv } from '../app.js'

type C = Context<AppEnv>

async function cleanupAndCreateToken(
  userId: string,
  refreshToken: string,
  userAgent: string | null
) {
  await db
    .delete(refreshTokens)
    .where(and(eq(refreshTokens.userId, userId), lt(refreshTokens.expiresAt, new Date())))

  const existingTokens = await db
    .select({ id: refreshTokens.id })
    .from(refreshTokens)
    .where(eq(refreshTokens.userId, userId))
    .orderBy(asc(refreshTokens.issuedAt))

  if (existingTokens.length >= 5) {
    await db.delete(refreshTokens).where(eq(refreshTokens.id, existingTokens[0].id))
  }

  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(refreshToken),
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    userAgent,
  })
}

export const googleAuthMobile = async (c: C) => {
  try {
    const body = await c.req.json()
    const parsed = googleMobileSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 422)
    }

    const googleInfo = await exchangeGoogleCodeMobile(parsed.data.code, parsed.data.redirectUri)
    const { googleId } = googleInfo
    const email = googleInfo.email || ''

    if (!email) {
      return c.json({ error: 'Could not retrieve email from Google' }, 400)
    }

    let [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.googleId, googleId), eq(users.email, email)))
      .limit(1)

    if (!user) {
      const username = await generateUniqueUsername()
      const [created] = await db
        .insert(users)
        .values({ email, username, googleId, language: 'fr' })
        .returning()
      user = created
    } else {
      const updates: { googleId?: string; username?: string } = {}
      if (!user.googleId) updates.googleId = googleId
      if (!user.username) updates.username = await generateUniqueUsername()
      if (Object.keys(updates).length > 0) {
        const [updated] = await db
          .update(users)
          .set(updates)
          .where(eq(users.id, user.id))
          .returning()
        user = updated
      }
    }

    const tokenId = generateTokenId()
    const accessToken = signAccessToken({ sub: user.id, email: user.email })
    const refreshToken = signRefreshToken({ sub: user.id, tokenId })

    await cleanupAndCreateToken(user.id, refreshToken, c.req.header('user-agent') || null)

    return c.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        language: user.language || 'fr',
        avatarUrl: user.avatarUrl,
        hasPassword: !!user.passwordHash,
      },
    })
  } catch (error) {
    console.error('Google OAuth mobile error:', error)
    return c.json({ error: 'Authentication failed' }, 401)
  }
}

export const refreshMobile = async (c: C) => {
  try {
    const body = await c.req.json()
    const parsed = refreshMobileSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ error: 'Refresh token required' }, 401)
    }

    const { refreshToken } = parsed.data
    const payload = verifyRefreshToken(refreshToken)
    const tokenHash = hashToken(refreshToken)

    const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1)
    if (!user) {
      return c.json({ error: 'User not found' }, 401)
    }

    const [existingToken] = await db
      .select({ id: refreshTokens.id })
      .from(refreshTokens)
      .where(and(eq(refreshTokens.userId, user.id), eq(refreshTokens.tokenHash, tokenHash)))
      .limit(1)

    if (!existingToken) {
      return c.json({ error: 'Invalid refresh token' }, 401)
    }

    await db.delete(refreshTokens).where(eq(refreshTokens.id, existingToken.id))

    const newTokenId = generateTokenId()
    const newAccessToken = signAccessToken({ sub: user.id, email: user.email })
    const newRefreshToken = signRefreshToken({ sub: user.id, tokenId: newTokenId })

    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: hashToken(newRefreshToken),
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      userAgent: c.req.header('user-agent') || null,
    })

    return c.json({ accessToken: newAccessToken, refreshToken: newRefreshToken })
  } catch {
    return c.json({ error: 'Invalid or expired refresh token' }, 401)
  }
}

export const logoutMobile = async (c: C) => {
  try {
    const body = await c.req.json()
    const parsed = refreshMobileSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ message: 'Logged out' })
    }

    const { refreshToken } = parsed.data
    const tokenHash = hashToken(refreshToken)

    try {
      const payload = verifyRefreshToken(refreshToken)
      await db
        .delete(refreshTokens)
        .where(and(eq(refreshTokens.userId, payload.sub), eq(refreshTokens.tokenHash, tokenHash)))
    } catch {
      // Token invalid or expired, continue with logout
    }

    return c.json({ message: 'Logged out successfully' })
  } catch {
    return c.json({ message: 'Logged out' })
  }
}

export const loginMobile = async (c: C) => {
  const body = await c.req.json()
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 422)
  }
  const { email, password } = parsed.data

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user || !user.passwordHash) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const isValid = await bcrypt.compare(password, user.passwordHash)
  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  if (!user.username) {
    const username = await generateUniqueUsername()
    await db.update(users).set({ username }).where(eq(users.id, user.id))
    user.username = username
  }

  const tokenId = generateTokenId()
  const accessToken = signAccessToken({ sub: user.id, email: user.email })
  const refreshToken = signRefreshToken({ sub: user.id, tokenId })

  await cleanupAndCreateToken(user.id, refreshToken, c.req.header('user-agent') || null)

  return c.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      language: user.language || 'fr',
      avatarUrl: user.avatarUrl,
      hasPassword: !!user.passwordHash,
    },
  })
}

export const signupMobile = async (c: C) => {
  const body = await c.req.json()
  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 422)
  }
  const { email, password } = parsed.data

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  if (existingUser) {
    return c.json({ error: 'User already exists' }, 409)
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const username = await generateUniqueUsername()

  const [user] = await db
    .insert(users)
    .values({ email, username, passwordHash, language: 'fr' })
    .returning()

  const tokenId = generateTokenId()
  const accessToken = signAccessToken({ sub: user.id, email: user.email })
  const refreshToken = signRefreshToken({ sub: user.id, tokenId })

  await cleanupAndCreateToken(user.id, refreshToken, c.req.header('user-agent') || null)

  return c.json(
    {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        language: user.language || 'fr',
        avatarUrl: user.avatarUrl,
        hasPassword: !!user.passwordHash,
      },
    },
    201
  )
}
