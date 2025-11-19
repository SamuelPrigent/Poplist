import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All user routes require authentication
router.get('/profile', requireAuth, userController.getProfile);
router.post('/upload-avatar', requireAuth, userController.uploadAvatar);
router.delete('/avatar', requireAuth, userController.deleteAvatar);

export default router;
