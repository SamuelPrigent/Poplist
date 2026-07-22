/**
 * SDK auth — adaptateur fin sur les fonctions client générées par Kubb.
 * Interface publique conservée. Les bodies sont typés par les types de
 * requête générés.
 */
import * as gen from '@poplist/shared/generated/client/authController/index';
import type { UpdateLanguageMutationRequest } from '@poplist/shared/generated';

export const auth = {
  signup: (email: string, password: string) => gen.signup({ email, password }),

  login: (email: string, password: string) => gen.login({ email, password }),

  logout: () => gen.logout(),

  me: () => gen.me(),

  refresh: () => gen.refresh(),

  checkUsername: (username: string) => gen.checkUsernameAvailability(encodeURIComponent(username)),

  updateUsername: (username: string) => gen.updateUsername({ username }),

  changePassword: (oldPassword: string, newPassword: string) =>
    gen.changePassword({ oldPassword, newPassword }),

  updateLanguage: (language: UpdateLanguageMutationRequest['language']) =>
    gen.updateLanguage({ language }),

  deleteAccount: (confirmation: 'confirmer') => gen.deleteAccount({ confirmation }),
};
