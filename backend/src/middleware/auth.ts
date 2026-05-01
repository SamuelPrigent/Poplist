import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { verifyAccessToken } from '../services/jwt.js';
import type { AppEnv } from '../app.js';

function extractToken(c: any): string | undefined {
  // Cookie first (web), then Bearer header (mobile)
  const cookie = getCookie(c, 'accessToken');
  if (cookie) return cookie;
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return undefined;
}

// Note: throws HTTPException instead of returning c.json — keeps the route's
// response type clean (only the handler's success path is captured by RPC).
// app.onError wraps HTTPException as { error: message } at runtime.
export const auth = createMiddleware<AppEnv>(async (c, next) => {
  const accessToken = extractToken(c);

  if (!accessToken) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  try {
    const payload = verifyAccessToken(accessToken);
    c.set('user', payload);
  } catch {
    throw new HTTPException(401, { message: 'Invalid or expired token' });
  }

  await next();
});

export const optionalAuth = createMiddleware<AppEnv>(async (c, next) => {
  const accessToken = extractToken(c);

  if (accessToken) {
    try {
      const payload = verifyAccessToken(accessToken);
      c.set('user', payload);
    } catch {
      // Silently ignore invalid tokens for optional auth
    }
  }

  await next();
});
