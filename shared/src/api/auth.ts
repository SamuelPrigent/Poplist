/**
 * Contracts API pour les routes /auth/*
 */
import type { User } from '../entities/user.js';

// ===== Requests =====

export interface SignupRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateUsernameRequest {
  username: string;
}

export interface UpdateLanguageRequest {
  language: 'fr' | 'en' | 'de' | 'es' | 'it' | 'pt';
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface DeleteAccountRequest {
  confirmation: 'confirmer';
}

export interface SetTokensRequest {
  accessToken: string;
  refreshToken: string;
}

// ===== Responses =====

export interface SignupResponse {
  user: User;
}

export interface LoginResponse {
  user: User;
}

export interface MeResponse {
  user: User;
}

export interface UpdateUsernameResponse {
  user: User;
}

export interface UpdateLanguageResponse {
  user: User;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface DeleteAccountResponse {
  message: string;
}

export interface LogoutResponse {
  message: string;
}

export interface RefreshResponse {
  message: string;
}

export interface SetTokensResponse {
  message: string;
}

export interface CheckUsernameResponse {
  available: boolean;
  username: string;
}
