/**
 * Schémas zod des RÉPONSES /user/*.
 */
import { z } from 'zod';
import { userSchema, userProfilePublicSchema, watchlistSchema } from './entities.schemas.js';

export const getProfileResponseSchema = z
  .object({ user: userSchema })
  .meta({ ref: 'GetProfileResponse' });

export const getUserProfileByUsernameResponseSchema = z
  .object({
    user: userProfilePublicSchema,
    watchlists: z.array(watchlistSchema),
    totalPublicWatchlists: z.number(),
  })
  .meta({ ref: 'GetUserProfileByUsernameResponse' });

export const uploadAvatarResponseSchema = z
  .object({ user: userSchema, avatarUrl: z.string() })
  .meta({ ref: 'UploadAvatarResponse' });

export const deleteAvatarResponseSchema = z
  .object({ message: z.string(), user: userSchema })
  .meta({ ref: 'DeleteAvatarResponse' });
