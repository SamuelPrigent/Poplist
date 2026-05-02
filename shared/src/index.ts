/**
 * @poplist/shared — Types partagés entre backend et frontend.
 *
 * Convention : `entities/` contient les shapes des objets du domaine,
 * `api/` contient les contrats Request/Response par endpoint.
 *
 * Re-exports propres pour les usages courants.
 */

// Entities
export type { User, UserProfilePublic } from './entities/user.js';
export type {
  Collaborator,
  Platform,
  Watchlist,
  WatchlistItem,
  WatchlistOwner,
} from './entities/watchlist.js';
export type {
  FullMediaDetails,
  TMDBGenresResponse,
  TMDBListResponse,
  TMDBMediaItem,
  TMDBProvider,
  TMDBProvidersResponse,
} from './entities/tmdb.js';

// API contracts
export * as AuthAPI from './api/auth.js';
export * as AuthMobileAPI from './api/auth-mobile.js';
export * as UsersAPI from './api/users.js';
export * as WatchlistsAPI from './api/watchlists.js';
export * as TMDBAPI from './api/tmdb.js';
