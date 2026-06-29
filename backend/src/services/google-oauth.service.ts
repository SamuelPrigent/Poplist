import { OAuth2Client } from 'google-auth-library'
import { env } from '../env.js'

let googleOAuthClient: OAuth2Client | null = null

function getOAuthConfig() {
  const CLIENT_ID = env.GOOGLE_CLIENT_ID
  const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET
  const REDIRECT_URI =
    env.GOOGLE_REDIRECT_URI ||
    `http://localhost:${env.PORT}/auth/google/callback`

  return { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI }
}

function getGoogleOAuthClient(): OAuth2Client {
  if (!googleOAuthClient) {
    const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = getOAuthConfig()

    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error(
        'Missing Google OAuth credentials. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env'
      )
    }

    googleOAuthClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
  }
  return googleOAuthClient
}

export function getClientURL(): string {
  return env.CLIENT_URL
}

export function getGoogleAuthURL(state?: string): string {
  const client = getGoogleOAuthClient()

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ]

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'select_account',
    ...(state ? { state } : {}),
  })
}

// Mobile: verify an idToken obtained directly from Google Sign-In SDK
export async function verifyGoogleIdToken(idToken: string) {
  const { CLIENT_ID } = getOAuthConfig()
  const client = getGoogleOAuthClient()

  const ticket = await client.verifyIdToken({
    idToken,
    audience: CLIENT_ID,
  })

  const payload = ticket.getPayload()

  if (!payload) {
    throw new Error('Failed to get user info from Google')
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  }
}

// Mobile: exchange an authorization code using a custom redirect URI (Expo proxy)
export async function exchangeGoogleCodeMobile(code: string, redirectUri: string) {
  const { CLIENT_ID, CLIENT_SECRET } = getOAuthConfig()
  const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, redirectUri)

  const { tokens } = await client.getToken(code)

  if (!tokens?.id_token) {
    throw new Error('Missing id_token from Google token exchange')
  }

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: CLIENT_ID,
  })

  const payload = ticket.getPayload()
  if (!payload) {
    throw new Error('Failed to get user info from Google')
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  }
}

export async function getGoogleUserInfo(code: string) {
  const client = getGoogleOAuthClient()
  const { CLIENT_ID } = getOAuthConfig()

  const { tokens } = await client.getToken(code)
  client.setCredentials(tokens)

  if (!tokens?.id_token) {
    throw new Error('Missing id_token')
  }

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: CLIENT_ID,
  })

  const payload = ticket.getPayload()

  if (!payload) {
    throw new Error('Failed to get user info from Google')
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  }
}
