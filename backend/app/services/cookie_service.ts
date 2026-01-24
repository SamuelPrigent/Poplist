import type { HttpContext } from '@adonisjs/core/http'

const isProduction = process.env.NODE_ENV === 'production'

// Avec le proxy Next.js rewrites, on ne spécifie pas de domain
// Les cookies sont automatiquement sur le domaine du frontend
const commonOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProduction,
  path: '/',
}

export function setAccessTokenCookie(response: HttpContext['response'], token: string): void {
  response.plainCookie('accessToken', token, {
    ...commonOptions,
    maxAge: 60 * 60, // 1 hour in seconds (AdonisJS uses seconds, not ms)
  })
}

export function setRefreshTokenCookie(response: HttpContext['response'], token: string): void {
  response.plainCookie('refreshToken', token, {
    ...commonOptions,
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  })
}

export function clearAuthCookies(response: HttpContext['response']): void {
  response.clearCookie('accessToken')
  response.clearCookie('refreshToken')
}
