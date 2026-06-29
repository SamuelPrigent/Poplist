import { setCookie, deleteCookie } from 'hono/cookie'
import type { Context } from 'hono'
import { env } from '../env.js'

const isProduction = env.NODE_ENV === 'production'

const commonOptions = {
  httpOnly: true,
  sameSite: 'Lax' as const,
  secure: isProduction,
  path: '/',
}

export function setAccessTokenCookie(c: Context, token: string): void {
  setCookie(c, 'accessToken', token, {
    ...commonOptions,
    maxAge: 60 * 60, // 1 hour
  })
}

export function setRefreshTokenCookie(c: Context, token: string): void {
  setCookie(c, 'refreshToken', token, {
    ...commonOptions,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  })
}

export function clearAuthCookies(c: Context): void {
  deleteCookie(c, 'accessToken', { path: '/' })
  deleteCookie(c, 'refreshToken', { path: '/' })
}
