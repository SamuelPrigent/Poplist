import { Hono } from 'hono';
import { auth } from '../middleware/auth.js';
import * as AuthController from '../controllers/auth.js';
import type { AppEnv } from '../app.js';

const authRoutes = new Hono<AppEnv>();

// Public
authRoutes.post('/signup', AuthController.signup);
authRoutes.post('/login', AuthController.login);
authRoutes.get('/google', AuthController.googleAuth);
authRoutes.get('/google/callback', AuthController.googleCallback);
authRoutes.post('/refresh', AuthController.refresh);
authRoutes.post('/logout', AuthController.logout);
authRoutes.post('/set-tokens', AuthController.setTokens);
authRoutes.get('/username/check/:username', AuthController.checkUsernameAvailability);

// Protected
authRoutes.get('/me', auth, AuthController.me);
authRoutes.put('/profile/username', auth, AuthController.updateUsername);
authRoutes.put('/profile/password', auth, AuthController.changePassword);
authRoutes.put('/profile/language', auth, AuthController.updateLanguage);
authRoutes.delete('/profile/account', auth, AuthController.deleteAccount);

export default authRoutes;
