import dotenv from 'dotenv';

dotenv.config();

const TMDB_API_KEY = process.env.TMDB_API;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
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

interface TMDBSearchResult {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
}

interface TMDBSearchResponse {
  results: TMDBSearchResult[];
  total_pages: number;
  total_results: number;
}

interface Platform {
  name: string;
  logoPath: string;
}

interface EnrichedMediaData {
  tmdbId: string;
  title: string;
  posterUrl: string;
  type: 'movie' | 'tv';
  runtime?: number;
  platformList: Platform[];
}

// In-memory cache
class TMDBCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

const cache = new TMDBCache();

// Helper to build TMDB image URL
function buildImageUrl(path: string | null): string {
  if (!path) return '';
  return `https://image.tmdb.org/t/p/w500${path}`;
}

// Fetch movie details
export async function getMovieDetails(
  tmdbId: string,
  language: string = 'fr-FR'
): Promise<Omit<EnrichedMediaData, 'platformList'> | null> {
  const cacheKey = `movie:${tmdbId}:${language}`;
  const cached = cache.get<Omit<EnrichedMediaData, 'platformList'>>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}?language=${language}`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`TMDB API error (movie ${tmdbId}):`, response.statusText);
      return null;
    }

    const data = await response.json() as TMDBMovieDetails;

    const result: Omit<EnrichedMediaData, 'platformList'> = {
      tmdbId,
      title: data.title,
      posterUrl: buildImageUrl(data.poster_path),
      type: 'movie',
      runtime: data.runtime ?? undefined,
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Error fetching movie details for ${tmdbId}:`, error);
    return null;
  }
}

// Fetch TV show details
export async function getTVDetails(
  tmdbId: string,
  language: string = 'fr-FR'
): Promise<Omit<EnrichedMediaData, 'platformList'> | null> {
  const cacheKey = `tv:${tmdbId}:${language}`;
  const cached = cache.get<Omit<EnrichedMediaData, 'platformList'>>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${tmdbId}?language=${language}`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`TMDB API error (TV ${tmdbId}):`, response.statusText);
      return null;
    }

    const data = await response.json() as TMDBTVDetails;

    // For TV shows, use first episode runtime if available
    const runtime = data.episode_run_time?.[0] ?? undefined;

    const result: Omit<EnrichedMediaData, 'platformList'> = {
      tmdbId,
      title: data.name,
      posterUrl: buildImageUrl(data.poster_path),
      type: 'tv',
      runtime,
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Error fetching TV details for ${tmdbId}:`, error);
    return null;
  }
}

// List of allowed watch providers
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

// Helper to check if provider is allowed
function isAllowedProvider(providerName: string): boolean {
  return ALLOWED_PROVIDERS.some(
    (allowed) => providerName.toLowerCase().includes(allowed.toLowerCase()) ||
                 allowed.toLowerCase().includes(providerName.toLowerCase())
  );
}

// Fetch watch providers (platforms)
export async function getWatchProviders(
  tmdbId: string,
  type: 'movie' | 'tv',
  region: string = 'FR'
): Promise<Platform[]> {
  const cacheKey = `providers:${type}:${tmdbId}:${region}`;
  const cached = cache.get<Platform[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/${type}/${tmdbId}/watch/providers`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(
        `TMDB API error (providers ${type} ${tmdbId}):`,
        response.statusText
      );
      return [{ name: 'Inconnu', logoPath: '' }];
    }

    const data = await response.json() as TMDBWatchProvidersResponse;

    const regionData = data.results[region];
    if (!regionData) {
      cache.set(cacheKey, [{ name: 'Inconnu', logoPath: '' }]);
      return [{ name: 'Inconnu', logoPath: '' }];
    }

    // Collect all providers (flatrate = streaming services like Netflix, Prime)
    const allProviders: Platform[] = [];

    // Priority: flatrate (streaming) > buy > rent
    if (regionData.flatrate) {
      allProviders.push(...regionData.flatrate.map((p) => ({
        name: p.provider_name,
        logoPath: p.logo_path,
      })));
    }

    if (regionData.buy) {
      allProviders.push(...regionData.buy.map((p) => ({
        name: p.provider_name,
        logoPath: p.logo_path,
      })));
    }

    if (regionData.rent) {
      allProviders.push(...regionData.rent.map((p) => ({
        name: p.provider_name,
        logoPath: p.logo_path,
      })));
    }

    // Filter only allowed providers and remove duplicates
    const uniqueProviders = new Map<string, Platform>();
    for (const provider of allProviders) {
      if (isAllowedProvider(provider.name) && !uniqueProviders.has(provider.name)) {
        uniqueProviders.set(provider.name, provider);
      }
    }

    const filteredProviders = Array.from(uniqueProviders.values());
    const result = filteredProviders.length > 0 ? filteredProviders : [{ name: 'Inconnu', logoPath: '' }];

    // Debug log
    console.log(`[TMDB] Watch providers for ${type} ${tmdbId} in ${region}:`, result);

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(
      `Error fetching watch providers for ${type} ${tmdbId}:`,
      error
    );
    return [{ name: 'Inconnu', logoPath: '' }];
  }
}

// Main function: enrich media data (combines details + providers)
export async function enrichMediaData(
  tmdbId: string,
  type: 'movie' | 'tv',
  language: string = 'fr-FR',
  region: string = 'FR'
): Promise<EnrichedMediaData | null> {
  try {
    // Fetch details based on type
    const details =
      type === 'movie'
        ? await getMovieDetails(tmdbId, language)
        : await getTVDetails(tmdbId, language);

    if (!details) return null;

    // Fetch watch providers
    const platformList = await getWatchProviders(tmdbId, type, region);

    return {
      ...details,
      platformList,
    };
  } catch (error) {
    console.error(`Error enriching media data for ${type} ${tmdbId}:`, error);
    return null;
  }
}

// Search movies and TV shows
export async function searchMedia(
  query: string,
  language: string = 'fr-FR',
  region: string = 'FR',
  page: number = 1
): Promise<{
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
}> {
  const cacheKey = `search:${query}:${language}:${page}`;
  const cached = cache.get<any>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(
        query
      )}&language=${language}&page=${page}&include_adult=false`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`TMDB API error (search):`, response.statusText);
      return { results: [], total_pages: 0, total_results: 0 };
    }

    const data = await response.json() as TMDBSearchResponse;

    // Filter only movies and TV shows (exclude persons)
    const filteredResults = data.results.filter(
      (item) => item.media_type === 'movie' || item.media_type === 'tv'
    ) as Array<{
      id: number;
      media_type: 'movie' | 'tv';
      title?: string;
      name?: string;
      poster_path: string | null;
      release_date?: string;
      first_air_date?: string;
      runtime?: number;
    }>;

    const result = {
      results: filteredResults,
      total_pages: data.total_pages,
      total_results: data.total_results,
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Error searching media:`, error);
    return { results: [], total_pages: 0, total_results: 0 };
  }
}

// Export cache for debugging/management
export { cache as tmdbCache };
