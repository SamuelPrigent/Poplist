import { Router } from 'express';
import * as watchlistController from '../controllers/watchlist.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Protected routes
router.get('/mine', requireAuth, watchlistController.getMyWatchlists);
router.post('/', requireAuth, watchlistController.createWatchlist);
router.put('/:id', requireAuth, watchlistController.updateWatchlist);
router.delete('/:id', requireAuth, watchlistController.deleteWatchlist);
router.post('/:id/share', requireAuth, watchlistController.createShareLink);
router.post('/:id/collaborators', requireAuth, watchlistController.addCollaborator);

// Public routes
router.get('/public/:id', watchlistController.getPublicWatchlist);

export default router;
