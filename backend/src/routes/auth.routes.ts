import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Email/password auth
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Google OAuth
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

// Token management
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// User profile
router.get('/me', requireAuth, authController.me);

export default router;
