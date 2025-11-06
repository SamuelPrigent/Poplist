import { OAuth2Client } from 'google-auth-library';

// Lazy initialization to ensure env vars are loaded
let googleOAuthClient: OAuth2Client | null = null;

function getOAuthConfig() {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
  const BACKEND_URL = `http://localhost:${process.env.PORT || '3000'}`;
  const REDIRECT_URI = `${BACKEND_URL}/auth/google/callback`;

  console.log('🔍 [Google Config] CLIENT_ID:', CLIENT_ID ? `✅ ${CLIENT_ID.substring(0, 20)}...` : '❌ EMPTY');
  console.log('🔍 [Google Config] CLIENT_SECRET:', CLIENT_SECRET ? '✅ Present' : '❌ EMPTY');
  console.log('🔍 [Google Config] REDIRECT_URI:', REDIRECT_URI);

  return { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI };
}

function getGoogleOAuthClient(): OAuth2Client {
  if (!googleOAuthClient) {
    const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = getOAuthConfig();

    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('Missing Google OAuth credentials. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
    }

    googleOAuthClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    console.log('🟢 [Google Client] OAuth2Client initialized successfully');
  }
  return googleOAuthClient;
}

// Export CLIENT_URL for use in controllers (lazy eval)
export function getClientURL(): string {
  return process.env.CLIENT_URL || 'http://localhost:5173';
}

export function getGoogleAuthURL(): string {
  const client = getGoogleOAuthClient();
  const { REDIRECT_URI } = getOAuthConfig();

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  console.log('🔵 [Google Lib] Generating OAuth URL with redirect:', REDIRECT_URI);

  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'select_account',
  });

  console.log('🔵 [Google Lib] Generated URL (first 100 chars):', authUrl.substring(0, 100));

  return authUrl;
}

export async function getGoogleUserInfo(code: string) {
  const client = getGoogleOAuthClient();
  const { CLIENT_ID } = getOAuthConfig();

  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error('Failed to get user info from Google');
  }

  return {
    googleId: payload.sub,
    email: payload.email!,
    name: payload.name,
    picture: payload.picture,
  };
}
