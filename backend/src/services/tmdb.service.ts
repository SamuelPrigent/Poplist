import { getFromCache, saveToCache, buildCacheKey } from './cache.service.js';
import { fetchFromTMDB } from './tmdb-queue.service.js';

const CACHE_TTL = {
  GENRES: 30,
  TRENDING: 0.04,
  POPULAR: 0.25,
  TOP_RATED: 1,
  DISCOVER: 0.25,
  SIMILAR: 7,
  RECOMMENDATIONS: 7,
  PROVIDERS: 7,
  DETAILS: 7,
  SEARCH: 1,
};

export async function fetchWithCache<T>(
  endpoint: string,
  params: Record<string, string> = {},
  ttlDays: number = 7
): Promise<T> {
  const cacheKey = buildCacheKey(endpoint, params);

  const cached = await getFromCache(cacheKey);
  if (cached !== null) return cached as T;

  const data = await fetchFromTMDB(endpoint, params);

  await saveToCache(cacheKey, data, ttlDays);

  return data as T;
}

interface TMDBMovieDetails {
  id: number;
  title: string;
  poster_path: string | null;
  runtime: number | null;
}

interface TMDBTVDetails {
  id: number;
  name: string;
  poster_path: string | null;
  episode_run_time: number[];
  number_of_seasons: number;
  number_of_episodes: number;
}

interface TMDBWatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

interface TMDBWatchProvidersResponse {
  results: {
    [countryCode: string]: {
      link: string;
      flatrate?: TMDBWatchProvider[];
      buy?: TMDBWatchProvider[];
      rent?: TMDBWatchProvider[];
    };
  };
}

interface Platform {
  name: string;
  logoPath: string;
}

export interface EnrichedMediaData {
  tmdbId: string;
  title: string;
  posterPath: string | null;
  mediaType: 'movie' | 'tv';
  runtime?: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  platformList: Platform[];
}

export interface SearchResult {
  results: Array<{
    id: number;
    media_type: 'movie' | 'tv';
    title?: string;
    name?: string;
    poster_path: string | null;
    release_date?: string;
    first_air_date?: string;
    runtime?: number;
  }>;
  total_pages: number;
  total_results: number;
}

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
  cast: Array<{ name: string; character: string; profileUrl: string }>;
  director?: string;
  type: 'movie' | 'tv';
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
}

