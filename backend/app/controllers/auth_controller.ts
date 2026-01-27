import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import bcrypt from 'bcrypt'
import { User, Watchlist, RefreshToken } from '#models/index'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateTokenId,
  REFRESH_TOKEN_EXPIRY_DAYS,
} from '#services/jwt_service'
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
} from '#services/cookie_service'
import { getGoogleAuthURL, getGoogleUserInfo, getClientURL } from '#services/google_oauth_service'
import { generateUniqueUsername } from '#services/username_service'
import {
  signupValidator,
  loginValidator,
  updateUsernameValidator,
  updateLanguageValidator,
  changePasswordValidator,
  deleteAccountValidator,
  setTokensValidator,
} from '#validators/auth_validator'

export default class AuthController {
  async signup({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(signupValidator)

    const existingUser = await User.findBy('email', email)
    if (existingUser) {
      return response.conflict({ error: 'User already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const username = await generateUniqueUsername()

    const user = await User.create({
      email,
      username,
      passwordHash,
      roles: ['user'],
      language: 'fr',
    })

    const tokenId = generateTokenId()
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    })
    const refreshToken = signRefreshToken({
      sub: user.id,
      tokenId,
    })

    // Cleanup tokens expirés + limite à 5 sessions simultanées
    await RefreshToken.query()
      .where('userId', user.id)
      .where('expiresAt', '<', DateTime.now().toJSDate())
      .delete()

    const existingTokens = await RefreshToken.query()
      .where('userId', user.id)
      .orderBy('issuedAt', 'asc')

    if (existingTokens.length >= 5) {
      await existingTokens[0].delete()
    }

    await RefreshToken.create({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      issuedAt: DateTime.now(),
      expiresAt: DateTime.now().plus({ days: REFRESH_TOKEN_EXPIRY_DAYS }),
      userAgent: request.header('user-agent') || null,
    })

    setAccessTokenCookie(response, accessToken)
    setRefreshTokenCookie(response, refreshToken)

    return response.created({
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

  async login({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.findBy('email', email)
    if (!user || !user.passwordHash) {
      return response.unauthorized({ error: 'Invalid credentials' })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return response.unauthorized({ error: 'Invalid credentials' })
    }

    if (!user.username) {
      user.username = await generateUniqueUsername()
      await user.save()
    }

    const tokenId = generateTokenId()
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    })
    const refreshToken = signRefreshToken({
      sub: user.id,
      tokenId,
    })

    // Cleanup tokens expirés + limite à 5 sessions simultanées
    await RefreshToken.query()
      .where('userId', user.id)
      .where('expiresAt', '<', DateTime.now().toJSDate())
      .delete()

    const existingTokens = await RefreshToken.query()
      .where('userId', user.id)
      .orderBy('issuedAt', 'asc')

    if (existingTokens.length >= 5) {
      await existingTokens[0].delete()
    }

    await RefreshToken.create({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      issuedAt: DateTime.now(),
      expiresAt: DateTime.now().plus({ days: REFRESH_TOKEN_EXPIRY_DAYS }),
      userAgent: request.header('user-agent') || null,
    })

    setAccessTokenCookie(response, accessToken)
    setRefreshTokenCookie(response, refreshToken)

    return response.ok({
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

  async googleAuth({ response }: HttpContext) {
    const authUrl = getGoogleAuthURL()
    return response.redirect(authUrl)
  }

  async googleCallback({ request, response }: HttpContext) {
    try {
      const code = request.input('code')

      if (!code || typeof code !== 'string') {
        return response.badRequest({ error: 'Missing authorization code' })
      }

      const googleInfo = await getGoogleUserInfo(code)
      const { googleId } = googleInfo
      const email = googleInfo.email || ''

      if (!email) {
        return response.badRequest({ error: 'Could not retrieve email from Google' })
      }

      let user = await User.query().where('googleId', googleId).orWhere('email', email).first()

      if (!user) {
        const username = await generateUniqueUsername()
        user = await User.create({
          email,
          username,
          googleId,
          roles: ['user'],
          language: 'fr',
        })
      } else {
        let needsSave = false

        if (!user.googleId) {
          user.googleId = googleId
          needsSave = true
        }

        if (!user.username) {
          user.username = await generateUniqueUsername()
          needsSave = true
        }

        if (needsSave) {
          await user.save()
        }
      }

      const tokenId = generateTokenId()
      const accessToken = signAccessToken({
        sub: user.id,
        email: user.email,
        roles: user.roles,
      })
      const refreshToken = signRefreshToken({
        sub: user.id,
        tokenId,
      })

      // Cleanup tokens expirés + limite à 5 sessions simultanées
      await RefreshToken.query()
        .where('userId', user.id)
        .where('expiresAt', '<', DateTime.now().toJSDate())
        .delete()

      const existingTokens = await RefreshToken.query()
        .where('userId', user.id)
        .orderBy('issuedAt', 'asc')

      if (existingTokens.length >= 5) {
        await existingTokens[0].delete()
      }

      await RefreshToken.create({
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        issuedAt: DateTime.now(),
        expiresAt: DateTime.now().plus({ days: REFRESH_TOKEN_EXPIRY_DAYS }),
        userAgent: request.header('user-agent') || null,
      })

      const clientURL = getClientURL()
      return response.send(`
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
      return response.send(`
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

  async refresh({ request, response }: HttpContext) {
    try {
      // Try both signed and plain cookies
      let refreshToken = request.cookie('refreshToken')
      if (!refreshToken) {
        refreshToken = request.plainCookie('refreshToken')
      }

      if (!refreshToken) {
        return response.unauthorized({ error: 'Refresh token required' })
      }

      const payload = verifyRefreshToken(refreshToken)
      const tokenHash = hashToken(refreshToken)

      const user = await User.find(payload.sub)
      if (!user) {
        return response.unauthorized({ error: 'User not found' })
      }

      const existingToken = await RefreshToken.query()
        .where('userId', user.id)
        .where('tokenHash', tokenHash)
        .first()

      if (!existingToken) {
        return response.unauthorized({ error: 'Invalid refresh token' })
      }

      // Delete old token
      await existingToken.delete()

      const newTokenId = generateTokenId()
      const newAccessToken = signAccessToken({
        sub: user.id,
        email: user.email,
        roles: user.roles,
      })
      const newRefreshToken = signRefreshToken({
        sub: user.id,
        tokenId: newTokenId,
      })

      await RefreshToken.create({
        userId: user.id,
        tokenHash: hashToken(newRefreshToken),
        issuedAt: DateTime.now(),
        expiresAt: DateTime.now().plus({ days: REFRESH_TOKEN_EXPIRY_DAYS }),
        userAgent: request.header('user-agent') || null,
      })

      setAccessTokenCookie(response, newAccessToken)
      setRefreshTokenCookie(response, newRefreshToken)

      return response.ok({ message: 'Tokens refreshed' })
    } catch {
      return response.unauthorized({ error: 'Invalid or expired refresh token' })
    }
  }

  async logout({ request, response }: HttpContext) {
    const refreshToken = request.cookie('refreshToken')

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken)

      try {
        const payload = verifyRefreshToken(refreshToken)
        await RefreshToken.query()
          .where('userId', payload.sub)
          .where('tokenHash', tokenHash)
          .delete()
      } catch {
        // Token invalid or expired, continue with logout
      }
    }

    clearAuthCookies(response)
    return response.ok({ message: 'Logged out successfully' })
  }

  async me({ user, response }: HttpContext) {
    if (!user) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const fullUser = await User.find(user.sub)

    if (!fullUser) {
      return response.notFound({ error: 'User not found' })
    }

    return response.ok({
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

  async updateUsername({ request, response, user }: HttpContext) {
    if (!user) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const { username } = await request.validateUsing(updateUsernameValidator)

    const fullUser = await User.find(user.sub)
    if (!fullUser) {
      return response.notFound({ error: 'User not found' })
    }

    const existingUser = await User.findBy('username', username)
    if (existingUser && existingUser.id !== fullUser.id) {
      return response.conflict({ error: 'Username already taken' })
    }

    fullUser.username = username
    await fullUser.save()

    return response.ok({
      user: {
        id: fullUser.id,
        email: fullUser.email,
        username: fullUser.username,
        language: fullUser.language || 'fr',
        avatarUrl: fullUser.avatarUrl,
        roles: fullUser.roles,
        hasPassword: !!fullUser.passwordHash,
      },
    })
  }

  async updateLanguage({ request, response, user }: HttpContext) {
    if (!user) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const { language } = await request.validateUsing(updateLanguageValidator)

    const fullUser = await User.find(user.sub)
    if (!fullUser) {
      return response.notFound({ error: 'User not found' })
    }

    fullUser.language = language
    await fullUser.save()

    return response.ok({
      user: {
        id: fullUser.id,
        email: fullUser.email,
        username: fullUser.username,
        language: fullUser.language,
        avatarUrl: fullUser.avatarUrl,
        roles: fullUser.roles,
        hasPassword: !!fullUser.passwordHash,
      },
    })
  }

  async changePassword({ request, response, user }: HttpContext) {
    if (!user) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const { oldPassword, newPassword } = await request.validateUsing(changePasswordValidator)

    const fullUser = await User.find(user.sub)
    if (!fullUser) {
      return response.notFound({ error: 'User not found' })
    }

    if (!fullUser.passwordHash) {
      return response.badRequest({ error: 'Cannot change password for OAuth accounts' })
    }

    const isValid = await bcrypt.compare(oldPassword, fullUser.passwordHash)
    if (!isValid) {
      return response.unauthorized({ error: 'Invalid old password' })
    }

    fullUser.passwordHash = await bcrypt.hash(newPassword, 10)
    await fullUser.save()

    return response.ok({ message: 'Password changed successfully' })
  }

  async deleteAccount({ request, response, user }: HttpContext) {
    if (!user?.sub) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    await request.validateUsing(deleteAccountValidator)

    const userId = user.sub

    // Remove user from likedBy on all watchlists
    const db = (await import('@adonisjs/lucid/services/db')).default
    await db.from('watchlist_likes').where('user_id', userId).delete()

    // Get user's watchlist IDs
    const userWatchlists = await Watchlist.query().where('ownerId', userId).select('id')
    const watchlistIds = userWatchlists.map((w) => w.id)

    // Remove user's watchlists from other users' saved_watchlists
    if (watchlistIds.length > 0) {
      await db.from('saved_watchlists').whereIn('watchlist_id', watchlistIds).delete()
    }

    // Delete user's watchlists (cascade will delete items)
    await Watchlist.query().where('ownerId', userId).delete()

    // Delete user's refresh tokens
    await RefreshToken.query().where('userId', userId).delete()

    clearAuthCookies(response)

    // Delete user
    const fullUser = await User.find(userId)
    if (fullUser) {
      await fullUser.delete()
    }

    return response.ok({ message: 'Account deleted successfully' })
  }

  async checkUsernameAvailability({ params, response }: HttpContext) {
    const { username } = params

    if (!username || username.length < 3 || username.length > 20) {
      return response.badRequest({ error: 'Username must be between 3 and 20 characters' })
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return response.badRequest({
        error: 'Username can only contain letters, numbers, and underscores',
      })
    }

    const existingUser = await User.findBy('username', username)

    return response.ok({
      available: !existingUser,
      username,
    })
  }

  async setTokens({ request, response }: HttpContext) {
    const { accessToken, refreshToken } = await request.validateUsing(setTokensValidator)

    setAccessTokenCookie(response, accessToken)
    setRefreshTokenCookie(response, refreshToken)

    return response.ok({ message: 'Tokens set successfully' })
  }
}
