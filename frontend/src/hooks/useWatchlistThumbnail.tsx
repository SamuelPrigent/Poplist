import { useEffect, useState, useRef } from "react";
import type { Watchlist } from "@/lib/api-client";
import { getTMDBImageUrl } from "@/lib/api-client";

const CACHE_PREFIX = "watchlist_thumbnail_";
const CACHE_VERSION = "v3"; // Bumped to include item count in cache key for proper invalidation
const CACHE_EXPIRY_DAYS = 7;
const THUMBNAIL_SIZE = 300; // Reduced from 500 to save space
const JPEG_QUALITY = 0.75; // JPEG compression quality
const MAX_CACHE_SIZE_KB = 100; // Maximum size per cached thumbnail in KB

/**
 * Generate a cache key based on watchlist ID, item count, and poster URLs
 * Includes item count to detect when items are added/removed
 */
function generateCacheKey(watchlistId: string, itemCount: number, itemIds: string[]): string {
  // Use tmdbIds for a more stable and shorter hash
  const itemsHash = itemIds.join("|");
  // Include item count to ensure cache invalidation when items are added/removed
  return `${CACHE_PREFIX}${CACHE_VERSION}_${watchlistId}_${itemCount}_${btoa(itemsHash).slice(0, 30)}`;
}

/**
 * Get cached thumbnail from localStorage
 */
function getCachedThumbnail(cacheKey: string): string | null {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const { dataUrl, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    const maxAge = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    if (age > maxAge) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return dataUrl;
  } catch (error) {
    console.error("Error reading thumbnail cache:", error);
    return null;
  }
}

/**
 * Save thumbnail to localStorage cache
 */
function setCachedThumbnail(cacheKey: string, dataUrl: string): void {
  try {
    // Check if data URL is too large (skip caching if > MAX_CACHE_SIZE_KB)
    const dataSize = new Blob([dataUrl]).size;
    const dataSizeKB = dataSize / 1024;

    if (dataSizeKB > MAX_CACHE_SIZE_KB) {
      console.warn(`Thumbnail too large to cache (${dataSizeKB.toFixed(1)}KB), skipping cache`);
      return;
    }

    const data = {
      dataUrl,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving thumbnail cache:", error);
    // If quota exceeded, try to clear thumbnails aggressively
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      clearOldThumbnailCache(true); // Aggressive mode
      // Retry once
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ dataUrl, timestamp: Date.now() }));
      } catch {
        // Give up silently if still can't save
        console.warn("Failed to cache thumbnail after cleanup, skipping");
      }
    }
  }
}

/**
 * Clear old thumbnail caches to free up space
 * @param aggressive If true, removes ALL thumbnail caches, not just expired ones
 */
function clearOldThumbnailCache(aggressive = false): void {
  try {
    const keys = Object.keys(localStorage);
    const thumbnailKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

    if (aggressive) {
      // Remove ALL thumbnails to free up maximum space
      console.log(`Aggressively clearing ${thumbnailKeys.length} thumbnail caches`);
      thumbnailKeys.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Ignore errors
        }
      });
    } else {
      // Only remove expired or old version thumbnails
      thumbnailKeys.forEach((key) => {
        try {
          // Remove old version caches
          if (!key.includes(`_${CACHE_VERSION}_`)) {
            localStorage.removeItem(key);
            return;
          }

          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;
            const maxAge = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
            if (age > maxAge) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    console.error("Error clearing thumbnail cache:", error);
  }
}

/**
 * Custom hook to generate a 2x2 thumbnail collage from watchlist items
 * Returns the generated image URL or null if unavailable
 * Uses localStorage to cache generated thumbnails
 */
export function useWatchlistThumbnail(watchlist: Watchlist) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // If there's a custom image, use it
    if (watchlist.imageUrl) {
      setThumbnailUrl(watchlist.imageUrl);
      return;
    }

    // Generate collage from first 4 items
    const postersToUse = watchlist.items.slice(0, 4);
    if (postersToUse.length === 0) {
      setThumbnailUrl(null);
      return;
    }

    // Generate cache key using tmdbIds for stability and item count for change detection
    const itemIds = postersToUse.map((item) => item.tmdbId);
    const cacheKey = generateCacheKey(watchlist._id, watchlist.items.length, itemIds);

    // Check cache first
    const cached = getCachedThumbnail(cacheKey);
    if (cached) {
      setThumbnailUrl(cached);
      return;
    }

    // Create or reuse canvas
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = THUMBNAIL_SIZE;
    const halfSize = size / 2;
    canvas.width = size;
    canvas.height = size;

    // Fill background
    ctx.fillStyle = "#18181b";
    ctx.fillRect(0, 0, size, size);

    let loadedCount = 0;
    const totalImages = postersToUse.length;

    postersToUse.forEach((item, index) => {
      if (!item.posterUrl) {
        loadedCount++;
        if (loadedCount === totalImages) {
          // Use JPEG with compression to reduce size
          const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
          setThumbnailUrl(dataUrl);
          setCachedThumbnail(cacheKey, dataUrl);
        }
        return;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        const x = col * halfSize;
        const y = row * halfSize;

        // Calculate dimensions to maintain aspect ratio (object-fit: cover)
        const imgAspect = img.width / img.height;
        const cellAspect = 1; // Square cell

        let drawWidth = halfSize;
        let drawHeight = halfSize;
        let offsetX = 0;
        let offsetY = 0;

        if (imgAspect > cellAspect) {
          // Image is wider, crop horizontally
          drawWidth = img.width * (halfSize / img.height);
          offsetX = -(drawWidth - halfSize) / 2;
        } else {
          // Image is taller, crop vertically
          drawHeight = img.height * (halfSize / img.width);
          offsetY = -(drawHeight - halfSize) / 2;
        }

        // Save context state
        ctx.save();
        // Create clipping region
        ctx.beginPath();
        ctx.rect(x, y, halfSize, halfSize);
        ctx.clip();
        // Draw image with object-fit cover effect
        ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
        ctx.restore();

        loadedCount++;
        if (loadedCount === totalImages) {
          // Use JPEG with compression to reduce size
          const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
          setThumbnailUrl(dataUrl);
          // Cache the generated thumbnail
          setCachedThumbnail(cacheKey, dataUrl);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          // Use JPEG with compression to reduce size
          const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
          setThumbnailUrl(dataUrl);
          // Cache even if some images failed to load
          setCachedThumbnail(cacheKey, dataUrl);
        }
      };
      // Extract poster path and use proxy to avoid CORS
      const posterPath = item.posterUrl.replace(/^https:\/\/image\.tmdb\.org\/t\/p\/w\d+/, '');
      img.src = getTMDBImageUrl(posterPath);
    });

    // Cleanup function
    return () => {
      // Canvas will be reused or cleaned up on unmount
    };
  }, [watchlist]);

  return thumbnailUrl;
}
