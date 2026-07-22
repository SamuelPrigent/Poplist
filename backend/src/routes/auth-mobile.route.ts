import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { jsonBody, ok } from './_openapi.helpers.js';
import * as AuthMobileController from '../controllers/auth-mobile.controller.js';
import {
  googleAuthMobileRequestSchema,
  loginMobileRequestSchema,
  signupMobileRequestSchema,
  refreshMobileRequestSchema,
  logoutMobileRequestSchema,
  googleAuthMobileResponseSchema,
  loginMobileResponseSchema,
  signupMobileResponseSchema,
  refreshMobileResponseSchema,
  logoutMobileResponseSchema,
} from '../schemas/auth-mobile.schemas.js';
import type { AppEnv } from '../app.js';

const TAG = 'authMobile';

const authMobileRoutes = new Hono<AppEnv>();

authMobileRoutes.post(
  '/google',
  describeRoute({
    operationId: 'googleAuthMobile',
    tags: [TAG],
    requestBody: jsonBody(googleAuthMobileRequestSchema),
    responses: ok(googleAuthMobileResponseSchema, 'Tokens + user via Google OAuth'),
  }),
  AuthMobileController.googleAuthMobile,
);
authMobileRoutes.post(
  '/login',
  describeRoute({
    operationId: 'loginMobile',
    tags: [TAG],
    requestBody: jsonBody(loginMobileRequestSchema),
    responses: ok(loginMobileResponseSchema, 'Tokens + user'),
  }),
  AuthMobileController.loginMobile,
);
authMobileRoutes.post(
  '/signup',
  describeRoute({
    operationId: 'signupMobile',
    tags: [TAG],
    requestBody: jsonBody(signupMobileRequestSchema),
    responses: ok(signupMobileResponseSchema, 'Tokens + user'),
  }),
  AuthMobileController.signupMobile,
);
authMobileRoutes.post(
  '/refresh',
  describeRoute({
    operationId: 'refreshMobile',
    tags: [TAG],
    requestBody: jsonBody(refreshMobileRequestSchema),
    responses: ok(refreshMobileResponseSchema, 'Nouveaux tokens'),
  }),
  AuthMobileController.refreshMobile,
);
authMobileRoutes.post(
  '/logout',
  describeRoute({
    operationId: 'logoutMobile',
    tags: [TAG],
    requestBody: jsonBody(logoutMobileRequestSchema),
    responses: ok(logoutMobileResponseSchema, 'Refresh token révoqué'),
  }),
  AuthMobileController.logoutMobile,
);

export default authMobileRoutes;
