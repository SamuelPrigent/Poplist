import prisma from '../lib/prisma.js';

export function buildCacheKey(endpoint: string, params: Record<string, string> = {}): string {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return sortedParams ? `tmdb:${endpoint}?${sortedParams}` : `tmdb:${endpoint}`;
}

export async function getFromCache(cacheKey: string): Promise<unknown | null> {
  try {
    const cached = await prisma.apiCache.findFirst({
      where: {
        requestUrl: cacheKey,
        expiresAt: { gt: new Date() },
      },
    });

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

    await prisma.apiCache.upsert({
      where: { requestUrl: cacheKey },
      update: {
        responseData: responseData as any,
        cachedAt: new Date(),
        expiresAt,
      },
      create: {
        requestUrl: cacheKey,
        responseData: responseData as any,
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
    const result = await prisma.apiCache.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  } catch (error) {
    console.error('[CACHE ERROR] clearExpiredCache:', error);
    return 0;
  }
}
