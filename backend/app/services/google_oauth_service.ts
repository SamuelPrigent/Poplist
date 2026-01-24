import { OAuth2Client } from 'google-auth-library'

let googleOAuthClient: OAuth2Client | null = null

function getOAuthConfig() {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
  const REDIRECT_URI =
    process.env.GOOGLE_REDIRECT_URI ||
    `http://localhost:${process.env.PORT || '3456'}/auth/google/callback`

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
  return process.env.CLIENT_URL || 'http://localhost:3001'
}

export function getGoogleAuthURL(): string {
  const client = getGoogleOAuthClient()

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ]

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'select_account',
  })
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
