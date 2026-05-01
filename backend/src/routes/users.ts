import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { auth } from '../middleware/auth.js';
import * as UsersController from '../controllers/users.js';
import { uploadAvatarSchema } from '../validators/users.js';
import type { AppEnv } from '../app.js';

const userRoutes = new Hono<AppEnv>()
  // Public
  .get('/profile/:username', (c) => UsersController.getUserProfileByUsername(c))
  // Protected
  .get('/profile', auth, (c) => UsersController.getProfile(c))
  .post('/upload-avatar', auth, zValidator('json', uploadAvatarSchema), (c) =>
    UsersController.uploadAvatar(c, c.req.valid('json'))
  )
  .delete('/avatar', auth, (c) => UsersController.deleteAvatar(c));

export type UserRoutes = typeof userRoutes;
export default userRoutes;
