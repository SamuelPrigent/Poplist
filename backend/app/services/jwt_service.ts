import * as crypto from 'node:crypto'
import jwt from 'jsonwebtoken'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default_access_secret'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret'

export const REFRESH_TOKEN_EXPIRY_DAYS = 30

export interface AccessTokenPayload {
  sub: string
  email: string
  roles: string[]
}

export interface RefreshTokenPayload {
  sub: string
  tokenId: string
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    // expiresIn: '5s',
    expiresIn: '1h',
  })
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    // expiresIn: '10s',
    expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
  })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function generateTokenId(): string {
  return crypto.randomBytes(16).toString('hex')
}