function buildImageUrl(path: string | null, size: string = 'w342'): string {
  if (!path) return '';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

function buildPosterUrl(path: string | null): string {
  return buildImageUrl(path, 'w780');
}

function buildBackdropUrl(path: string | null): string {
  return buildImageUrl(path, 'original');
}

function buildProfileUrl(path: string | null): string {
  return buildImageUrl(path, 'w185');
}

const ALLOWED_PROVIDERS = [
  'Netflix',
  'Amazon Prime Video',
  'Amazon Prime Video with Ads',
  'YouTube',
  'Apple TV',
  'Disney Plus',
  'Crunchyroll',
  'Google Play Movies',
  'HBO Max',
];

function isAllowedProvider(providerName: string): boolean {
  return ALLOWED_PROVIDERS.some(
    allowed =>
      providerName.toLowerCase().includes(allowed.toLowerCase()) ||
      allowed.toLowerCase().includes(providerName.toLowerCase())
  );
}

export async function getMovieDetails(
  tmdbId: string,
  language: string = 'fr-FR'
): Promise<Omit<EnrichedMediaData, 'platformList'> | null> {
  try {
    const data = await fetchWithCache<TMDBMovieDetails>(
      `/movie/${tmdbId}`,
      { language },
      CACHE_TTL.DETAILS
    );

    return {
      tmdbId,
      title: data.title,
      posterPath: data.poster_path,
      mediaType: 'movie',
      runtime: data.runtime ?? undefined,
    };
  } catch {
    return null;
  }
}

export async function getTVDetails(
  tmdbId: string,
  language: string = 'fr-FR'
): Promise<Omit<EnrichedMediaData, 'platformList'> | null> {
  try {
    const data = await fetchWithCache<TMDBTVDetails>(
      `/tv/${tmdbId}`,
      { language },
      CACHE_TTL.DETAILS
    );

    return {
      tmdbId,
      title: data.name,
      posterPath: data.poster_path,
      mediaType: 'tv',
      runtime: data.episode_run_time?.[0] ?? undefined,
      numberOfSeasons: data.number_of_seasons,
      numberOfEpisodes: data.number_of_episodes,
    };
  } catch {
    return null;
  }
}

export async function getWatchProviders(
  tmdbId: string,
  type: 'movie' | 'tv',
  region: string = 'FR'
): Promise<Platform[]> {
  try {
    const data = await fetchWithCache<TMDBWatchProvidersResponse>(
      `/${type}/${tmdbId}/watch/providers`,
      {},
      CACHE_TTL.PROVIDERS
    );

    const regionData = data.results[region];

    if (!regionData) {
      return [{ name: 'Inconnu', logoPath: '' }];
    }

    const allProviders: Platform[] = [];

    if (regionData.flatrate) {
      allProviders.push(
        ...regionData.flatrate.map(p => ({
          name: p.provider_name,
          logoPath: p.logo_path,
        }))
      );
    }

    if (regionData.buy) {
      allProviders.push(
        ...regionData.buy.map(p => ({
          name: p.provider_name,
          logoPath: p.logo_path,
        }))
      );
    }

    if (regionData.rent) {
      allProviders.push(
        ...regionData.rent.map(p => ({
          name: p.provider_name,
          logoPath: p.logo_path,
        }))
      );
    }

    const uniqueProviders = new Map<string, Platform>();
    for (const provider of allProviders) {
      if (isAllowedProvider(provider.name) && !uniqueProviders.has(provider.name)) {
        uniqueProviders.set(provider.name, provider);
      }
    }

    const filteredProviders = Array.from(uniqueProviders.values());
    return filteredProviders.length > 0 ? filteredProviders : [{ name: 'Inconnu', logoPath: '' }];
  } catch {
    return [{ name: 'Inconnu', logoPath: '' }];
  }
}

export async function enrichMediaData(
  tmdbId: string,
  type: 'movie' | 'tv',
  language: string = 'fr-FR',
  region: string = 'FR'
): Promise<EnrichedMediaData | null> {
  try {
    const details =
      type === 'movie'
        ? await getMovieDetails(tmdbId, language)
        : await getTVDetails(tmdbId, language);

    if (!details) return null;

    const platformList = await getWatchProviders(tmdbId, type, region);

    return { ...details, platformList };
  } catch {
    return null;
  }
}

export async function searchMedia(
  query: string,
  language: string = 'fr-FR',
  page: number = 1
): Promise<SearchResult> {
  try {
    const data = await fetchWithCache<SearchResult>(
      '/search/multi',
      {
        query: encodeURIComponent(query),
        language,
        page: String(page),
        include_adult: 'false',
      },
      CACHE_TTL.SEARCH
    );

    const filteredResults = data.results.filter(
      item => item.media_type === 'movie' || item.media_type === 'tv'
    );

    return {
      results: filteredResults,
      total_pages: data.total_pages,
      total_results: data.total_results,
    };
  } catch {
    return { results: [], total_pages: 0, total_results: 0 };
  }
}

export async function getFullMediaDetails(
  tmdbId: string,
  type: 'movie' | 'tv',
  language: string = 'fr-FR'
): Promise<FullMediaDetails | null> {
  try {
    interface TMDBFullDetailsResponse {
      title?: string;
      name?: string;
      overview?: string;
      poster_path?: string;
      backdrop_path?: string;
      release_date?: string;
      first_air_date?: string;
      runtime?: number;
      episode_run_time?: number[];
      vote_average: number;
      vote_count: number;
      genres?: Array<{ name: string }>;
      number_of_seasons?: number;
      number_of_episodes?: number;
      credits?: {
        cast?: Array<{ name: string; character: string; profile_path?: string }>;
        crew?: Array<{ name: string; job: string }>;
      };
    }

    let data: TMDBFullDetailsResponse;
    try {
      data = await fetchWithCache<TMDBFullDetailsResponse>(
        `/${type}/${tmdbId}`,
        { language, append_to_response: 'credits' },
        CACHE_TTL.DETAILS
      );
    } catch {
      if (language !== 'en-US') {
        data = await fetchWithCache<TMDBFullDetailsResponse>(
          `/${type}/${tmdbId}`,
          { language: 'en-US', append_to_response: 'credits' },
          CACHE_TTL.DETAILS
        );
      } else {
        return null;
      }
    }

    const cast =
      data.credits?.cast?.slice(0, 3).map(member => ({
        name: member.name,
        character: member.character,
        profileUrl: buildProfileUrl(member.profile_path || null),
      })) || [];

    const director = data.credits?.crew?.find(
      member =>
        member.job === 'Director' || member.job === 'Creator' || member.job === 'Executive Producer'
    )?.name;

    return {
      tmdbId,
      title: type === 'movie' ? data.title || '' : data.name || '',
      overview: data.overview || '',
      posterUrl: buildPosterUrl(data.poster_path || null),
      backdropUrl: buildBackdropUrl(data.backdrop_path || null),
      releaseDate: type === 'movie' ? data.release_date || '' : data.first_air_date || '',
      runtime: type === 'movie' ? data.runtime : data.episode_run_time?.[0],
      rating: data.vote_average,
      voteCount: data.vote_count,
      genres: data.genres?.map(g => g.name) || [],
      cast,
      director,
      type,
      numberOfSeasons: type === 'tv' ? data.number_of_seasons : undefined,
      numberOfEpisodes: type === 'tv' ? data.number_of_episodes : undefined,
    };
  } catch {
    return null;
  }
}

// Controller-specific functions
export async function getTrending(timeWindow: 'day' | 'week', language: string, page: string) {
  return fetchWithCache(`/trending/all/${timeWindow}`, { language, page }, CACHE_TTL.TRENDING);
}

export async function getSimilar(type: 'movie' | 'tv', id: string, language: string, page: string) {
  return fetchWithCache(`/${type}/${id}/similar`, { language, page }, CACHE_TTL.SIMILAR);
}

export async function getRecommendations(
  type: 'movie' | 'tv',
  id: string,
  language: string,
  page: string
) {
  return fetchWithCache(`/${type}/${id}/recommendations`, { language, page }, CACHE_TTL.RECOMMENDATIONS);
}

interface TMDBRecommendationItem {
  id: number;
  poster_path?: string | null;
}

interface TMDBRecommendationsPage {
  page: number;
  results: TMDBRecommendationItem[];
  total_pages: number;
  total_results: number;
}

/**
 * Récupère les recommandations TMDB d'un titre sur plusieurs pages (20 items/page).
 * Ne retourne que les `tmdbId` ayant un poster (les items sans affiche sont
 * écartés, comme dans `searchExplore`). L'enrichissement runtime/saisons/épisodes
 * est fait ensuite par l'appelant via `getMovieDetails`/`getTVDetails`.
 */
export async function getRecommendationsMultiPage(
  type: 'movie' | 'tv',
  id: string,
  language: string = 'fr-FR',
  maxPages: number = 4
): Promise<number[]> {
  const ids: number[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= maxPages && page <= totalPages) {
    const data = await fetchWithCache<TMDBRecommendationsPage>(
      `/${type}/${id}/recommendations`,
      { language, page: String(page) },
      CACHE_TTL.RECOMMENDATIONS
    );
    totalPages = data.total_pages ?? 1;
    for (const item of data.results ?? []) {
      if (item.poster_path) ids.push(item.id);
    }
    page++;
  }

  return ids;
}

export async function getPopular(
  type: 'movie' | 'tv',
  language: string,
  page: string,
  region: string
) {
  return fetchWithCache(`/${type}/popular`, { language, page, region }, CACHE_TTL.POPULAR);
}

export async function getTopRated(
  type: 'movie' | 'tv',
  language: string,
  page: string,
  region: string
) {
  return fetchWithCache(`/${type}/top_rated`, { language, page, region }, CACHE_TTL.TOP_RATED);
}

export async function discover(type: 'movie' | 'tv', params: Record<string, string>) {
  // Force des filtres côté TMDB :
  // - `include_adult=false` : exclut le porno hardcore (flag `adult: true`)
  // - `without_genres=18` : exclut le genre Drama (id 18). 90% du softcore
  //   non flaggué adult tombe dans cette catégorie. Les drames classiques
  //   restent accessibles via les listes publiques / catégories, juste pas
  //   dans l'explore TMDB direct.
  return fetchWithCache(
    `/discover/${type}`,
    { ...params, include_adult: 'false', without_genres: '18' },
    CACHE_TTL.DISCOVER
  );
}

interface TMDBSearchItem {
  id: number;
  adult?: boolean;
  genre_ids?: number[];
  release_date?: string;
  first_air_date?: string;
  popularity?: number;
  vote_average?: number;
  vote_count?: number;
  poster_path?: string | null;
  backdrop_path?: string | null;
  title?: string;
  name?: string;
  overview?: string;
}

interface TMDBSearchPage {
  page: number;
  results: TMDBSearchItem[];
  total_pages: number;
  total_results: number;
}

/**
 * Recherche TMDB avec filtres custom côté backend ET pagination amortie.
 *
 * TMDB `/search/movie` et `/search/tv` ne supportent ni filtre genre, ni
 * plage de dates, ni sort_by. Pour garantir 60 items par page UI malgré
 * les filtres restrictifs, on fetch dynamiquement plusieurs pages TMDB
 * jusqu'à atteindre `uiPage * 60` items filtrés, puis on slice.
 *
 * Cap à `MAX_TMDB_PAGES` (30 pages) pour éviter d'épuiser le rate limit
 * TMDB sur des requêtes super restrictives ou très peu de résultats.
 *
 * Règles strictes :
 * - `include_adult=false` côté requête TMDB + double-check `result.adult`
 * - Exclusion des items sans `poster_path`
 * - Exclusion du genre 18 (Drama) sauf si l'utilisateur l'a explicitement
 *   sélectionné (cohérent avec `discover`)
 *
 * Le sort s'applique sur la slice de la page UI courante (pas global,
 * car ça forcerait à scanner toutes les pages TMDB disponibles).
 */
export async function searchExplore(opts: {
  type: 'movie' | 'tv';
  query: string;
  language?: string;
  uiPage?: number;
  withGenres?: number[];
  yearFrom?: number;
  yearTo?: number;
  sortBy?: 'popularity' | 'vote_average';
}): Promise<TMDBSearchPage> {
  const {
    type,
    query,
    language = 'fr-FR',
    uiPage = 1,
    withGenres,
    yearFrom,
    yearTo,
    sortBy,
  } = opts;

  const userSelectedDrama = withGenres?.includes(18) ?? false;

  const passesFilters = (item: TMDBSearchItem): boolean => {
    if (item.adult === true) return false;
    if (!item.poster_path) return false;
    if (!userSelectedDrama && item.genre_ids?.includes(18)) return false;
    if (withGenres && withGenres.length > 0) {
      const itemGenres = item.genre_ids ?? [];
      if (!itemGenres.some((g) => withGenres.includes(g))) return false;
    }
    if (yearFrom !== undefined || yearTo !== undefined) {
      const dateStr = type === 'movie' ? item.release_date : item.first_air_date;
      if (!dateStr) return false;
      const year = Number(dateStr.slice(0, 4));
      if (Number.isNaN(year)) return false;
      if (yearFrom !== undefined && year < yearFrom) return false;
      if (yearTo !== undefined && year > yearTo) return false;
    }
    return true;
  };

  const ITEMS_PER_UI_PAGE = 60;
  const MAX_TMDB_PAGES = 30; // cap : ~600 items bruts max scrutés
  const targetCount = uiPage * ITEMS_PER_UI_PAGE;

  const collected: TMDBSearchItem[] = [];
  let tmdbPage = 1;
  let tmdbTotalPages = Number.POSITIVE_INFINITY;
  let tmdbTotalResults = 0;

  while (
    collected.length < targetCount &&
    tmdbPage <= tmdbTotalPages &&
    tmdbPage <= MAX_TMDB_PAGES
  ) {
    const response = await fetchWithCache<TMDBSearchPage>(
      `/search/${type}`,
      {
        query: encodeURIComponent(query),
        language,
        page: String(tmdbPage),
        include_adult: 'false',
      },
      CACHE_TTL.SEARCH
    );

    if (tmdbPage === 1) {
      tmdbTotalResults = response.total_results ?? 0;
    }
    tmdbTotalPages = response.total_pages ?? 1;

    for (const item of response.results ?? []) {
      if (passesFilters(item)) collected.push(item);
    }
    tmdbPage++;
  }

  // Slice pour la page UI courante.
  const startIdx = (uiPage - 1) * ITEMS_PER_UI_PAGE;
  const sliced = collected.slice(startIdx, startIdx + ITEMS_PER_UI_PAGE);

  // Sort sur la slice uniquement (un sort global imposerait de scanner
  // toutes les pages TMDB, trop coûteux).
  let sorted = sliced;
  if (sortBy === 'popularity') {
    sorted = [...sliced].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  } else if (sortBy === 'vote_average') {
    sorted = [...sliced].sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
  }

  // total_pages : si on a atteint la cap ou exhausté TMDB sans avoir
  // collecté assez d'items, on calcule depuis ce qu'on a. Sinon il y a
  // au moins une page de plus.
  const exhausted = tmdbPage > tmdbTotalPages || tmdbPage > MAX_TMDB_PAGES;
  const uiTotalPages = exhausted
    ? Math.max(1, Math.ceil(collected.length / ITEMS_PER_UI_PAGE))
    : uiPage + 1;

  return {
    page: uiPage,
    results: sorted,
    total_pages: uiTotalPages,
    total_results: tmdbTotalResults,
  };
}

export async function getGenres(type: 'movie' | 'tv', language: string) {
  return fetchWithCache(`/genre/${type}/list`, { language }, CACHE_TTL.GENRES);
}

export async function getProviders(type: 'movie' | 'tv', id: string) {
  return fetchWithCache(`/${type}/${id}/watch/providers`, {}, CACHE_TTL.PROVIDERS);
}
