import { Hono } from 'hono';
import { auth, optionalAuth } from '../middleware/auth.js';
import * as WatchlistsController from '../controllers/watchlists.js';
import type { AppEnv } from '../app.js';

const watchlistRoutes = new Hono<AppEnv>();

// ========================================
// Public routes
// ========================================
watchlistRoutes.get('/public/featured', optionalAuth, WatchlistsController.getPublicFeatured);
watchlistRoutes.get('/public/:id', WatchlistsController.getPublicWatchlist);
watchlistRoutes.get('/by-genre/:genre', WatchlistsController.getWatchlistsByGenre);
watchlistRoutes.get('/count-by-genre/:genre', WatchlistsController.getWatchlistCountByGenre);
watchlistRoutes.get('/search/tmdb', WatchlistsController.searchTMDB);
watchlistRoutes.get('/items/:tmdbId/:type/details', WatchlistsController.getItemDetails);

// ========================================
// Protected routes
// ========================================
watchlistRoutes.get('/mine', auth, WatchlistsController.getMyWatchlists);
watchlistRoutes.post('/', auth, WatchlistsController.createWatchlist);
watchlistRoutes.put('/reorder', auth, WatchlistsController.reorderWatchlists);
watchlistRoutes.get('/:id', auth, WatchlistsController.getWatchlistById);
watchlistRoutes.put('/:id', auth, WatchlistsController.updateWatchlist);
watchlistRoutes.delete('/:id', auth, WatchlistsController.deleteWatchlist);

// Collaborator management
watchlistRoutes.post('/:id/collaborators', auth, WatchlistsController.addCollaborator);
watchlistRoutes.delete(
  '/:id/collaborators/:collaboratorId',
  auth,
  WatchlistsController.removeCollaborator
);
watchlistRoutes.post('/:id/leave', auth, WatchlistsController.leaveWatchlist);

// Item management
watchlistRoutes.post('/:id/items', auth, WatchlistsController.addItemToWatchlist);
watchlistRoutes.delete('/:id/items/:tmdbId', auth, WatchlistsController.removeItemFromWatchlist);
watchlistRoutes.put('/:id/items/:tmdbId/position', auth, WatchlistsController.moveItemPosition);
watchlistRoutes.put('/:id/items/reorder', auth, WatchlistsController.reorderItems);

// Cover management
watchlistRoutes.post('/:id/upload-cover', auth, WatchlistsController.uploadCover);
watchlistRoutes.delete('/:id/cover', auth, WatchlistsController.deleteCover);

// Thumbnail generation
watchlistRoutes.post(
  '/:id/generate-thumbnail',
  auth,
  WatchlistsController.generateWatchlistThumbnail
);

// Save/Unsave/Duplicate
watchlistRoutes.post('/:id/like-and-save', auth, WatchlistsController.saveWatchlist);
watchlistRoutes.delete('/:id/unlike-and-unsave', auth, WatchlistsController.unsaveWatchlist);
watchlistRoutes.post('/:id/duplicate', auth, WatchlistsController.duplicateWatchlist);

export default watchlistRoutes;
