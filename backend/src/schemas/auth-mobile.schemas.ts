/**
 * Schémas zod des RÉPONSES /auth/mobile/* (consommées par l'app Android).
 */
import { z } from 'zod';
import { userSchema } from './entities.schemas.js';

// ===== Inputs (documentation spec ; les controllers parsent eux-mêmes) =====

export const googleAuthMobileRequestSchema = z.object({
  code: z.string(),
  redirectUri: z.string(),
});
export const loginMobileRequestSchema = z.object({
  email: z.string(),
  password: z.string(),
});
export const signupMobileRequestSchema = loginMobileRequestSchema;
export const refreshMobileRequestSchema = z.object({ refreshToken: z.string() });
export const logoutMobileRequestSchema = z.object({ refreshToken: z.string() });

const authTokensSchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
    user: userSchema,
  })
  .meta({ ref: 'AuthTokensMobileResponse' });

export const googleAuthMobileResponseSchema = authTokensSchema;
export const loginMobileResponseSchema = authTokensSchema;
export const signupMobileResponseSchema = authTokensSchema;

export const refreshMobileResponseSchema = z
  .object({ accessToken: z.string(), refreshToken: z.string() })
  .meta({ ref: 'RefreshMobileResponse' });

export const logoutMobileResponseSchema = z
  .object({ message: z.string() })
  .meta({ ref: 'LogoutMobileResponse' });
