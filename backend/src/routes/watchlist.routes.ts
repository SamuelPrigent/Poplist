import { Router } from 'express';
import * as watchlistController from '../controllers/watchlist.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';

const router = Router();

// Protected routes
router.get('/mine', requireAuth, watchlistController.getMyWatchlists);
router.post('/', requireAuth, watchlistController.createWatchlist);

// Reorder route - MUST be before /:id routes to avoid conflict
router.put('/reorder', requireAuth, watchlistController.reorderWatchlists);

// Specific ID routes
router.get('/:id', requireAuth, watchlistController.getWatchlistById);
router.put('/:id', requireAuth, watchlistController.updateWatchlist);
router.delete('/:id', requireAuth, watchlistController.deleteWatchlist);
router.post('/:id/collaborators', requireAuth, watchlistController.addCollaborator);
router.delete(
  '/:id/collaborators/:collaboratorId',
  requireAuth,
  watchlistController.removeCollaborator
);
router.post('/:id/leave', requireAuth, watchlistController.leaveWatchlist);

// Item management routes
router.post('/:id/items', requireAuth, watchlistController.addItemToWatchlist);
router.delete('/:id/items/:tmdbId', requireAuth, watchlistController.removeItemFromWatchlist);
router.put('/:id/items/:tmdbId/position', requireAuth, watchlistController.moveItemPosition);
router.put('/:id/items/reorder', requireAuth, watchlistController.reorderItems);

// Cover management routes
router.post('/:id/upload-cover', requireAuth, watchlistController.uploadCover);
router.delete('/:id/cover', requireAuth, watchlistController.deleteCover);

// Thumbnail generation route
router.post('/:id/generate-thumbnail', requireAuth, watchlistController.generateWatchlistThumbnail);

// Like and Save/Unlike and Unsave/Duplicate routes
router.post('/:id/like-and-save', requireAuth, watchlistController.saveWatchlist);
router.delete('/:id/unlike-and-unsave', requireAuth, watchlistController.unsaveWatchlist);
router.post('/:id/duplicate', requireAuth, watchlistController.duplicateWatchlist);

// Public routes
router.get('/public/featured', watchlistController.getPublicWatchlists);
router.get('/public/:id', watchlistController.getPublicWatchlist);

// Category filtering (no auth required)
router.get('/by-category/:category', watchlistController.getWatchlistsByCategory);
router.get('/count-by-category/:category', watchlistController.getWatchlistCountByCategory);

// Search route (no auth required) - avec cache 30 jours
router.get('/search/tmdb', cacheMiddleware(30), watchlistController.searchTMDB);

// Get full item details (no auth required) - avec cache 30 jours
router.get('/items/:tmdbId/:type/details', cacheMiddleware(30), watchlistController.getItemDetails);

export default router;
