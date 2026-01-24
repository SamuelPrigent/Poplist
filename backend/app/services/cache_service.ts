import { DateTime } from 'luxon'
import { ApiCache } from '#models/index'

/**
 * Build a cache key from endpoint and params
 */
export function buildCacheKey(endpoint: string, params: Record<string, string> = {}): string {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  return sortedParams ? `tmdb:${endpoint}?${sortedParams}` : `tmdb:${endpoint}`
}

/**
 * Get data from cache if exists and not expired
 * Returns null if not found or expired
 */
export async function getFromCache(cacheKey: string): Promise<unknown | null> {
  try {
    const cached = await ApiCache.query()
      .where('requestUrl', cacheKey)
      .where('expiresAt', '>', DateTime.now().toSQL()!)
      .first()

    if (cached) {
      return cached.responseData
    }

    return null
  } catch (error) {
    console.error('[CACHE ERROR] getFromCache:', error)
    return null
  }
}

/**
 * Save data to cache with expiration
 */
export async function saveToCache(
  cacheKey: string,
  responseData: unknown,
  cacheDurationDays = 7
): Promise<void> {
  try {
    const expiresAt = DateTime.now().plus({ days: cacheDurationDays })

    await ApiCache.updateOrCreate(
      { requestUrl: cacheKey },
      {
        requestUrl: cacheKey,
        responseData,
        cachedAt: DateTime.now(),
        expiresAt,
      }
    )
  } catch (error) {
    console.error('[CACHE ERROR] saveToCache:', error)
  }
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<number> {
  try {
    const deleted = await ApiCache.query().where('expiresAt', '<', DateTime.now().toSQL()!).delete()
    return deleted as unknown as number
  } catch (error) {
    console.error('[CACHE ERROR] clearExpiredCache:', error)
    return 0
  }
}
