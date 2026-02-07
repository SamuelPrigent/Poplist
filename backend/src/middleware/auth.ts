import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { verifyAccessToken } from '../services/jwt.js';
import type { AppEnv } from '../app.js';

export const auth = createMiddleware<AppEnv>(async (c, next) => {
  const accessToken = getCookie(c, 'accessToken');

  if (!accessToken) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const payload = verifyAccessToken(accessToken);
    c.set('user', payload);
    return next();
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
});

export const optionalAuth = createMiddleware<AppEnv>(async (c, next) => {
  const accessToken = getCookie(c, 'accessToken');

  if (accessToken) {
    try {
      const payload = verifyAccessToken(accessToken);
      c.set('user', payload);
    } catch {
      // Silently ignore invalid tokens for optional auth
    }
  }

  return next();
});
