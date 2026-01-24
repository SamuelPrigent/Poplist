import Bottleneck from 'bottleneck'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_API_KEY = process.env.TMDB_API

/**
 * Global rate limiter for TMDB API calls
 * Shared across the entire application (module singleton)
 *
 * TMDB limit: 40 requests/second
 * We use slightly lower values for safety margin
 */
const tmdbQueue = new Bottleneck({
  reservoir: 39,
  reservoirRefreshAmount: 39,
  reservoirRefreshInterval: 1000,
  maxConcurrent: 10,
})

/**
 * Raw fetch to TMDB API (called only through the queue)
 */
async function rawFetchTMDB(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<unknown> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${TMDB_API_KEY}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[TMDB ERROR] ${response.status} for ${endpoint}:`, errorText)
    throw new Error(`TMDB API error: ${response.status}`)
  }

  return response.json()
}

/**
 * Fetch from TMDB API through the rate-limited queue
 * This is the ONLY function that should make actual HTTP calls to TMDB
 *
 * @param endpoint - TMDB API endpoint (e.g., "/movie/123", "/search/multi")
 * @param params - Query parameters
 * @returns Promise with the API response
 */
export async function fetchFromTMDB(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<unknown> {
  return tmdbQueue.schedule(() => rawFetchTMDB(endpoint, params))
}
