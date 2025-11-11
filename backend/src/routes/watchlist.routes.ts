import { Router } from 'express';
import * as watchlistController from '../controllers/watchlist.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

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
router.post('/:id/share', requireAuth, watchlistController.createShareLink);
router.post('/:id/collaborators', requireAuth, watchlistController.addCollaborator);

// Item management routes
router.post('/:id/items', requireAuth, watchlistController.addItemToWatchlist);
router.delete('/:id/items/:tmdbId', requireAuth, watchlistController.removeItemFromWatchlist);
router.put('/:id/items/:tmdbId/position', requireAuth, watchlistController.moveItemPosition);
router.put('/:id/items/reorder', requireAuth, watchlistController.reorderItems);

// Cover management routes
router.post('/:id/upload-cover', requireAuth, watchlistController.uploadCover);
router.delete('/:id/cover', requireAuth, watchlistController.deleteCover);

// Public routes
router.get('/public/:id', watchlistController.getPublicWatchlist);

// Search route (no auth required)
router.get('/search/tmdb', watchlistController.searchTMDB);

export default router;
