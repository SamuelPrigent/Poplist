/**
 * Item TMDB générique (movie ou tv) — shape JSON renvoyé par les endpoints `/tmdb/*`.
 */
export interface TMDBMediaItem {
  id: number;
  media_type?: 'movie' | 'tv';
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  runtime?: number;
}

/**
 * Réponse paginée TMDB — pour les listes (popular, top_rated, trending, discover, similar).
 */
export interface TMDBListResponse {
  results: TMDBMediaItem[];
  page: number;
  total_pages: number;
  total_results: number;
}

/**
 * Réponse TMDB pour /genre/:type/list.
 */
export interface TMDBGenresResponse {
  genres: Array<{ id: number; name: string }>;
}

/**
 * Réponse TMDB pour /watch/providers/:type/:id.
 */
export interface TMDBProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface TMDBProvidersResponse {
  id?: number;
  results: Record<
    string,
    {
      link: string;
      flatrate?: TMDBProvider[];
      buy?: TMDBProvider[];
      rent?: TMDBProvider[];
    }
  >;
}

/**
 * Membre de la distribution.
 */
export interface CastMember {
  name: string;
  character: string;
  profileUrl: string;
}

/**
 * Détails enrichis d'un media (movie/tv) — réponse de /watchlists/items/:tmdbId/:type/details.
 * Format custom Poplist (transformé côté backend depuis le format TMDB raw).
 */
export interface FullMediaDetails {
  tmdbId: string;
  title: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  releaseDate: string;
  runtime?: number;
  rating: number;
  voteCount: number;
  genres: string[];
  cast: CastMember[];
  director?: string;
  type: 'movie' | 'tv';
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
}
