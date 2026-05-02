/**
 * Contracts API pour les routes /user/*
 */
import type { User, UserProfilePublic } from '../entities/user.js';
import type { Watchlist } from '../entities/watchlist.js';

// ===== Requests =====

export interface UploadAvatarRequest {
  imageData: string;
}

// ===== Responses =====

export interface GetProfileResponse {
  user: User;
}

export interface GetUserProfileByUsernameResponse {
  user: UserProfilePublic;
  watchlists: Watchlist[];
  totalPublicWatchlists: number;
}

export interface UploadAvatarResponse {
  user: User;
  avatarUrl: string;
}

export interface DeleteAvatarResponse {
  message: string;
  user: User;
}
