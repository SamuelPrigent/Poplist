import { Hono } from 'hono';
import * as AuthMobileController from '../controllers/auth-mobile.js';
import type { AppEnv } from '../app.js';

const authMobileRoutes = new Hono<AppEnv>();

authMobileRoutes.post('/google', AuthMobileController.googleAuthMobile);
authMobileRoutes.post('/refresh', AuthMobileController.refreshMobile);
authMobileRoutes.post('/logout', AuthMobileController.logoutMobile);

export default authMobileRoutes;
