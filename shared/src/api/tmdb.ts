/**
 * Contracts API pour les routes /tmdb/*
 * Ces routes sont des proxies vers l'API TMDB avec cache.
 */
import type {
  TMDBGenresResponse,
  TMDBListResponse,
  TMDBProvidersResponse,
} from '../entities/tmdb.js';

// ===== Query params =====

export interface TrendingQuery {
  language?: string;
  page?: string;
}

export interface DiscoverQuery {
  language?: string;
  page?: string;
  region?: string;
  sort_by?: string;
  with_genres?: string;
  'vote_count.gte'?: string;
  'vote_average.gte'?: string;
  'primary_release_date.gte'?: string;
  'primary_release_date.lte'?: string;
  'first_air_date.gte'?: string;
  'first_air_date.lte'?: string;
}

export interface GenresQuery {
  language?: string;
}

export interface PopularQuery {
  language?: string;
  page?: string;
  region?: string;
}

export interface TopRatedQuery {
  language?: string;
  page?: string;
  region?: string;
}

export interface SimilarQuery {
  language?: string;
  page?: string;
}

export interface SearchExploreQuery {
  query: string;
  language?: string;
  page?: string;
  with_genres?: string;        // CSV d'ids genre (filtre côté backend)
  year_from?: string;          // ex "2015" (inclusif, filtre côté backend)
  year_to?: string;            // ex "2024" (inclusif, filtre côté backend)
  sort_by?: 'popularity' | 'vote_average';  // tri descendant côté backend
}

// ===== Responses (réutilisent les entities TMDB) =====

export type TrendingResponse = TMDBListResponse;
export type DiscoverResponse = TMDBListResponse;
export type GenresResponse = TMDBGenresResponse;
export type PopularResponse = TMDBListResponse;
export type TopRatedResponse = TMDBListResponse;
export type ProvidersResponse = TMDBProvidersResponse;
export type SimilarResponse = TMDBListResponse;
export type SearchExploreResponse = TMDBListResponse;
