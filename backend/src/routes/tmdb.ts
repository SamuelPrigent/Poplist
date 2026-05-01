import { Hono } from 'hono';
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

const tmdbRoutes = new Hono<AppEnv>()
  .get('/trending/:timeWindow', zValidator('query', trendingQuerySchema), (c) =>
    TmdbController.getTrending(c)
  )
  .get('/discover/:type', zValidator('query', discoverQuerySchema), (c) =>
    TmdbController.discover(c)
  )
  .get('/genre/:type/list', zValidator('query', genresQuerySchema), (c) =>
    TmdbController.getGenres(c)
  )
  .get('/:type/popular', zValidator('query', popularQuerySchema), (c) =>
    TmdbController.getPopular(c)
  )
  .get('/:type/top_rated', zValidator('query', topRatedQuerySchema), (c) =>
    TmdbController.getTopRated(c)
  )
  .get('/:type/:id/providers', zValidator('query', providersQuerySchema), (c) =>
    TmdbController.getProviders(c)
  )
  .get('/:type/:id/similar', zValidator('query', similarQuerySchema), (c) =>
    TmdbController.getSimilar(c)
  );

export type TmdbRoutes = typeof tmdbRoutes;
export default tmdbRoutes;
