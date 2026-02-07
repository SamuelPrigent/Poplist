import { Hono } from 'hono';
import { auth } from '../middleware/auth.js';
import * as UsersController from '../controllers/users.js';
import type { AppEnv } from '../app.js';

const userRoutes = new Hono<AppEnv>();

// Public
userRoutes.get('/profile/:username', UsersController.getUserProfileByUsername);

// Protected
userRoutes.get('/profile', auth, UsersController.getProfile);
userRoutes.post('/upload-avatar', auth, UsersController.uploadAvatar);
userRoutes.delete('/avatar', auth, UsersController.deleteAvatar);

export default userRoutes;
