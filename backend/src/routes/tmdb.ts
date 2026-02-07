import { Hono } from 'hono';
import * as TmdbController from '../controllers/tmdb.js';
import type { AppEnv } from '../app.js';

const tmdbRoutes = new Hono<AppEnv>();

tmdbRoutes.get('/trending/:timeWindow', TmdbController.getTrending);
tmdbRoutes.get('/discover/:type', TmdbController.discover);
tmdbRoutes.get('/genre/:type/list', TmdbController.getGenres);
tmdbRoutes.get('/:type/popular', TmdbController.getPopular);
tmdbRoutes.get('/:type/top_rated', TmdbController.getTopRated);
tmdbRoutes.get('/:type/:id/providers', TmdbController.getProviders);
tmdbRoutes.get('/:type/:id/similar', TmdbController.getSimilar);

export default tmdbRoutes;
