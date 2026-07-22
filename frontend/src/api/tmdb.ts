/**
 * SDK tmdb — adaptateur fin sur les fonctions client générées par Kubb.
 * Interface publique conservée (options camelCase → query params TMDB).
 */
import * as gen from '@poplist/shared/generated/client/tmdbController/index';
import type { DiscoverQueryParams } from '@poplist/shared/generated/types/tmdbController/Discover';
import type { SearchExploreQueryParams } from '@poplist/shared/generated/types/tmdbController/SearchExplore';

export interface DiscoverOptions {
  page?: number | string;
  language?: string;
  region?: string;
  sortBy?: string;
  voteCountGte?: number | string;
  voteAverageGte?: number | string;
  releaseDateGte?: string;
  releaseDateLte?: string;
  withGenres?: string;
}

export interface SearchOptions {
  query: string;
  language?: string;
  page?: number | string;
  withGenres?: number[];
  yearFrom?: number;
  yearTo?: number;
  sortBy?: 'popularity' | 'vote_average';
}

/**
 * Options camelCase → query params snake_case du spec. Exporté pour que
 * `queries.ts` construise les queryOptions générées avec les MÊMES params que
 * le queryFn (les params font partie de la query key générée).
 */
export function mapDiscoverOptions(
  type: 'movie' | 'tv',
  options: DiscoverOptions = {},
): DiscoverQueryParams {
  const dateField = type === 'movie' ? 'primary_release_date' : 'first_air_date';
  const params: DiscoverQueryParams = {};
  if (options.page !== undefined) params.page = String(options.page);
  if (options.language) params.language = options.language;
  if (options.region) params.region = options.region;
  if (options.sortBy) params.sort_by = options.sortBy;
  if (options.voteCountGte !== undefined) params['vote_count.gte'] = String(options.voteCountGte);
  if (options.voteAverageGte !== undefined)
    params['vote_average.gte'] = String(options.voteAverageGte);
  if (options.releaseDateGte) params[`${dateField}.gte`] = options.releaseDateGte;
  if (options.releaseDateLte) params[`${dateField}.lte`] = options.releaseDateLte;
  if (options.withGenres) params.with_genres = options.withGenres;
  return params;
}

export function mapSearchOptions(options: SearchOptions): SearchExploreQueryParams {
  const params: SearchExploreQueryParams = { query: options.query };
  if (options.language) params.language = options.language;
  if (options.page !== undefined) params.page = String(options.page);
  if (options.withGenres && options.withGenres.length > 0) {
    params.with_genres = options.withGenres.join(',');
  }
  if (options.yearFrom !== undefined) params.year_from = String(options.yearFrom);
  if (options.yearTo !== undefined) params.year_to = String(options.yearTo);
  if (options.sortBy) params.sort_by = options.sortBy;
  return params;
}

export const tmdb = {
  getTrending: (timeWindow: 'day' | 'week', page?: string) => gen.getTrending(timeWindow, { page }),

  discover: (type: 'movie' | 'tv', options: DiscoverOptions = {}) =>
    gen.discover(type, mapDiscoverOptions(type, options)),

  getGenres: (type: 'movie' | 'tv', language?: string) => gen.getGenres(type, { language }),

  getPopular: (type: 'movie' | 'tv', page?: string) => gen.getPopular(type, { page }),

  getTopRated: (type: 'movie' | 'tv', page?: string) => gen.getTopRated(type, { page }),

  getSimilar: (type: 'movie' | 'tv', id: string) => gen.getSimilar(type, encodeURIComponent(id)),

  search: (type: 'movie' | 'tv', options: SearchOptions) =>
    gen.searchExplore(type, mapSearchOptions(options)),
};
