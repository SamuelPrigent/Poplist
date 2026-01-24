import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { verifyAccessToken } from '#services/jwt_service'

export default class OptionalAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Try both signed and plain cookies
    let accessToken = ctx.request.cookie('accessToken')
    if (!accessToken) {
      accessToken = ctx.request.plainCookie('accessToken')
    }

    if (accessToken) {
      try {
        const payload = verifyAccessToken(accessToken)
        ctx.user = payload
        ctx.request.user = payload
      } catch {
        // Silently ignore invalid tokens for optional auth
      }
    }

    return next()
  }
}
