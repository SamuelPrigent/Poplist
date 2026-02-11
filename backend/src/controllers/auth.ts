import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'
import bcrypt from 'bcrypt'
import prisma from '../lib/prisma.js'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateTokenId,
  REFRESH_TOKEN_EXPIRY_DAYS,
} from '../services/jwt.js'
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
} from '../services/cookie.js'
import { getGoogleAuthURL, getGoogleUserInfo, getClientURL } from '../services/google-oauth.js'
import { generateUniqueUsername } from '../services/username.js'
import {
  signupSchema,
  loginSchema,
  updateUsernameSchema,
  updateLanguageSchema,
  changePasswordSchema,
  deleteAccountSchema,
  setTokensSchema,
} from '../validators/auth.js'
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

export const signup = async (c: C) => {
  const body = await c.req.json()
  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 422)
  }
  const { email, password } = parsed.data

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return c.json({ error: 'User already exists' }, 409)
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const username = await generateUniqueUsername()

  const user = await prisma.user.create({
    data: { email, username, passwordHash, roles: ['user'], language: 'fr' },
  })

  const tokenId = generateTokenId()
  const accessToken = signAccessToken({ sub: user.id, email: user.email, roles: user.roles })
  const refreshToken = signRefreshToken({ sub: user.id, tokenId })

  await cleanupAndCreateToken(user.id, refreshToken, c.req.header('user-agent') || null)

  setAccessTokenCookie(c, accessToken)
  setRefreshTokenCookie(c, refreshToken)

  return c.json(
    {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        language: user.language || 'fr',
        avatarUrl: user.avatarUrl,
        roles: user.roles,
        hasPassword: !!user.passwordHash,
      },
    },
    201
  )
}

export const login = async (c: C) => {
  const body = await c.req.json()
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 422)
  }
  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.passwordHash) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const isValid = await bcrypt.compare(password, user.passwordHash)
  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  if (!user.username) {
    const username = await generateUniqueUsername()
    await prisma.user.update({ where: { id: user.id }, data: { username } })
    user.username = username
  }

  const tokenId = generateTokenId()
  const accessToken = signAccessToken({ sub: user.id, email: user.email, roles: user.roles })
  const refreshToken = signRefreshToken({ sub: user.id, tokenId })

  await cleanupAndCreateToken(user.id, refreshToken, c.req.header('user-agent') || null)

  setAccessTokenCookie(c, accessToken)
  setRefreshTokenCookie(c, refreshToken)

  return c.json({
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
}

export const googleAuth = (c: C) => {
  const mobile = c.req.query('mobile')
  const returnUrl = c.req.query('returnUrl')
  let state: string | undefined
  if (mobile === 'true') {
    state = returnUrl ? `mobile:${returnUrl}` : 'mobile'
  }
  const authUrl = getGoogleAuthURL(state)
  return c.redirect(authUrl)
}

export const googleCallback = async (c: C) => {
  try {
    const code = c.req.query('code')

    if (!code) {
      return c.json({ error: 'Missing authorization code' }, 400)
    }

    const googleInfo = await getGoogleUserInfo(code)
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

    // Mobile: redirect to app with tokens
    const state = c.req.query('state')
    if (state?.startsWith('mobile')) {
      const params = new URLSearchParams({ accessToken, refreshToken })
      let redirectBase = 'poplist://auth'
      if (state.startsWith('mobile:')) {
        redirectBase = state.slice('mobile:'.length)
      }
      return c.redirect(`${redirectBase}?${params.toString()}`)
    }

    // Web: postMessage to opener
    const clientURL = getClientURL()
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Successful</title></head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                status: 'success',
                accessToken: '${accessToken}',
                refreshToken: '${refreshToken}'
              }, '${clientURL}');
              window.close();
            } else {
              window.location.href = '${clientURL}';
            }
          </script>
          <p>Authentication successful. You can close this window.</p>
        </body>
      </html>
    `)
  } catch (error) {
    console.error('Google OAuth error:', error)
    const clientURL = getClientURL()
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Failed</title></head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ status: 'error', message: 'Authentication failed' }, '${clientURL}');
              window.close();
            } else {
              window.location.href = '${clientURL}';
            }
          </script>
          <p>Authentication failed. You can close this window.</p>
        </body>
      </html>
    `)
  }
}

export const refresh = async (c: C) => {
  try {
    const refreshToken = getCookie(c, 'refreshToken')

    if (!refreshToken) {
      return c.json({ error: 'Refresh token required' }, 401)
    }

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

    setAccessTokenCookie(c, newAccessToken)
    setRefreshTokenCookie(c, newRefreshToken)

    return c.json({ message: 'Tokens refreshed' })
  } catch {
    return c.json({ error: 'Invalid or expired refresh token' }, 401)
  }
}

