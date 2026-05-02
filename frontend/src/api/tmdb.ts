import type { TMDBAPI } from '@poplist/shared';
import { apiFetch } from './client';

export const tmdb = {
  getTrending: (timeWindow: 'day' | 'week', page?: string) =>
    apiFetch<TMDBAPI.TrendingResponse>(`/tmdb/trending/${timeWindow}`, {
      query: { page },
    }),

  discover: (
    type: 'movie' | 'tv',
    options: {
      page?: number | string;
      language?: string;
      region?: string;
      sortBy?: string;
      voteCountGte?: number | string;
      voteAverageGte?: number | string;
      releaseDateGte?: string;
      releaseDateLte?: string;
    } = {}
  ) => {
    const dateField = type === 'movie' ? 'primary_release_date' : 'first_air_date';
    const query: Record<string, string> = {};
    if (options.page !== undefined) query.page = String(options.page);
    if (options.language) query.language = options.language;
    if (options.region) query.region = options.region;
    if (options.sortBy) query.sort_by = options.sortBy;
    if (options.voteCountGte !== undefined)
      query['vote_count.gte'] = String(options.voteCountGte);
    if (options.voteAverageGte !== undefined)
      query['vote_average.gte'] = String(options.voteAverageGte);
    if (options.releaseDateGte) query[`${dateField}.gte`] = options.releaseDateGte;
    if (options.releaseDateLte) query[`${dateField}.lte`] = options.releaseDateLte;

    return apiFetch<TMDBAPI.DiscoverResponse>(`/tmdb/discover/${type}`, { query });
  },

  getGenres: (type: 'movie' | 'tv', language?: string) =>
    apiFetch<TMDBAPI.GenresResponse>(`/tmdb/genre/${type}/list`, {
      query: { language },
    }),

  getPopular: (type: 'movie' | 'tv', page?: string) =>
    apiFetch<TMDBAPI.PopularResponse>(`/tmdb/${type}/popular`, { query: { page } }),

  getTopRated: (type: 'movie' | 'tv', page?: string) =>
    apiFetch<TMDBAPI.TopRatedResponse>(`/tmdb/${type}/top_rated`, { query: { page } }),

  getSimilar: (type: 'movie' | 'tv', id: string) =>
    apiFetch<TMDBAPI.SimilarResponse>(`/tmdb/${type}/${id}/similar`),
};
