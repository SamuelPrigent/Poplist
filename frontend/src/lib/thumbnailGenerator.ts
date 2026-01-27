/**
 * Client-side thumbnail generation for offline watchlists
 * Generates a 2x2 grid from poster URLs and returns a base64 data URL
 */

const THUMBNAIL_SIZE = 500; // 500x500 total
const POSTER_SIZE = 250; // Each poster is 250x250

/**
 * Generate a content-based cache key from poster paths
 * This ensures the cache auto-invalidates when items change order
 * @param watchlistId The watchlist ID
 * @param posterPaths Array of poster paths (first 4)
 * @returns Cache key in format "watchlistId_hash"
 */
export function getThumbnailCacheKey(watchlistId: string, posterPaths: (string | null | undefined)[]): string {
  const paths = posterPaths
    .slice(0, 4)
    .map(p => p || '')
    .join('|');
  // Simple hash: use first 8 chars of base64 encoded string
  if (typeof btoa !== 'undefined') {
    try {
      const hash = btoa(paths).slice(0, 8);
      return `${watchlistId}_${hash}`;
    } catch {
      return `${watchlistId}_${paths.slice(0, 8)}`;
    }
  }
  return `${watchlistId}_${paths.slice(0, 8)}`;
}

/**
 * Convert TMDB image URL to proxy URL to avoid CORS issues
 * @param tmdbUrl Original TMDB URL (e.g., https://image.tmdb.org/t/p/w342/abc.jpg)
 * @returns Proxied URL through our backend
 */
function getProxyUrl(tmdbUrl: string): string {
  // Extract the path from TMDB URL
  // Example: https://image.tmdb.org/t/p/w342/abc.jpg -> /abc.jpg
  const match = tmdbUrl.match(/\/t\/p\/w\d+(\/.+)$/);
  if (!match) {
    console.warn(`Could not extract path from TMDB URL: ${tmdbUrl}`);
    return tmdbUrl;
  }
  const path = match[1];
  return `/api/image-proxy?path=${encodeURIComponent(path)}`;
}

/**
 * Load an image from URL and return HTMLImageElement
 */
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Use crossOrigin since we're loading from our own backend proxy
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = error => {
      console.error(`Failed to load image ${url}:`, error);
      reject(error);
    };
    // Convert TMDB URL to proxy URL
    img.src = getProxyUrl(url);
  });
}

/**
 * Generate a 2x2 thumbnail grid from poster URLs
 * @param posterUrls Array of up to 4 poster URLs
 * @returns Base64 data URL of the generated thumbnail
 */
export async function generateThumbnailClient(posterUrls: string[]): Promise<string> {
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = THUMBNAIL_SIZE;
  canvas.height = THUMBNAIL_SIZE;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Fill background with dark color (#18181b)
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);

  // Load and draw images
  const postersToUse = posterUrls.slice(0, 4);
  const imagePromises = postersToUse.map(async (url, index) => {
    try {
      const img = await loadImage(url);

      // Calculate position in 2x2 grid
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = col * POSTER_SIZE;
      const y = row * POSTER_SIZE;

      // Calculate aspect ratio to achieve object-fit: cover effect
      const imgAspect = img.width / img.height;
      const targetAspect = 1; // Square

      let drawWidth = img.width;
      let drawHeight = img.height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgAspect > targetAspect) {
        // Image is wider - crop sides
        drawWidth = img.height * targetAspect;
        offsetX = (img.width - drawWidth) / 2;
      } else {
        // Image is taller - crop top/bottom
        drawHeight = img.width / targetAspect;
        offsetY = (img.height - drawHeight) / 2;
      }

      // Draw cropped image
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight, x, y, POSTER_SIZE, POSTER_SIZE);
    } catch (error) {
      console.error(`Failed to load image ${url}:`, error);
      // Draw gray placeholder for failed images
      ctx.fillStyle = '#27272a';
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = col * POSTER_SIZE;
      const y = row * POSTER_SIZE;
      ctx.fillRect(x, y, POSTER_SIZE, POSTER_SIZE);
    }
  });

  await Promise.all(imagePromises);

  // Convert to base64 data URL
  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Generate thumbnail and cache it in localStorage
 * @param cacheKey Cache key (e.g., "watchlistId_posterHash")
 * @param posterUrls Array of poster URLs
 * @returns Base64 data URL or null if failed
 */
export async function generateAndCacheThumbnail(
  cacheKey: string,
  posterUrls: string[]
): Promise<string | null> {
  try {
    if (posterUrls.length === 0) {
      return null;
    }

    const thumbnailDataUrl = await generateThumbnailClient(posterUrls);

    // Cache in localStorage with full cache key
    const fullCacheKey = `thumbnail_${cacheKey}`;
    try {
      localStorage.setItem(fullCacheKey, thumbnailDataUrl);
    } catch (e) {
      console.warn('Failed to cache thumbnail in localStorage:', e);
      // Continue even if caching fails
    }

    return thumbnailDataUrl;
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    return null;
  }
}

/**
 * Get cached thumbnail from localStorage
 * @param cacheKey Cache key (e.g., "watchlistId_posterHash")
 * @returns Cached thumbnail data URL or null
 */
export function getCachedThumbnail(cacheKey: string): string | null {
  try {
    const fullCacheKey = `thumbnail_${cacheKey}`;
    return localStorage.getItem(fullCacheKey);
  } catch (e) {
    console.warn('Failed to get cached thumbnail:', e);
    return null;
  }
}

/**
 * Delete cached thumbnail(s) from localStorage
 * @param watchlistId Watchlist ID - deletes all cache entries for this watchlist
 */
export function deleteCachedThumbnail(watchlistId: string): void {
  try {
    const prefix = `thumbnail_${watchlistId}`;
    // Find and remove all entries that start with this prefix
    // This handles both old format (thumbnail_id) and new format (thumbnail_id_hash)
    const keysToDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn('Failed to delete cached thumbnail:', e);
  }
}
