import { getFromCache, saveToCache, buildCacheKey } from './cache_service.js'
import { fetchFromTMDB } from './tmdb_queue.js'

// ============================================================================
// CACHE TTL CONFIGURATION (in days)
// ============================================================================
const CACHE_TTL = {
  GENRES: 30, // Rarely changes
  TRENDING: 0.04, // ~1 hour
  POPULAR: 0.25, // ~6 hours
  TOP_RATED: 1, // 1 day
  DISCOVER: 0.25, // ~6 hours
  SIMILAR: 7, // Stable
  PROVIDERS: 7, // Stable
  DETAILS: 7, // Stable
  SEARCH: 1, // 1 day
}

// ============================================================================
// CORE FETCH WITH CACHE
// ============================================================================

/**
 * Fetch from TMDB with cache-first strategy
 * 1. Check cache (no rate limit)
 * 2. If miss, fetch through queue (rate limited)
 * 3. Save to cache
 */
export async function fetchWithCache<T>(
  endpoint: string,
  params: Record<string, string> = {},
  ttlDays: number = 7
): Promise<T> {
  const cacheKey = buildCacheKey(endpoint, params)

  // [CACHE CHECK] commenter ces 2 lignes pour test bottleneck
  const cached = await getFromCache(cacheKey)
  if (cached !== null) return cached as T

  const data = await fetchFromTMDB(endpoint, params)

  // [CACHE SAVE] commenter cette ligne pour test bottleneck
  await saveToCache(cacheKey, data, ttlDays)

  return data as T
}

// ============================================================================
// INTERFACES
// ============================================================================

interface TMDBMovieDetails {
  id: number
  title: string
  poster_path: string | null
  runtime: number | null
}

interface TMDBTVDetails {
  id: number
  name: string
  poster_path: string | null
  episode_run_time: number[]
  number_of_seasons: number
  number_of_episodes: number
}

interface TMDBWatchProvider {
  logo_path: string
  provider_id: number
  provider_name: string
  display_priority: number
}

interface TMDBWatchProvidersResponse {
  results: {
    [countryCode: string]: {
      link: string
      flatrate?: TMDBWatchProvider[]
      buy?: TMDBWatchProvider[]
      rent?: TMDBWatchProvider[]
    }
  }
}

interface Platform {
  name: string
  logoPath: string
}

export interface EnrichedMediaData {
  tmdbId: string
  title: string
  posterPath: string | null
  mediaType: 'movie' | 'tv'
  runtime?: number
  numberOfSeasons?: number
  numberOfEpisodes?: number
  platformList: Platform[]
}

export interface SearchResult {
  results: Array<{
    id: number
    media_type: 'movie' | 'tv'
    title?: string
    name?: string
    poster_path: string | null
    release_date?: string
    first_air_date?: string
    runtime?: number
  }>
  total_pages: number
  total_results: number
}

export interface FullMediaDetails {
  tmdbId: string
  title: string
  overview: string
  posterUrl: string
  backdropUrl: string
  releaseDate: string
  runtime?: number
  rating: number
  voteCount: number
  genres: string[]
  cast: Array<{ name: string; character: string; profileUrl: string }>
  director?: string
  type: 'movie' | 'tv'
  numberOfSeasons?: number
  numberOfEpisodes?: number
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildImageUrl(path: string | null, size: string = 'w342'): string {
  if (!path) return ''
  return `https://image.tmdb.org/t/p/${size}${path}`
}

function buildPosterUrl(path: string | null): string {
  return buildImageUrl(path, 'w780')
}

function buildBackdropUrl(path: string | null): string {
  return buildImageUrl(path, 'original')
}

function buildProfileUrl(path: string | null): string {
  return buildImageUrl(path, 'w185')
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
]

function isAllowedProvider(providerName: string): boolean {
  return ALLOWED_PROVIDERS.some(
    (allowed) =>
      providerName.toLowerCase().includes(allowed.toLowerCase()) ||
      allowed.toLowerCase().includes(providerName.toLowerCase())
  )
}

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

export async function getMovieDetails(
  tmdbId: string,
  language: string = 'fr-FR'
): Promise<Omit<EnrichedMediaData, 'platformList'> | null> {
  try {
    const data = await fetchWithCache<TMDBMovieDetails>(
      `/movie/${tmdbId}`,
      { language },
      CACHE_TTL.DETAILS
    )

    return {
      tmdbId,
      title: data.title,
      posterPath: data.poster_path,
      mediaType: 'movie',
      runtime: data.runtime ?? undefined,
    }
  } catch {
    return null
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
    )

    return {
      tmdbId,
      title: data.name,
      posterPath: data.poster_path,
      mediaType: 'tv',
      runtime: data.episode_run_time?.[0] ?? undefined,
      numberOfSeasons: data.number_of_seasons,
      numberOfEpisodes: data.number_of_episodes,
    }
  } catch {
    return null
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
    )

    const regionData = data.results[region]

    if (!regionData) {
      return [{ name: 'Inconnu', logoPath: '' }]
    }

    const allProviders: Platform[] = []

