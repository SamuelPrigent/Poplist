import type { AuthAPI } from '@poplist/shared';
import { apiFetch } from './client';

export const auth = {
  signup: (email: string, password: string) =>
    apiFetch<AuthAPI.SignupResponse>('/auth/signup', {
      method: 'POST',
      body: { email, password } satisfies AuthAPI.SignupRequest,
    }),

  login: (email: string, password: string) =>
    apiFetch<AuthAPI.LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password } satisfies AuthAPI.LoginRequest,
    }),

  logout: () =>
    apiFetch<AuthAPI.LogoutResponse>('/auth/logout', { method: 'POST' }),

  me: () => apiFetch<AuthAPI.MeResponse>('/auth/me'),

  refresh: () =>
    apiFetch<AuthAPI.RefreshResponse>('/auth/refresh', { method: 'POST' }),

  checkUsername: (username: string) =>
    apiFetch<AuthAPI.CheckUsernameResponse>(
      `/auth/username/check/${encodeURIComponent(username)}`
    ),

  updateUsername: (username: string) =>
    apiFetch<AuthAPI.UpdateUsernameResponse>('/auth/profile/username', {
      method: 'PUT',
      body: { username } satisfies AuthAPI.UpdateUsernameRequest,
    }),

  changePassword: (oldPassword: string, newPassword: string) =>
    apiFetch<AuthAPI.ChangePasswordResponse>('/auth/profile/password', {
      method: 'PUT',
      body: { oldPassword, newPassword } satisfies AuthAPI.ChangePasswordRequest,
    }),

  updateLanguage: (language: AuthAPI.UpdateLanguageRequest['language']) =>
    apiFetch<AuthAPI.UpdateLanguageResponse>('/auth/profile/language', {
      method: 'PUT',
      body: { language } satisfies AuthAPI.UpdateLanguageRequest,
    }),

  deleteAccount: (confirmation: 'confirmer') =>
    apiFetch<AuthAPI.DeleteAccountResponse>('/auth/profile/account', {
      method: 'DELETE',
      body: { confirmation } satisfies AuthAPI.DeleteAccountRequest,
    }),
};
