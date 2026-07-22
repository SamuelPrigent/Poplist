import { Hono } from 'hono';
import type { Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { describeRoute } from 'hono-openapi';
import { ok, queryParams } from './_openapi.helpers.js';
import * as TmdbController from '../controllers/tmdb.controller.js';
import {
  trendingQuerySchema,
  discoverQuerySchema,
  genresQuerySchema,
  popularQuerySchema,
  topRatedQuerySchema,
  providersQuerySchema,
  similarQuerySchema,
  searchExploreQuerySchema,
} from '../validators/tmdb.validator.js';
import {
  tmdbListResponseSchema,
  tmdbGenresResponseSchema,
  tmdbProvidersResponseSchema,
} from '../schemas/tmdb.schemas.js';
import type { AppEnv } from '../app.js';

const TAG = 'tmdb';

// TMDB data changes slowly: cache aggressively at CDN/browser level.
// 10 min fresh, 1 h shared, 24 h stale-while-revalidate.
const tmdbCacheHeaders = async (c: Context<AppEnv>, next: () => Promise<void>) => {
  await next();
  c.header('Cache-Control', 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400');
};

const tmdbRoutes = new Hono<AppEnv>()
  .use('*', tmdbCacheHeaders)
  .get(
    '/trending/:timeWindow',
    describeRoute({
      operationId: 'getTrending',
      tags: [TAG],
      parameters: queryParams(['language', 'page']),
      responses: ok(tmdbListResponseSchema, 'Tendances TMDB'),
    }),
    zValidator('query', trendingQuerySchema),
    (c) => TmdbController.getTrending(c),
  )
  .get(
    '/discover/:type',
    describeRoute({
      operationId: 'discover',
      tags: [TAG],
      parameters: queryParams([
        'language',
        'page',
        'region',
        'sort_by',
        'with_genres',
        'vote_count.gte',
        'vote_average.gte',
        'primary_release_date.gte',
        'primary_release_date.lte',
        'first_air_date.gte',
        'first_air_date.lte',
      ]),
      responses: ok(tmdbListResponseSchema, 'Discover TMDB'),
    }),
    zValidator('query', discoverQuerySchema),
    (c) => TmdbController.discover(c),
  )
  .get(
    '/search/:type',
    describeRoute({
      operationId: 'searchExplore',
      tags: [TAG],
      parameters: queryParams(
        ['query', 'language', 'page', 'with_genres', 'year_from', 'year_to', 'sort_by'],
        ['query'],
      ),
      responses: ok(tmdbListResponseSchema, 'Recherche TMDB (Explore)'),
    }),
    zValidator('query', searchExploreQuerySchema),
    (c) => TmdbController.searchExplore(c),
  )
  .get(
    '/genre/:type/list',
    describeRoute({
      operationId: 'getGenres',
      tags: [TAG],
      parameters: queryParams(['language']),
      responses: ok(tmdbGenresResponseSchema, 'Liste des genres TMDB'),
    }),
    zValidator('query', genresQuerySchema),
    (c) => TmdbController.getGenres(c),
  )
  .get(
    '/:type/popular',
    describeRoute({
      operationId: 'getPopular',
      tags: [TAG],
      parameters: queryParams(['language', 'page', 'region']),
      responses: ok(tmdbListResponseSchema, 'Populaires TMDB'),
    }),
    zValidator('query', popularQuerySchema),
    (c) => TmdbController.getPopular(c),
  )
  .get(
    '/:type/top_rated',
    describeRoute({
      operationId: 'getTopRated',
      tags: [TAG],
      parameters: queryParams(['language', 'page', 'region']),
      responses: ok(tmdbListResponseSchema, 'Mieux notés TMDB'),
    }),
    zValidator('query', topRatedQuerySchema),
    (c) => TmdbController.getTopRated(c),
  )
  .get(
    '/:type/:id/providers',
    describeRoute({
      operationId: 'getProviders',
      tags: [TAG],
      parameters: queryParams(['language']),
      responses: ok(tmdbProvidersResponseSchema, 'Plateformes de streaming'),
    }),
    zValidator('query', providersQuerySchema),
    (c) => TmdbController.getProviders(c),
  )
  .get(
    '/:type/:id/similar',
    describeRoute({
      operationId: 'getSimilar',
      tags: [TAG],
      parameters: queryParams(['language', 'page']),
      responses: ok(tmdbListResponseSchema, 'Titres similaires TMDB'),
    }),
    zValidator('query', similarQuerySchema),
    (c) => TmdbController.getSimilar(c),
  );

export default tmdbRoutes;
