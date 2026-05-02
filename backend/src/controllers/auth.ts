import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'
import bcrypt from 'bcrypt'
import { and, asc, eq, inArray, lt, or } from 'drizzle-orm'
import type { AuthAPI } from '@poplist/shared'
import { db } from '../db/index.js'
import { refreshTokens, savedWatchlists, userWatchlistPositions, users, watchlistLikes, watchlists } from '../db/schema.js'
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
import type { z } from 'zod'
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

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateUsernameInput = z.infer<typeof updateUsernameSchema>
export type UpdateLanguageInput = z.infer<typeof updateLanguageSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>
export type SetTokensInput = z.infer<typeof setTokensSchema>

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

export const signup = async (c: C, data: SignupInput) => {
  const { email, password } = data

  const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1)
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
        hasPassword: !!user.passwordHash,
      },
    } satisfies AuthAPI.SignupResponse,
    201
  )
}

export const login = async (c: C, data: LoginInput) => {
  const { email, password } = data

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

  setAccessTokenCookie(c, accessToken)
  setRefreshTokenCookie(c, refreshToken)

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      language: user.language || 'fr',
      avatarUrl: user.avatarUrl,
      hasPassword: !!user.passwordHash,
    },
  } satisfies AuthAPI.LoginResponse)
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

    setAccessTokenCookie(c, newAccessToken)
    setRefreshTokenCookie(c, newRefreshToken)

    return c.json({ message: 'Tokens refreshed' } satisfies AuthAPI.RefreshResponse)
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
      await db
        .delete(refreshTokens)
        .where(and(eq(refreshTokens.userId, payload.sub), eq(refreshTokens.tokenHash, tokenHash)))
    } catch {
      // Token invalid or expired, continue with logout
    }
  }

  clearAuthCookies(c)
  return c.json({ message: 'Logged out successfully' } satisfies AuthAPI.LogoutResponse)
}

export const setTokens = async (c: C, data: SetTokensInput) => {
  setAccessTokenCookie(c, data.accessToken)
  setRefreshTokenCookie(c, data.refreshToken)

  return c.json({ message: 'Tokens set successfully' } satisfies AuthAPI.SetTokensResponse)
}

export const checkUsernameAvailability = async (c: C) => {
  const username = c.req.param('username') as string

  if (!username || username.length < 3 || username.length > 20) {
    return c.json({ error: 'Username must be between 3 and 20 characters' }, 400)
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return c.json({ error: 'Username can only contain letters, numbers, and underscores' }, 400)
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1)

  return c.json({ available: !existingUser, username } satisfies AuthAPI.CheckUsernameResponse)
}

export const me = async (c: C) => {
  const user = c.get('user')!

  const [fullUser] = await db.select().from(users).where(eq(users.id, user.sub)).limit(1)
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
      createdAt: fullUser.createdAt?.toISOString() ?? null,
      hasPassword: !!fullUser.passwordHash,
    },
  } satisfies AuthAPI.MeResponse)
}

export const updateUsername = async (c: C, data: UpdateUsernameInput) => {
  const user = c.get('user')!

  const [fullUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, user.sub))
    .limit(1)
  if (!fullUser) {
    return c.json({ error: 'User not found' }, 404)
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, data.username))
    .limit(1)
  if (existingUser && existingUser.id !== fullUser.id) {
    return c.json({ error: 'Username already taken' }, 409)
  }

  const [updated] = await db
    .update(users)
    .set({ username: data.username })
    .where(eq(users.id, user.sub))
    .returning()

  return c.json({
    user: {
      id: updated.id,
      email: updated.email,
      username: updated.username,
      language: updated.language || 'fr',
      avatarUrl: updated.avatarUrl,
      hasPassword: !!updated.passwordHash,
    },
  } satisfies AuthAPI.UpdateUsernameResponse)
}

export const changePassword = async (c: C, data: ChangePasswordInput) => {
  const user = c.get('user')!

  const [fullUser] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.sub))
    .limit(1)
  if (!fullUser) {
    return c.json({ error: 'User not found' }, 404)
  }

  if (!fullUser.passwordHash) {
    return c.json({ error: 'Cannot change password for OAuth accounts' }, 400)
  }

  const isValid = await bcrypt.compare(data.oldPassword, fullUser.passwordHash)
  if (!isValid) {
    return c.json({ error: 'Invalid old password' }, 401)
  }

  const newHash = await bcrypt.hash(data.newPassword, 10)
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, user.sub))

  return c.json({ message: 'Password changed successfully' } satisfies AuthAPI.ChangePasswordResponse)
}

export const updateLanguage = async (c: C, data: UpdateLanguageInput) => {
  const user = c.get('user')!

  const [updated] = await db
    .update(users)
    .set({ language: data.language })
    .where(eq(users.id, user.sub))
    .returning()

  return c.json({
    user: {
      id: updated.id,
      email: updated.email,
      username: updated.username,
      language: updated.language,
      avatarUrl: updated.avatarUrl,
      hasPassword: !!updated.passwordHash,
    },
  } satisfies AuthAPI.UpdateLanguageResponse)
}

export const deleteAccount = async (c: C, _data: DeleteAccountInput) => {
  const user = c.get('user')!

  const userId = user.sub

  await db.delete(watchlistLikes).where(eq(watchlistLikes.userId, userId))
  await db.delete(savedWatchlists).where(eq(savedWatchlists.userId, userId))
  await db.delete(userWatchlistPositions).where(eq(userWatchlistPositions.userId, userId))

  const userWatchlists = await db
    .select({ id: watchlists.id })
    .from(watchlists)
    .where(eq(watchlists.ownerId, userId))
  const watchlistIds = userWatchlists.map(w => w.id)

  if (watchlistIds.length > 0) {
    await db.delete(savedWatchlists).where(inArray(savedWatchlists.watchlistId, watchlistIds))
  }

  await db.delete(watchlists).where(eq(watchlists.ownerId, userId))
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId))

  clearAuthCookies(c)

  await db.delete(users).where(eq(users.id, userId))

  return c.json({ message: 'Account deleted successfully' } satisfies AuthAPI.DeleteAccountResponse)
}
