import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { auth, optionalAuth } from '../middleware/auth.js';
import * as WatchlistsController from '../controllers/watchlists.js';
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
} from '../validators/watchlists.js';
import type { AppEnv } from '../app.js';

const watchlistRoutes = new Hono<AppEnv>()
  // ========================================
  // Public routes
  // ========================================
  .get('/public/featured', optionalAuth, zValidator('query', limitQuerySchema), (c) =>
    WatchlistsController.getPublicFeatured(c)
  )
  .get('/public/:id', (c) => WatchlistsController.getPublicWatchlist(c))
  .get('/by-genre/:genre', (c) => WatchlistsController.getWatchlistsByGenre(c))
  .get('/count-by-genre/:genre', (c) => WatchlistsController.getWatchlistCountByGenre(c))
  .get('/search/tmdb', zValidator('query', tmdbSearchQuerySchema), (c) =>
    WatchlistsController.searchTMDB(c)
  )
  .get('/items/:tmdbId/:type/details', zValidator('query', languageQuerySchema), (c) =>
    WatchlistsController.getItemDetails(c)
  )
  // ========================================
  // Protected routes
  // ========================================
  .get('/mine', auth, (c) => WatchlistsController.getMyWatchlists(c))
  .post('/', auth, zValidator('json', createWatchlistSchema), (c) =>
    WatchlistsController.createWatchlist(c, c.req.valid('json'))
  )
  .put('/reorder', auth, zValidator('json', reorderWatchlistsSchema), (c) =>
    WatchlistsController.reorderWatchlists(c, c.req.valid('json'))
  )
  .get('/:id', auth, (c) => WatchlistsController.getWatchlistById(c))
  .put('/:id', auth, zValidator('json', updateWatchlistSchema), (c) =>
    WatchlistsController.updateWatchlist(c, c.req.valid('json'))
  )
  .delete('/:id', auth, (c) => WatchlistsController.deleteWatchlist(c))
  // Collaborator management
  .post('/:id/collaborators', auth, zValidator('json', addCollaboratorSchema), (c) =>
    WatchlistsController.addCollaborator(c, c.req.valid('json'))
  )
  .delete('/:id/collaborators/:collaboratorId', auth, (c) =>
    WatchlistsController.removeCollaborator(c)
  )
  .post('/:id/leave', auth, (c) => WatchlistsController.leaveWatchlist(c))
  // Item management
  .post('/:id/items', auth, zValidator('json', addItemSchema), (c) =>
    WatchlistsController.addItemToWatchlist(c, c.req.valid('json'))
  )
  .delete('/:id/items/:tmdbId', auth, (c) => WatchlistsController.removeItemFromWatchlist(c))
  .put('/:id/items/:tmdbId/position', auth, zValidator('json', moveItemSchema), (c) =>
    WatchlistsController.moveItemPosition(c, c.req.valid('json'))
  )
  .put('/:id/items/reorder', auth, zValidator('json', reorderItemsSchema), (c) =>
    WatchlistsController.reorderItems(c, c.req.valid('json'))
  )
  // Cover management
  .post('/:id/upload-cover', auth, zValidator('json', uploadCoverSchema), (c) =>
    WatchlistsController.uploadCover(c, c.req.valid('json'))
  )
  .delete('/:id/cover', auth, (c) => WatchlistsController.deleteCover(c))
  // Thumbnail generation
  .post('/:id/generate-thumbnail', auth, (c) => WatchlistsController.generateWatchlistThumbnail(c))
  // Save/Unsave/Duplicate
  .post('/:id/like-and-save', auth, (c) => WatchlistsController.saveWatchlist(c))
  .delete('/:id/unlike-and-unsave', auth, (c) => WatchlistsController.unsaveWatchlist(c))
  .post('/:id/duplicate', auth, (c) => WatchlistsController.duplicateWatchlist(c));

export type WatchlistRoutes = typeof watchlistRoutes;
export default watchlistRoutes;
