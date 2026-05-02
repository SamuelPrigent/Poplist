/**
 * SDK frontend — Re-exports propres pour l'usage dans les composants.
 *
 * Usage :
 *   import { auth, watchlists, type Watchlist } from '@/api';
 *   const data = await watchlists.getMine();
 */

// Transport
export { apiFetch, setAuthErrorHandler } from './client';

// Modules de domaine
export { auth } from './auth';
export { users } from './users';
export { watchlists } from './watchlists';
export { tmdb } from './tmdb';

// Helpers
export { createPlaceholderItem } from './placeholders';
export {
  fetchTMDBProviders,
  getWatchProviderLogo,
  type ProviderLogo,
} from './tmdb-helpers';

// Types ré-exportés depuis @poplist/shared (commodité d'import)
export type {
  Collaborator,
  FullMediaDetails,
  Platform,
  User,
  UserProfilePublic,
  Watchlist,
  WatchlistItem,
  WatchlistOwner,
} from '@poplist/shared';
