import { Router } from 'express';
import * as tmdbController from '../controllers/tmdb.controller.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';

const router = Router();

// Toutes les routes TMDB avec cache de 30 jours
// Ces routes sont publiques (pas d'auth requise)
// ⚠️ IMPORTANT: Les routes spécifiques doivent être définies AVANT les routes génériques avec params dynamiques

// Trending content (doit être avant /:type/:id/similar)
router.get('/trending/:timeWindow', cacheMiddleware(30), tmdbController.getTrending);

// Discover with filters (doit être avant /:type/:id/similar)
router.get('/discover/:type', cacheMiddleware(30), tmdbController.discover);

// Genres list (doit être avant /:type/:id/similar)
router.get('/genre/:type/list', cacheMiddleware(30), tmdbController.getGenres);

// Popular content (doit être avant /:type/:id/similar)
router.get('/:type/popular', cacheMiddleware(30), tmdbController.getPopular);

// Top rated content (doit être avant /:type/:id/similar)
router.get('/:type/top_rated', cacheMiddleware(30), tmdbController.getTopRated);

// Similar content (route générique, doit être EN DERNIER)
router.get('/:type/:id/similar', cacheMiddleware(30), tmdbController.getSimilar);

export default router;
