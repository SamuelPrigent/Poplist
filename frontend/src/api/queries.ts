/**
 * queryOptions centralisés pour TanStack Query — construits sur les
 * queryOptions GÉNÉRÉES par Kubb (`@poplist/shared/generated`).
 *
 * Ce module reste le point d'étranglement unique : les composants et loaders
 * consomment `xxxQueries.yyy()` et ne connaissent ni les keys ni les clients.
 *
 * Query keys : ce sont désormais les keys générées, par endpoint, de la forme
 * `[{ url: '/watchlists/:id', params: { id } }, queryParams?]`. Il n'y a PLUS
 * de matching par préfixe (`['watchlists', id]`) : pour invalider, utiliser
 * les helpers de `./invalidations.ts` (un par domaine) qui regroupent
 * explicitement les keys générées concernées.
 *
 * Les staleTime/enabled/retry métier sont appliqués ici en surcharge des
 * options générées.
 */
import {
  meQueryOptions,
  discoverQueryOptions,
  getGenresQueryOptions,
  getPopularQueryOptions,
  getSimilarQueryOptions,
  getTopRatedQueryOptions,
  getTrendingQueryOptions,
  searchExploreQueryOptions,
  getProfileQueryOptions,
  getUserProfileByUsernameQueryOptions,
  getItemDetailsQueryOptions,
  getMyWatchlistsQueryOptions,
  getPublicFeaturedQueryOptions,
  getPublicWatchlistQueryOptions,
  getWatchlistByIdQueryOptions,
  getWatchlistCountByGenreQueryOptions,
  getWatchlistRecommendationsQueryOptions,
  getWatchlistsByGenreQueryOptions,
} from '@poplist/shared/generated';
import {
  mapDiscoverOptions,
  mapSearchOptions,
  type DiscoverOptions,
  type SearchOptions,
} from './tmdb';

export const watchlistsQueries = {
  mine: () => ({
    ...getMyWatchlistsQueryOptions(),
    staleTime: 30_000,
  }),
  byId: (id: string) => ({
    ...getWatchlistByIdQueryOptions(id),
    staleTime: 30_000,
  }),
  publicById: (id: string) => ({
    ...getPublicWatchlistQueryOptions(id),
    staleTime: 5 * 60_000,
  }),
  publicFeatured: (limit?: number) => ({
    ...getPublicFeaturedQueryOptions(limit === undefined ? undefined : { limit: String(limit) }),
    staleTime: 5 * 60_000,
  }),
  byGenre: (genre: string) => ({
    ...getWatchlistsByGenreQueryOptions(genre),
    staleTime: 5 * 60_000,
  }),
  countByGenre: (genre: string) => ({
    ...getWatchlistCountByGenreQueryOptions(genre),
    staleTime: 60 * 60_000,
  }),
  itemDetails: (tmdbId: string, type: 'movie' | 'tv', language?: string) => ({
    ...getItemDetailsQueryOptions(tmdbId, type, { language }),
    staleTime: 60 * 60_000,
  }),
  recommendations: (id: string, language?: string) => ({
    ...getWatchlistRecommendationsQueryOptions(id, { language }),
    staleTime: 30 * 60_000,
  }),
};

export const usersQueries = {
  profile: () => ({
    ...getProfileQueryOptions(),
    staleTime: 30_000,
  }),
  byUsername: (username: string) => ({
    ...getUserProfileByUsernameQueryOptions(username),
    staleTime: 60_000,
  }),
};

export const tmdbQueries = {
  trending: (timeWindow: 'day' | 'week', page?: string) => ({
    ...getTrendingQueryOptions(timeWindow, { page }),
    staleTime: 60 * 60_000,
  }),
  discover: (type: 'movie' | 'tv', options: DiscoverOptions = {}) => ({
    ...discoverQueryOptions(type, mapDiscoverOptions(type, options)),
    staleTime: 5 * 60_000,
  }),
  genres: (type: 'movie' | 'tv', language?: string) => ({
    ...getGenresQueryOptions(type, { language }),
    staleTime: 24 * 60 * 60_000,
  }),
  popular: (type: 'movie' | 'tv', page?: string) => ({
    ...getPopularQueryOptions(type, { page }),
    staleTime: 60 * 60_000,
  }),
  topRated: (type: 'movie' | 'tv', page?: string) => ({
    ...getTopRatedQueryOptions(type, { page }),
    staleTime: 60 * 60_000,
  }),
  similar: (type: 'movie' | 'tv', id: string) => ({
    ...getSimilarQueryOptions(type, id),
    staleTime: 60 * 60_000,
  }),
  searchExplore: (type: 'movie' | 'tv', options: SearchOptions) => ({
    ...searchExploreQueryOptions(type, mapSearchOptions(options)),
    staleTime: 60_000,
    // Active uniquement quand on a une vraie recherche (cohérent avec
    // le seuil >3 caractères côté composant).
    enabled: options.query.length > 3,
  }),
};

export const authQueries = {
  me: () => ({
    ...meQueryOptions(),
    staleTime: 60_000,
    retry: false,
  }),
};
