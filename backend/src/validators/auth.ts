import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const updateUsernameSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/),
});

export const updateLanguageSchema = z.object({
  language: z.enum(['fr', 'en', 'de', 'es', 'it', 'pt']),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(8).max(100),
});

export const deleteAccountSchema = z.object({
  confirmation: z.literal('confirmer'),
});

export const setTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
