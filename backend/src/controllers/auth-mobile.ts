import type { Context } from 'hono'
import prisma from '../lib/prisma.js'
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
import { googleMobileSchema, refreshMobileSchema } from '../validators/auth.js'
import type { AppEnv } from '../app.js'

type C = Context<AppEnv>

async function cleanupAndCreateToken(
  userId: string,
  refreshToken: string,
  userAgent: string | null
) {
  await prisma.refreshToken.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  })

  const existingTokens = await prisma.refreshToken.findMany({
    where: { userId },
    orderBy: { issuedAt: 'asc' },
  })

  if (existingTokens.length >= 5) {
    await prisma.refreshToken.delete({ where: { id: existingTokens[0].id } })
  }

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      userAgent,
    },
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

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    })

    if (!user) {
      const username = await generateUniqueUsername()
      user = await prisma.user.create({
        data: { email, username, googleId, roles: ['user'], language: 'fr' },
      })
    } else {
      const updates: any = {}
      if (!user.googleId) updates.googleId = googleId
      if (!user.username) updates.username = await generateUniqueUsername()
      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({ where: { id: user.id }, data: updates })
      }
    }

    const tokenId = generateTokenId()
    const accessToken = signAccessToken({ sub: user.id, email: user.email, roles: user.roles })
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
        roles: user.roles,
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

    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) {
      return c.json({ error: 'User not found' }, 401)
    }

    const existingToken = await prisma.refreshToken.findFirst({
      where: { userId: user.id, tokenHash },
    })

    if (!existingToken) {
      return c.json({ error: 'Invalid refresh token' }, 401)
    }

    await prisma.refreshToken.delete({ where: { id: existingToken.id } })

    const newTokenId = generateTokenId()
    const newAccessToken = signAccessToken({ sub: user.id, email: user.email, roles: user.roles })
    const newRefreshToken = signRefreshToken({ sub: user.id, tokenId: newTokenId })

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(newRefreshToken),
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        userAgent: c.req.header('user-agent') || null,
      },
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
      await prisma.refreshToken.deleteMany({
        where: { userId: payload.sub, tokenHash },
      })
    } catch {
      // Token invalid or expired, continue with logout
    }

    return c.json({ message: 'Logged out successfully' })
  } catch {
    return c.json({ message: 'Logged out' })
  }
}
