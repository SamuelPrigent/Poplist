import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { auth } from '../middleware/auth.js';
import * as AuthController from '../controllers/auth.js';
import {
  signupSchema,
  loginSchema,
  setTokensSchema,
  updateUsernameSchema,
  updateLanguageSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from '../validators/auth.js';
import type { AppEnv } from '../app.js';

const authRoutes = new Hono<AppEnv>()
  // Public
  .post('/signup', zValidator('json', signupSchema), c =>
    AuthController.signup(c, c.req.valid('json'))
  )
  .post('/login', zValidator('json', loginSchema), c =>
    AuthController.login(c, c.req.valid('json'))
  )
  .get('/google', c => AuthController.googleAuth(c))
  .get('/google/callback', c => AuthController.googleCallback(c))
  .post('/refresh', c => AuthController.refresh(c))
  .post('/logout', c => AuthController.logout(c))
  .post('/set-tokens', zValidator('json', setTokensSchema), c =>
    AuthController.setTokens(c, c.req.valid('json'))
  )
  .get('/username/check/:username', c => AuthController.checkUsernameAvailability(c))
  // Protected
  .get('/me', auth, c => AuthController.me(c))
  .put('/profile/username', auth, zValidator('json', updateUsernameSchema), c =>
    AuthController.updateUsername(c, c.req.valid('json'))
  )
  .put('/profile/password', auth, zValidator('json', changePasswordSchema), c =>
    AuthController.changePassword(c, c.req.valid('json'))
  )
  .put('/profile/language', auth, zValidator('json', updateLanguageSchema), c =>
    AuthController.updateLanguage(c, c.req.valid('json'))
  )
  .delete('/profile/account', auth, zValidator('json', deleteAccountSchema), c =>
    AuthController.deleteAccount(c, c.req.valid('json'))
  );

export default authRoutes;
