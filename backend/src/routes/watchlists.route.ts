import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { auth, optionalAuth } from '../middleware/auth.middleware.js';
import * as WatchlistsController from '../controllers/watchlists.controller.js';
import {
  createWatchlistSchema,
  updateWatchlistSchema,
  addCollaboratorSchema,
  addItemSchema,
  moveItemSchema,
  reorderItemsSchema,
  reorderWatchlistsSchema,
  uploadCoverSchema,
  limitQuerySchema,
  tmdbSearchQuerySchema,
  languageQuerySchema,
} from '../validators/watchlists.validator.js';
import type { AppEnv } from '../app.js';
import type { Context } from 'hono';

// Endpoints publics read-only NON personnalisés : cacheables par tous
// (navigateur + CDN). 1 min fresh, 5 min shared, 1 h stale-while-revalidate.
// Sans ces headers, chaque préload/navigation re-téléchargeait tout
// (max-age=0), cf. private/lighthouse.md §7.
const publicCacheHeaders = async (c: Context<AppEnv>, next: () => Promise<void>) => {
  await next();
  c.header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600');
};

// `featured` est personnalisé quand un user est connecté (isOwner/isSaved…) :
// cache public UNIQUEMENT pour les anonymes, private sinon. `Vary: Cookie`
// dans tous les cas pour qu'un cache partagé ne serve jamais la réponse
// personnalisée d'un user à un autre (ni la version anonyme à un connecté).
const featuredCacheHeaders = async (c: Context<AppEnv>, next: () => Promise<void>) => {
  await next();
  c.header('Vary', 'Cookie');
  if (c.get('user')) {
    c.header('Cache-Control', 'private, no-cache');
  } else {
    c.header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600');
  }
};

const watchlistRoutes = new Hono<AppEnv>()
  // ========================================
  // Public routes
  // ========================================
  .get(
    '/public/featured',
    optionalAuth,
    featuredCacheHeaders,
    zValidator('query', limitQuerySchema),
    c => WatchlistsController.getPublicFeatured(c)
  )
  .get('/public/:id', c => WatchlistsController.getPublicWatchlist(c))
  .get('/by-genre/:genre', publicCacheHeaders, c =>
    WatchlistsController.getWatchlistsByGenre(c)
  )
  .get('/count-by-genre/:genre', publicCacheHeaders, c =>
    WatchlistsController.getWatchlistCountByGenre(c)
  )
  .get('/search/tmdb', zValidator('query', tmdbSearchQuerySchema), c =>
    WatchlistsController.searchTMDB(c)
  )
  .get('/items/:tmdbId/:type/details', zValidator('query', languageQuerySchema), c =>
    WatchlistsController.getItemDetails(c)
  )
  // Recommandations (public si liste publique, sinon owner/collaborateur)
  .get('/:id/recommendations', optionalAuth, zValidator('query', languageQuerySchema), c =>
    WatchlistsController.getWatchlistRecommendations(c)
  )
  // ========================================
  // Protected routes
  // ========================================
  .get('/mine', auth, c => WatchlistsController.getMyWatchlists(c))
  .post('/', auth, zValidator('json', createWatchlistSchema), c =>
    WatchlistsController.createWatchlist(c, c.req.valid('json'))
  )
  .put('/reorder', auth, zValidator('json', reorderWatchlistsSchema), c =>
    WatchlistsController.reorderWatchlists(c, c.req.valid('json'))
  )
  .get('/:id', auth, c => WatchlistsController.getWatchlistById(c))
  .put('/:id', auth, zValidator('json', updateWatchlistSchema), c =>
    WatchlistsController.updateWatchlist(c, c.req.valid('json'))
  )
  .delete('/:id', auth, c => WatchlistsController.deleteWatchlist(c))
  // Collaborator management
  .post('/:id/collaborators', auth, zValidator('json', addCollaboratorSchema), c =>
    WatchlistsController.addCollaborator(c, c.req.valid('json'))
  )
  .delete('/:id/collaborators/:collaboratorId', auth, c =>
    WatchlistsController.removeCollaborator(c)
  )
  .post('/:id/leave', auth, c => WatchlistsController.leaveWatchlist(c))
  // Item management
  .post('/:id/items', auth, zValidator('json', addItemSchema), c =>
    WatchlistsController.addItemToWatchlist(c, c.req.valid('json'))
  )
  .delete('/:id/items/:tmdbId', auth, c => WatchlistsController.removeItemFromWatchlist(c))
  .put('/:id/items/:tmdbId/position', auth, zValidator('json', moveItemSchema), c =>
    WatchlistsController.moveItemPosition(c, c.req.valid('json'))
  )
  .put('/:id/items/reorder', auth, zValidator('json', reorderItemsSchema), c =>
    WatchlistsController.reorderItems(c, c.req.valid('json'))
  )
  // Cover management
  .post('/:id/upload-cover', auth, zValidator('json', uploadCoverSchema), c =>
    WatchlistsController.uploadCover(c, c.req.valid('json'))
  )
  .delete('/:id/cover', auth, c => WatchlistsController.deleteCover(c))
  // Thumbnail generation
  .post('/:id/generate-thumbnail', auth, c => WatchlistsController.generateWatchlistThumbnail(c))
  // Save/Unsave/Duplicate
  .post('/:id/like-and-save', auth, c => WatchlistsController.saveWatchlist(c))
  .delete('/:id/unlike-and-unsave', auth, c => WatchlistsController.unsaveWatchlist(c))
  .post('/:id/duplicate', auth, c => WatchlistsController.duplicateWatchlist(c));

export default watchlistRoutes;
