import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { User } from '../models/User.model.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateTokenId,
} from '../lib/jwt.js';
// cookie non http only pour le moment
import { setAccessTokenCookie, setRefreshTokenCookie, clearAuthCookies } from '../lib/cookies.js';
import { getGoogleAuthURL, getGoogleUserInfo, getClientURL } from '../lib/google.js';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = signupSchema.parse(req.body);

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      passwordHash,
      roles: ['user'],
    });

    // Generate tokens
    const tokenId = generateTokenId();
    const accessToken = signAccessToken({
      sub: user._id.toString(),
      email: user.email,
      roles: user.roles,
    });
    const refreshToken = signRefreshToken({
      sub: user._id.toString(),
      tokenId,
    });

    // Store refresh token hash
    user.refreshTokens.push({
      tokenHash: hashToken(refreshToken),
      issuedAt: new Date(),
      userAgent: req.headers['user-agent'],
    });
    await user.save();

    // Set cookies
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        roles: user.roles,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    throw error;
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate tokens
    const tokenId = generateTokenId();
    const accessToken = signAccessToken({
      sub: user._id.toString(),
      email: user.email,
      roles: user.roles,
    });
    const refreshToken = signRefreshToken({
      sub: user._id.toString(),
      tokenId,
    });

    // Store refresh token hash
    user.refreshTokens.push({
      tokenHash: hashToken(refreshToken),
      issuedAt: new Date(),
      userAgent: req.headers['user-agent'],
    });
    await user.save();

    // Set cookies
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      user: {
        id: user._id,
        email: user.email,
        roles: user.roles,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    throw error;
  }
}

export async function googleAuth(req: Request, res: Response): Promise<void> {
  console.log('🔵 [Google Auth] Starting OAuth flow...');
  console.log(
    '🔵 [Google Auth] Redirect URI configured:',
    process.env.CLIENT_URL || 'http://localhost:5173'
  );
  const authUrl = getGoogleAuthURL();
  console.log('🔵 [Google Auth] Generated auth URL:', authUrl);
  res.redirect(authUrl);
}

export async function googleCallback(req: Request, res: Response): Promise<void> {
  try {
    console.log('🟢 [Google Callback] Received callback from Google');
    console.log('🟢 [Google Callback] Query params:', req.query);

    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      console.error('🔴 [Google Callback] Missing or invalid authorization code');
      res.status(400).json({ error: 'Missing authorization code' });
      return;
    }

    console.log('🟢 [Google Callback] Authorization code received, fetching user info...');

    // Get user info from Google
    const { googleId, email } = await getGoogleUserInfo(code);
    console.log('🟢 [Google Callback] User info retrieved:', { googleId, email });

    // Find or create user
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      user = await User.create({
        email,
        googleId,
        roles: ['user'],
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId;
      await user.save();
    }

    // Generate tokens
    const tokenId = generateTokenId();
    const accessToken = signAccessToken({
      sub: user._id.toString(),
      email: user.email,
      roles: user.roles,
    });
    const refreshToken = signRefreshToken({
      sub: user._id.toString(),
      tokenId,
    });

    // Store refresh token hash
    user.refreshTokens.push({
      tokenHash: hashToken(refreshToken),
      issuedAt: new Date(),
      userAgent: req.headers['user-agent'],
    });
    await user.save();

    // Set cookies
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    // Return popup close page
    const clientURL = getClientURL();
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ status: 'success' }, '${clientURL}');
              window.close();
            } else {
              window.location.href = '${clientURL}';
            }
          </script>
          <p>Authentication successful. You can close this window.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('🔴 [Google Callback] Error during OAuth flow:', error);
    console.error('🔴 [Google Callback] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    const clientURL = getClientURL();
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Failed</title>
        </head>
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
    `);
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token required' });
      return;
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    // Find user and verify token exists
    const user = await User.findById(payload.sub);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const tokenIndex = user.refreshTokens.findIndex(t => t.tokenHash === tokenHash);

    if (tokenIndex === -1) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    // Remove old refresh token
    user.refreshTokens.splice(tokenIndex, 1);

    // Generate new tokens
    const newTokenId = generateTokenId();
    const newAccessToken = signAccessToken({
      sub: user._id.toString(),
      email: user.email,
      roles: user.roles,
    });
    const newRefreshToken = signRefreshToken({
      sub: user._id.toString(),
      tokenId: newTokenId,
    });

    // Store new refresh token hash
    user.refreshTokens.push({
      tokenHash: hashToken(newRefreshToken),
      issuedAt: new Date(),
      userAgent: req.headers['user-agent'],
    });
    await user.save();

    // Set new cookies
    setAccessTokenCookie(res, newAccessToken);
    setRefreshTokenCookie(res, newRefreshToken);

    res.json({ message: 'Tokens refreshed' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);

      try {
        const payload = verifyRefreshToken(refreshToken);
        const user = await User.findById(payload.sub);

        if (user) {
          // Remove this refresh token
          user.refreshTokens = user.refreshTokens.filter(t => t.tokenHash !== tokenHash);
          await user.save();
        }
      } catch (error) {
        // Token invalid or expired, continue with logout
      }
    }

    clearAuthCookies(res);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    throw error;
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user.sub).select('-passwordHash -refreshTokens');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        roles: user.roles,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    throw error;
  }
}
