import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { describeRoute } from 'hono-openapi';
import { jsonBody, ok } from './_openapi.helpers.js';
import { auth } from '../middleware/auth.middleware.js';
import * as AuthController from '../controllers/auth.controller.js';
import {
  signupSchema,
  loginSchema,
  setTokensSchema,
  updateUsernameSchema,
  updateLanguageSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from '../validators/auth.validator.js';
import {
  signupResponseSchema,
  loginResponseSchema,
  meResponseSchema,
  updateUsernameResponseSchema,
  updateLanguageResponseSchema,
  changePasswordResponseSchema,
  deleteAccountResponseSchema,
  logoutResponseSchema,
  refreshResponseSchema,
  setTokensResponseSchema,
  checkUsernameResponseSchema,
} from '../schemas/auth.schemas.js';
import type { AppEnv } from '../app.js';

const TAG = 'auth';

const authRoutes = new Hono<AppEnv>()
  // Public
  .post(
    '/signup',
    describeRoute({
      operationId: 'signup',
      tags: [TAG],
      requestBody: jsonBody(signupSchema),
      responses: ok(signupResponseSchema, 'Compte créé'),
    }),
    zValidator('json', signupSchema),
    (c) => AuthController.signup(c, c.req.valid('json')),
  )
  .post(
    '/login',
    describeRoute({
      operationId: 'login',
      tags: [TAG],
      requestBody: jsonBody(loginSchema),
      responses: ok(loginResponseSchema, 'Connexion réussie'),
    }),
    zValidator('json', loginSchema),
    (c) => AuthController.login(c, c.req.valid('json')),
  )
  // Google OAuth : redirections navigateur (302), pas de réponse JSON → hors spec.
  .get('/google', (c) => AuthController.googleAuth(c))
  .get('/google/callback', (c) => AuthController.googleCallback(c))
  .post(
    '/refresh',
    describeRoute({
      operationId: 'refresh',
      tags: [TAG],
      responses: ok(refreshResponseSchema, 'Token rafraîchi'),
    }),
    (c) => AuthController.refresh(c),
  )
  .post(
    '/logout',
    describeRoute({
      operationId: 'logout',
      tags: [TAG],
      responses: ok(logoutResponseSchema, 'Déconnecté'),
    }),
    (c) => AuthController.logout(c),
  )
  .post(
    '/set-tokens',
    describeRoute({
      operationId: 'setTokens',
      tags: [TAG],
      requestBody: jsonBody(setTokensSchema),
      responses: ok(setTokensResponseSchema, 'Tokens posés en cookies'),
    }),
    zValidator('json', setTokensSchema),
    (c) => AuthController.setTokens(c, c.req.valid('json')),
  )
  .get(
    '/username/check/:username',
    describeRoute({
      operationId: 'checkUsernameAvailability',
      tags: [TAG],
      responses: ok(checkUsernameResponseSchema, 'Disponibilité du username'),
    }),
    (c) => AuthController.checkUsernameAvailability(c),
  )
  // Protected
  .get(
    '/me',
    auth,
    describeRoute({
      operationId: 'me',
      tags: [TAG],
      responses: ok(meResponseSchema, 'User connecté'),
    }),
    (c) => AuthController.me(c),
  )
  .put(
    '/profile/username',
    auth,
    describeRoute({
      operationId: 'updateUsername',
      tags: [TAG],
      requestBody: jsonBody(updateUsernameSchema),
      responses: ok(updateUsernameResponseSchema, 'Username mis à jour'),
    }),
    zValidator('json', updateUsernameSchema),
    (c) => AuthController.updateUsername(c, c.req.valid('json')),
  )
  .put(
    '/profile/password',
    auth,
    describeRoute({
      operationId: 'changePassword',
      tags: [TAG],
      requestBody: jsonBody(changePasswordSchema),
      responses: ok(changePasswordResponseSchema, 'Mot de passe changé'),
    }),
    zValidator('json', changePasswordSchema),
    (c) => AuthController.changePassword(c, c.req.valid('json')),
  )
  .put(
    '/profile/language',
    auth,
    describeRoute({
      operationId: 'updateLanguage',
      tags: [TAG],
      requestBody: jsonBody(updateLanguageSchema),
      responses: ok(updateLanguageResponseSchema, 'Langue mise à jour'),
    }),
    zValidator('json', updateLanguageSchema),
    (c) => AuthController.updateLanguage(c, c.req.valid('json')),
  )
  .delete(
    '/profile/account',
    auth,
    describeRoute({
      operationId: 'deleteAccount',
      tags: [TAG],
      requestBody: jsonBody(deleteAccountSchema),
      responses: ok(deleteAccountResponseSchema, 'Compte supprimé'),
    }),
    zValidator('json', deleteAccountSchema),
    (c) => AuthController.deleteAccount(c, c.req.valid('json')),
  );

export default authRoutes;
