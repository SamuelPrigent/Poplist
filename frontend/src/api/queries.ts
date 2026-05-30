/**
 * queryOptions centralisés pour TanStack Query.
 *
 * Convention de queryKey :
 *   ['<domain>', <id-or-subdomain>, ...modifiers]
 *
 * Tous les hooks de query/mutation tirent leurs options d'ici. Évite la
 * dispersion des queryKey à travers l'app et facilite l'invalidation
 * (invalidate par préfixe : `{ queryKey: ['watchlists'] }` purge toutes
 * les variantes watchlists).
 */
import { queryOptions } from '@tanstack/react-query';
import { auth, tmdb, users, watchlists } from './';

type DiscoverOptions = Parameters<typeof tmdb.discover>[1];
type SearchOptions = Parameters<typeof tmdb.search>[1];

export const watchlistsQueries = {
  mine: () =>
    queryOptions({
      queryKey: ['watchlists', 'mine'] as const,
      queryFn: () => watchlists.getMine(),
      staleTime: 30_000,
    }),
  byId: (id: string) =>
    queryOptions({
      queryKey: ['watchlists', id, 'auth'] as const,
      queryFn: () => watchlists.getById(id),
      staleTime: 30_000,
    }),
  publicById: (id: string) =>
    queryOptions({
      queryKey: ['watchlists', id, 'public'] as const,
      queryFn: () => watchlists.getPublic(id),
      staleTime: 5 * 60_000,
    }),
  publicFeatured: (limit?: number) =>
    queryOptions({
      queryKey: ['watchlists', 'public', 'featured', limit ?? 'all'] as const,
      queryFn: () => watchlists.getPublicFeatured(limit),
      staleTime: 5 * 60_000,
    }),
  byGenre: (genre: string) =>
    queryOptions({
      queryKey: ['watchlists', 'genre', genre] as const,
      queryFn: () => watchlists.getByGenre(genre),
      staleTime: 5 * 60_000,
    }),
  countByGenre: (genre: string) =>
    queryOptions({
      queryKey: ['watchlists', 'genre', genre, 'count'] as const,
      queryFn: () => watchlists.getCountByGenre(genre),
      staleTime: 60 * 60_000,
    }),
  itemDetails: (tmdbId: string, type: 'movie' | 'tv', language?: string) =>
    queryOptions({
      queryKey: ['watchlists', 'item', tmdbId, type, language] as const,
      queryFn: () => watchlists.getItemDetails(tmdbId, type, language),
      staleTime: 60 * 60_000,
    }),
  recommendations: (id: string, language?: string) =>
    queryOptions({
      queryKey: ['watchlists', id, 'recommendations', language] as const,
      queryFn: () => watchlists.getRecommendations(id, language),
      staleTime: 30 * 60_000,
    }),
};

export const usersQueries = {
  profile: () =>
    queryOptions({
      queryKey: ['users', 'profile'] as const,
      queryFn: () => users.getProfile(),
      staleTime: 30_000,
    }),
  byUsername: (username: string) =>
    queryOptions({
      queryKey: ['users', 'byUsername', username] as const,
      queryFn: () => users.getByUsername(username),
      staleTime: 60_000,
    }),
};

export const tmdbQueries = {
  trending: (timeWindow: 'day' | 'week', page?: string) =>
    queryOptions({
      queryKey: ['tmdb', 'trending', timeWindow, page] as const,
      queryFn: () => tmdb.getTrending(timeWindow, page),
      staleTime: 60 * 60_000,
    }),
  discover: (type: 'movie' | 'tv', options: DiscoverOptions = {}) =>
    queryOptions({
      queryKey: ['tmdb', 'discover', type, options] as const,
      queryFn: () => tmdb.discover(type, options),
      staleTime: 5 * 60_000,
    }),
  genres: (type: 'movie' | 'tv', language?: string) =>
    queryOptions({
      queryKey: ['tmdb', 'genres', type, language] as const,
      queryFn: () => tmdb.getGenres(type, language),
      staleTime: 24 * 60 * 60_000,
    }),
  popular: (type: 'movie' | 'tv', page?: string) =>
    queryOptions({
      queryKey: ['tmdb', 'popular', type, page] as const,
      queryFn: () => tmdb.getPopular(type, page),
      staleTime: 60 * 60_000,
    }),
  topRated: (type: 'movie' | 'tv', page?: string) =>
    queryOptions({
      queryKey: ['tmdb', 'topRated', type, page] as const,
      queryFn: () => tmdb.getTopRated(type, page),
      staleTime: 60 * 60_000,
    }),
  similar: (type: 'movie' | 'tv', id: string) =>
    queryOptions({
      queryKey: ['tmdb', 'similar', type, id] as const,
      queryFn: () => tmdb.getSimilar(type, id),
      staleTime: 60 * 60_000,
    }),
  searchExplore: (type: 'movie' | 'tv', options: SearchOptions) =>
    queryOptions({
      queryKey: ['tmdb', 'search-explore', type, options] as const,
      queryFn: () => tmdb.search(type, options),
      staleTime: 60_000,
      // Active uniquement quand on a une vraie recherche (cohérent avec
      // le seuil >3 caractères côté composant).
      enabled: options.query.length > 3,
    }),
};

export const authQueries = {
  me: () =>
    queryOptions({
      queryKey: ['auth', 'me'] as const,
      queryFn: () => auth.me(),
      staleTime: 60_000,
      retry: false,
    }),
};
