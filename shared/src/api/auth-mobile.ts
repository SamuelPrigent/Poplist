/**
 * Contracts API pour les routes /auth/mobile/* (consommées par l'app Android).
 * Le mobile utilise un schéma sans cookies — accessToken et refreshToken sont
 * renvoyés dans le body JSON pour que l'app les stocke côté natif.
 */
import type { User } from '../entities/user.js';

// ===== Requests =====

export interface GoogleAuthMobileRequest {
  code: string;
  redirectUri: string;
}

export interface LoginMobileRequest {
  email: string;
  password: string;
}

export interface SignupMobileRequest {
  email: string;
  password: string;
}

export interface RefreshMobileRequest {
  refreshToken: string;
}

export interface LogoutMobileRequest {
  refreshToken: string;
}

// ===== Responses =====

interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export type GoogleAuthMobileResponse = AuthTokensResponse;
export type LoginMobileResponse = AuthTokensResponse;
export type SignupMobileResponse = AuthTokensResponse;

export interface RefreshMobileResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutMobileResponse {
  message: string;
}
