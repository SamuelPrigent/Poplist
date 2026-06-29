import { and, eq, gt, lt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { apiCaches } from '../db/schema.js';

export function buildCacheKey(endpoint: string, params: Record<string, string> = {}): string {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return sortedParams ? `tmdb:${endpoint}?${sortedParams}` : `tmdb:${endpoint}`;
}

export async function getFromCache(cacheKey: string): Promise<unknown | null> {
  try {
    const [cached] = await db
      .select({ responseData: apiCaches.responseData })
      .from(apiCaches)
      .where(and(eq(apiCaches.requestUrl, cacheKey), gt(apiCaches.expiresAt, new Date())))
      .limit(1);

    if (cached) {
      return cached.responseData;
    }

    return null;
  } catch (error) {
    console.error('[CACHE ERROR] getFromCache:', error);
    return null;
  }
}

export async function saveToCache(
  cacheKey: string,
  responseData: unknown,
  cacheDurationDays = 7
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + cacheDurationDays * 24 * 60 * 60 * 1000);

    await db
      .insert(apiCaches)
      .values({
        requestUrl: cacheKey,
        responseData,
        cachedAt: new Date(),
        expiresAt,
      })
      .onConflictDoUpdate({
        target: apiCaches.requestUrl,
        set: {
          responseData,
          cachedAt: new Date(),
          expiresAt,
        },
      });
  } catch (error) {
    console.error('[CACHE ERROR] saveToCache:', error);
  }
}

export async function clearExpiredCache(): Promise<number> {
  try {
    const result = await db
      .delete(apiCaches)
      .where(lt(apiCaches.expiresAt, new Date()))
      .returning({ id: apiCaches.id });
    return result.length;
  } catch (error) {
    console.error('[CACHE ERROR] clearExpiredCache:', error);
    return 0;
  }
}
