/**
 * Schémas zod des RÉPONSES /auth/*.
 */
import { z } from 'zod';
import { userSchema } from './entities.schemas.js';

const userWrapper = z.object({ user: userSchema });
const messageWrapper = z.object({ message: z.string() });

export const signupResponseSchema = userWrapper.meta({ ref: 'SignupResponse' });
export const loginResponseSchema = userWrapper.meta({ ref: 'LoginResponse' });
export const meResponseSchema = userWrapper.meta({ ref: 'MeResponse' });
export const updateUsernameResponseSchema = userWrapper.meta({ ref: 'UpdateUsernameResponse' });
export const updateLanguageResponseSchema = userWrapper.meta({ ref: 'UpdateLanguageResponse' });
export const changePasswordResponseSchema = messageWrapper.meta({ ref: 'ChangePasswordResponse' });
export const deleteAccountResponseSchema = messageWrapper.meta({ ref: 'DeleteAccountResponse' });
export const logoutResponseSchema = messageWrapper.meta({ ref: 'LogoutResponse' });
export const refreshResponseSchema = messageWrapper.meta({ ref: 'RefreshResponse' });
export const setTokensResponseSchema = messageWrapper.meta({ ref: 'SetTokensResponse' });
export const checkUsernameResponseSchema = z
  .object({ available: z.boolean(), username: z.string() })
  .meta({ ref: 'CheckUsernameResponse' });
