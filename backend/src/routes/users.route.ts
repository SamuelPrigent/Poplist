import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { describeRoute } from 'hono-openapi';
import { jsonBody, ok } from './_openapi.helpers.js';
import { auth } from '../middleware/auth.middleware.js';
import * as UsersController from '../controllers/users.controller.js';
import { uploadAvatarSchema } from '../validators/users.validator.js';
import {
  getProfileResponseSchema,
  getUserProfileByUsernameResponseSchema,
  uploadAvatarResponseSchema,
  deleteAvatarResponseSchema,
} from '../schemas/users.schemas.js';
import type { AppEnv } from '../app.js';

const TAG = 'users';

const userRoutes = new Hono<AppEnv>()
  // Public
  .get(
    '/profile/:username',
    describeRoute({
      operationId: 'getUserProfileByUsername',
      tags: [TAG],
      responses: ok(getUserProfileByUsernameResponseSchema, 'Profil public + watchlists'),
    }),
    (c) => UsersController.getUserProfileByUsername(c),
  )
  // Protected
  .get(
    '/profile',
    auth,
    describeRoute({
      operationId: 'getProfile',
      tags: [TAG],
      responses: ok(getProfileResponseSchema, 'Profil du user connecté'),
    }),
    (c) => UsersController.getProfile(c),
  )
  .post(
    '/upload-avatar',
    auth,
    describeRoute({
      operationId: 'uploadAvatar',
      tags: [TAG],
      requestBody: jsonBody(uploadAvatarSchema),
      responses: ok(uploadAvatarResponseSchema, 'Avatar uploadé'),
    }),
    zValidator('json', uploadAvatarSchema),
    (c) => UsersController.uploadAvatar(c, c.req.valid('json')),
  )
  .delete(
    '/avatar',
    auth,
    describeRoute({
      operationId: 'deleteAvatar',
      tags: [TAG],
      responses: ok(deleteAvatarResponseSchema, 'Avatar supprimé'),
    }),
    (c) => UsersController.deleteAvatar(c),
  );

export default userRoutes;
