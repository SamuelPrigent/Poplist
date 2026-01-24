import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { verifyAccessToken, type AccessTokenPayload } from '#services/jwt_service'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    user?: AccessTokenPayload
  }
  interface Request {
    user?: AccessTokenPayload
  }
}

export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Try both signed and plain cookies
    let accessToken = ctx.request.cookie('accessToken')
    if (!accessToken) {
      accessToken = ctx.request.plainCookie('accessToken')
    }

    if (!accessToken) {
      return ctx.response.unauthorized({ error: 'Authentication required' })
    }

    try {
      const payload = verifyAccessToken(accessToken)
      ctx.user = payload
      ctx.request.user = payload
      return next()
    } catch {
      return ctx.response.unauthorized({ error: 'Invalid or expired token' })
    }
  }
}
