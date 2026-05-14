import { Hono } from 'hono';
import type { Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as TmdbController from '../controllers/tmdb.js';
import {
  trendingQuerySchema,
  discoverQuerySchema,
  genresQuerySchema,
  popularQuerySchema,
  topRatedQuerySchema,
  providersQuerySchema,
  similarQuerySchema,
} from '../validators/tmdb.js';
import type { AppEnv } from '../app.js';

// TMDB data changes slowly: cache aggressively at CDN/browser level.
// 10 min fresh, 1 h shared, 24 h stale-while-revalidate.
const tmdbCacheHeaders = async (c: Context<AppEnv>, next: () => Promise<void>) => {
  await next();
  c.header('Cache-Control', 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400');
};

const tmdbRoutes = new Hono<AppEnv>()
  .use('*', tmdbCacheHeaders)
  .get('/trending/:timeWindow', zValidator('query', trendingQuerySchema), c =>
    TmdbController.getTrending(c)
  )
  .get('/discover/:type', zValidator('query', discoverQuerySchema), c => TmdbController.discover(c))
  .get('/genre/:type/list', zValidator('query', genresQuerySchema), c =>
    TmdbController.getGenres(c)
  )
  .get('/:type/popular', zValidator('query', popularQuerySchema), c => TmdbController.getPopular(c))
  .get('/:type/top_rated', zValidator('query', topRatedQuerySchema), c =>
    TmdbController.getTopRated(c)
  )
  .get('/:type/:id/providers', zValidator('query', providersQuerySchema), c =>
    TmdbController.getProviders(c)
  )
  .get('/:type/:id/similar', zValidator('query', similarQuerySchema), c =>
    TmdbController.getSimilar(c)
  );

export default tmdbRoutes;
