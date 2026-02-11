import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';
import { env } from './env.js';
import authRoutes from './routes/auth.js';
import authMobileRoutes from './routes/auth-mobile.js';
import userRoutes from './routes/users.js';
import tmdbRoutes from './routes/tmdb.js';
import watchlistRoutes from './routes/watchlists.js';

export type AppEnv = {
  Variables: {
    user?: {
      sub: string;
      email: string;
      roles: string[];
    };
  };
};

const app = new Hono<AppEnv>();

// Logger
app.use('*', logger());

// CORS
app.use(
  '*',
  cors({
    origin: env.CLIENT_URL,
    allowMethods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
    exposeHeaders: ['X-Cache', 'X-Cache-Date'],
    credentials: true,
    maxAge: 90,
  })
);

// Health check
app.get('/', c => c.json({ status: 'ok' }));
app.get('/health', c => c.json({ status: 'ok' }));

// Image proxy for TMDB images (matches AdonisJS API: ?path=/poster_path)
app.get('/image-proxy', async c => {
  const imagePath = c.req.query('path');

  if (!imagePath || !imagePath.startsWith('/')) {
    return c.json({ error: 'Invalid image path' }, 400);
  }

  const imageUrl = `https://image.tmdb.org/t/p/original${imagePath}`;
  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return c.json({ error: 'Image not found' }, 404);
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return c.json({ error: 'Failed to proxy image' }, 500);
  }
});

// Routes
app.route('/auth', authRoutes);
app.route('/auth/mobile', authMobileRoutes);
app.route('/user', userRoutes);
app.route('/tmdb', tmdbRoutes);
app.route('/watchlists', watchlistRoutes);

// Global error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  const status = (err as any).status || 500;
  if (status !== 401 && status !== 404) {
    console.error('');
    console.error('ERROR:', err.message);
    console.error('  Route:', c.req.method, c.req.url);
    console.error('  Status:', status);
    if (env.NODE_ENV === 'development' && err.stack) {
      console.error('  Stack:', err.stack.split('\n').slice(1, 4).join('\n'));
    }
    console.error('');
  }

  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
