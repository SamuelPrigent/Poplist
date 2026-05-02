/**
 * Plateforme de streaming associée à un item.
 */
export interface Platform {
  name: string;
  logoPath: string;
}

/**
 * Item d'une watchlist — shape JSON tel que renvoyé par le backend.
 */
export interface WatchlistItem {
  id: string;
  watchlistId: string | null;
  tmdbId: number;
  mediaType: string;
  title: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string | null;
  releaseDate: string | null;
  /**
   * Note TMDB. Côté DB c'est un `numeric(3,1)` qui est sérialisé en string par postgres-js.
   */
  voteAverage: string | null;
  runtime: number | null;
  numberOfSeasons: number | null;
  numberOfEpisodes: number | null;
  platformList: Platform[] | null;
  position: number | null;
  addedAt: string | null;
}

/**
 * Sous-ensemble d'un User exposé comme owner / collaborator.
 */
export interface WatchlistOwner {
  id: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
}

/**
 * Identique à WatchlistOwner — alias sémantique pour le contexte collaborateur.
 */
export type Collaborator = WatchlistOwner;

/**
 * Watchlist canonique avec ses relations — shape JSON renvoyé par les endpoints :
 *   - GET /watchlists/public/:id
 *   - GET /watchlists/:id
 *   - GET /watchlists/public/featured
 *   - GET /watchlists/by-genre/:genre
 *   - GET /watchlists/mine
 *   - POST /watchlists
 *   - POST /watchlists/:id/duplicate
 *
 * Les flags optionnels (isOwner, etc.) sont ajoutés inline par certains endpoints.
 */
export interface Watchlist {
  id: string;
  ownerId: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  dominantColor: string | null;
  isPublic: boolean | null;
  genres: string[] | null;
  position: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  owner?: WatchlistOwner;
  collaborators: Collaborator[];
  items: WatchlistItem[];
  likedBy?: WatchlistOwner[];

  // Flags ajoutés inline par certains endpoints
  isOwner?: boolean;
  isCollaborator?: boolean;
  isSaved?: boolean;
  followersCount?: number;
  libraryPosition?: number;
}
