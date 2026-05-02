import type { UsersAPI } from '@poplist/shared';
import { apiFetch } from './client';

export const users = {
  getProfile: () => apiFetch<UsersAPI.GetProfileResponse>('/user/profile'),

  getByUsername: (username: string) =>
    apiFetch<UsersAPI.GetUserProfileByUsernameResponse>(
      `/user/profile/${encodeURIComponent(username)}`
    ),

  uploadAvatar: (imageData: string) =>
    apiFetch<UsersAPI.UploadAvatarResponse>('/user/upload-avatar', {
      method: 'POST',
      body: { imageData } satisfies UsersAPI.UploadAvatarRequest,
    }),

  deleteAvatar: () =>
    apiFetch<UsersAPI.DeleteAvatarResponse>('/user/avatar', { method: 'DELETE' }),
};
