/**
 * SDK users — adaptateur fin sur les fonctions client générées par Kubb.
 * Interface publique conservée.
 */
import * as gen from '@poplist/shared/generated/client/usersController/index';

export const users = {
  getProfile: () => gen.getProfile(),

  getByUsername: (username: string) => gen.getUserProfileByUsername(encodeURIComponent(username)),

  uploadAvatar: (imageData: string) => gen.uploadAvatar({ imageData }),

  deleteAvatar: () => gen.deleteAvatar(),
};