    if (regionData.flatrate) {
      allProviders.push(
        ...regionData.flatrate.map((p) => ({
          name: p.provider_name,
          logoPath: p.logo_path,
        }))
      )
    }

    if (regionData.buy) {
      allProviders.push(
        ...regionData.buy.map((p) => ({
          name: p.provider_name,
          logoPath: p.logo_path,
        }))
      )
    }

    if (regionData.rent) {
      allProviders.push(
        ...regionData.rent.map((p) => ({
          name: p.provider_name,
          logoPath: p.logo_path,
        }))
      )
    }

    const uniqueProviders = new Map<string, Platform>()
    for (const provider of allProviders) {
      if (isAllowedProvider(provider.name) && !uniqueProviders.has(provider.name)) {
        uniqueProviders.set(provider.name, provider)
      }
    }

    const filteredProviders = Array.from(uniqueProviders.values())
    return filteredProviders.length > 0 ? filteredProviders : [{ name: 'Inconnu', logoPath: '' }]
  } catch {
    return [{ name: 'Inconnu', logoPath: '' }]
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
        : await getTVDetails(tmdbId, language)

    if (!details) return null

    const platformList = await getWatchProviders(tmdbId, type, region)

    return { ...details, platformList }
  } catch {
    return null
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
    )

    const filteredResults = data.results.filter(
      (item) => item.media_type === 'movie' || item.media_type === 'tv'
    )

    return {
      results: filteredResults,
      total_pages: data.total_pages,
      total_results: data.total_results,
    }
  } catch {
    return { results: [], total_pages: 0, total_results: 0 }
  }
}

export async function getFullMediaDetails(
  tmdbId: string,
  type: 'movie' | 'tv',
  language: string = 'fr-FR'
): Promise<FullMediaDetails | null> {
  try {
    interface TMDBFullDetailsResponse {
      title?: string
      name?: string
      overview?: string
      poster_path?: string
      backdrop_path?: string
      release_date?: string
      first_air_date?: string
      runtime?: number
      episode_run_time?: number[]
      vote_average: number
      vote_count: number
      genres?: Array<{ name: string }>
      number_of_seasons?: number
      number_of_episodes?: number
      credits?: {
        cast?: Array<{ name: string; character: string; profile_path?: string }>
        crew?: Array<{ name: string; job: string }>
      }
    }

    let data: TMDBFullDetailsResponse
    try {
      data = await fetchWithCache<TMDBFullDetailsResponse>(
        `/${type}/${tmdbId}`,
        { language, append_to_response: 'credits' },
        CACHE_TTL.DETAILS
      )
    } catch {
      // Fallback to English if primary language fails
      if (language !== 'en-US') {
        data = await fetchWithCache<TMDBFullDetailsResponse>(
          `/${type}/${tmdbId}`,
          { language: 'en-US', append_to_response: 'credits' },
          CACHE_TTL.DETAILS
        )
      } else {
        return null
      }
    }

    const cast =
      data.credits?.cast?.slice(0, 3).map((member) => ({
        name: member.name,
        character: member.character,
        profileUrl: buildProfileUrl(member.profile_path || null),
      })) || []

    const director = data.credits?.crew?.find(
      (member) =>
        member.job === 'Director' || member.job === 'Creator' || member.job === 'Executive Producer'
    )?.name

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
      genres: data.genres?.map((g) => g.name) || [],
      cast,
      director,
      type,
      numberOfSeasons: type === 'tv' ? data.number_of_seasons : undefined,
      numberOfEpisodes: type === 'tv' ? data.number_of_episodes : undefined,
    }
  } catch {
    return null
  }
}

// ============================================================================
// CONTROLLER-SPECIFIC FUNCTIONS (for tmdb_controller.ts routes)
// ============================================================================

export async function getTrending(timeWindow: 'day' | 'week', language: string, page: string) {
  return fetchWithCache(`/trending/all/${timeWindow}`, { language, page }, CACHE_TTL.TRENDING)
}

export async function getSimilar(type: 'movie' | 'tv', id: string, language: string, page: string) {
  return fetchWithCache(`/${type}/${id}/similar`, { language, page }, CACHE_TTL.SIMILAR)
}

export async function getPopular(
  type: 'movie' | 'tv',
  language: string,
  page: string,
  region: string
) {
  return fetchWithCache(`/${type}/popular`, { language, page, region }, CACHE_TTL.POPULAR)
}

export async function getTopRated(
  type: 'movie' | 'tv',
  language: string,
  page: string,
  region: string
) {
  return fetchWithCache(`/${type}/top_rated`, { language, page, region }, CACHE_TTL.TOP_RATED)
}

export async function discover(type: 'movie' | 'tv', params: Record<string, string>) {
  return fetchWithCache(`/discover/${type}`, params, CACHE_TTL.DISCOVER)
}

export async function getGenres(type: 'movie' | 'tv', language: string) {
  return fetchWithCache(`/genre/${type}/list`, { language }, CACHE_TTL.GENRES)
}

export async function getProviders(type: 'movie' | 'tv', id: string) {
  return fetchWithCache(`/${type}/${id}/watch/providers`, {}, CACHE_TTL.PROVIDERS)
}
