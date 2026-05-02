/**
 * Contracts API pour les routes /watchlists/*
 */
import type { Collaborator, Platform, Watchlist } from '../entities/watchlist.js';
import type { FullMediaDetails, TMDBListResponse } from '../entities/tmdb.js';

// ===== Sub-types pour requests =====

export interface WatchlistItemInput {
  tmdbId: number;
  title: string;
  posterPath?: string | null;
  mediaType: 'movie' | 'tv';
  platformList?: Array<{ name: string; logoPath?: string }>;
  runtime?: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  addedAt?: string;
}

// ===== Requests =====

export interface CreateWatchlistRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
  genres?: string[];
  items?: WatchlistItemInput[];
  fromLocalStorage?: boolean;
}

export interface UpdateWatchlistRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
  genres?: string[];
  items?: WatchlistItemInput[];
}

export interface AddCollaboratorRequest {
  username: string;
}

export interface AddItemRequest {
  tmdbId: string;
  mediaType: 'movie' | 'tv';
  language?: string;
  region?: string;
}

export interface MoveItemRequest {
  position: 'first' | 'last';
}

export interface ReorderItemsRequest {
  orderedTmdbIds: string[];
}

export interface ReorderWatchlistsRequest {
  orderedWatchlistIds: string[];
}

export interface UploadCoverRequest {
  imageData: string;
}

// ===== Query params =====

export interface SearchTMDBQuery {
  query: string;
  language?: string;
  region?: string;
  page?: string;
}

// ===== Responses =====

export interface GetPublicFeaturedResponse {
  watchlists: Watchlist[];
}

export interface GetPublicWatchlistResponse {
  watchlist: Watchlist;
}

export interface GetWatchlistsByGenreResponse {
  watchlists: Watchlist[];
}

export interface GetWatchlistCountByGenreResponse {
  genre: string;
  count: number;
}

export interface GetMyWatchlistsResponse {
  watchlists: Watchlist[];
}

export interface GetWatchlistByIdResponse {
  watchlist: Watchlist;
  isSaved: boolean;
  isOwner: boolean;
  isCollaborator: boolean;
}

export interface CreateWatchlistResponse {
  watchlist: Watchlist;
}

export interface UpdateWatchlistResponse {
  watchlist: Watchlist;
}

export interface DeleteWatchlistResponse {
  message: string;
}

export interface ReorderWatchlistsResponse {
  message: string;
}

export interface AddCollaboratorResponse {
  collaborators: Collaborator[];
}

export interface RemoveCollaboratorResponse {
  collaborators: Collaborator[];
}

export interface LeaveWatchlistResponse {
  message: string;
}

export interface AddItemResponse {
  watchlist: Watchlist;
}

export interface RemoveItemResponse {
  watchlist: Watchlist;
}

export interface MoveItemResponse {
  watchlist: Watchlist;
}

export interface ReorderItemsResponse {
  watchlist: Watchlist;
}

export interface UploadCoverResponse {
  watchlist: Watchlist;
  imageUrl: string;
}

export interface DeleteCoverResponse {
  message: string;
  watchlist: Watchlist;
}

export interface GenerateThumbnailResponse {
  thumbnailUrl: string;
}

export interface SaveWatchlistResponse {
  message: string;
}

export interface UnsaveWatchlistResponse {
  message: string;
}

export interface DuplicateWatchlistResponse {
  watchlist: Watchlist;
}

// Re-export TMDB types used by /watchlists/search/tmdb and /watchlists/items/:tmdbId/:type/details
export type SearchTMDBResponse = TMDBListResponse;

export interface GetItemDetailsResponse {
  details: FullMediaDetails;
}

// Re-export Platform pour le SDK frontend
export type { Platform };