export const logout = async (c: C) => {
  const refreshToken = getCookie(c, 'refreshToken')

  if (refreshToken) {
    const tokenHash = hashToken(refreshToken)
    try {
      const payload = verifyRefreshToken(refreshToken)
      await prisma.refreshToken.deleteMany({
        where: { userId: payload.sub, tokenHash },
      })
    } catch {
      // Token invalid or expired, continue with logout
    }
  }

  clearAuthCookies(c)
  return c.json({ message: 'Logged out successfully' })
}

export const setTokens = async (c: C) => {
  const body = await c.req.json()
  const parsed = setTokensSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed' }, 422)
  }

  setAccessTokenCookie(c, parsed.data.accessToken)
  setRefreshTokenCookie(c, parsed.data.refreshToken)

  return c.json({ message: 'Tokens set successfully' })
}

export const checkUsernameAvailability = async (c: C) => {
  const username = c.req.param('username')

  if (!username || username.length < 3 || username.length > 20) {
    return c.json({ error: 'Username must be between 3 and 20 characters' }, 400)
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return c.json({ error: 'Username can only contain letters, numbers, and underscores' }, 400)
  }

  const existingUser = await prisma.user.findUnique({ where: { username } })

  return c.json({ available: !existingUser, username })
}

export const me = async (c: C) => {
  const user = c.get('user')!

  const fullUser = await prisma.user.findUnique({ where: { id: user.sub } })
  if (!fullUser) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({
    user: {
      id: fullUser.id,
      email: fullUser.email,
      username: fullUser.username,
      language: fullUser.language || 'fr',
      avatarUrl: fullUser.avatarUrl,
      roles: fullUser.roles,
      createdAt: fullUser.createdAt,
      hasPassword: !!fullUser.passwordHash,
    },
  })
}

export const updateUsername = async (c: C) => {
  const user = c.get('user')!
  const body = await c.req.json()
  const parsed = updateUsernameSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 422)
  }

  const fullUser = await prisma.user.findUnique({ where: { id: user.sub } })
  if (!fullUser) {
    return c.json({ error: 'User not found' }, 404)
  }

  const existingUser = await prisma.user.findUnique({ where: { username: parsed.data.username } })
  if (existingUser && existingUser.id !== fullUser.id) {
    return c.json({ error: 'Username already taken' }, 409)
  }

  const updated = await prisma.user.update({
    where: { id: user.sub },
    data: { username: parsed.data.username },
  })

  return c.json({
    user: {
      id: updated.id,
      email: updated.email,
      username: updated.username,
      language: updated.language || 'fr',
      avatarUrl: updated.avatarUrl,
      roles: updated.roles,
      hasPassword: !!updated.passwordHash,
    },
  })
}

export const changePassword = async (c: C) => {
  const user = c.get('user')!
  const body = await c.req.json()
  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 422)
  }

  const fullUser = await prisma.user.findUnique({ where: { id: user.sub } })
  if (!fullUser) {
    return c.json({ error: 'User not found' }, 404)
  }

  if (!fullUser.passwordHash) {
    return c.json({ error: 'Cannot change password for OAuth accounts' }, 400)
  }

  const isValid = await bcrypt.compare(parsed.data.oldPassword, fullUser.passwordHash)
  if (!isValid) {
    return c.json({ error: 'Invalid old password' }, 401)
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 10)
  await prisma.user.update({ where: { id: user.sub }, data: { passwordHash: newHash } })

  return c.json({ message: 'Password changed successfully' })
}

export const updateLanguage = async (c: C) => {
  const user = c.get('user')!
  const body = await c.req.json()
  const parsed = updateLanguageSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 422)
  }

  const updated = await prisma.user.update({
    where: { id: user.sub },
    data: { language: parsed.data.language },
  })

  return c.json({
    user: {
      id: updated.id,
      email: updated.email,
      username: updated.username,
      language: updated.language,
      avatarUrl: updated.avatarUrl,
      roles: updated.roles,
      hasPassword: !!updated.passwordHash,
    },
  })
}

export const deleteAccount = async (c: C) => {
  const user = c.get('user')!
  const body = await c.req.json()
  const parsed = deleteAccountSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 422)
  }

  const userId = user.sub

  await prisma.watchlistLike.deleteMany({ where: { userId } })
  await prisma.savedWatchlist.deleteMany({ where: { userId } })
  await prisma.userWatchlistPosition.deleteMany({ where: { userId } })

  const userWatchlists = await prisma.watchlist.findMany({
    where: { ownerId: userId },
    select: { id: true },
  })
  const watchlistIds = userWatchlists.map(w => w.id)

  if (watchlistIds.length > 0) {
    await prisma.savedWatchlist.deleteMany({
      where: { watchlistId: { in: watchlistIds } },
    })
  }

  await prisma.watchlist.deleteMany({ where: { ownerId: userId } })
  await prisma.refreshToken.deleteMany({ where: { userId } })

  clearAuthCookies(c)

  await prisma.user.delete({ where: { id: userId } })

  return c.json({ message: 'Account deleted successfully' })
}
