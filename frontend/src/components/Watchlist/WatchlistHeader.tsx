import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { ArrowLeft, Film, Pencil, Copy, UserPlus } from "lucide-react";
import shareIcon from "@/assets/share.svg";
import plusIcon from "@/assets/plus.svg";
import type { Watchlist, WatchlistOwner } from "@/lib/api-client";
import { getTMDBImageUrl } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";

interface WatchlistHeaderProps {
  watchlist: Watchlist;
  actionButton?: React.ReactNode;
  onEdit?: () => void;
  onImageClick?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  showSaveButton?: boolean;
  onDuplicate?: () => void;
  showDuplicateButton?: boolean;
  onInviteCollaborator?: () => void;
  showInviteButton?: boolean;
}

const CACHE_PREFIX = "watchlist_header_";
const CACHE_VERSION = "v3"; // Bumped to include item count in cache key for proper invalidation
const CACHE_EXPIRY_DAYS = 7;
const HEADER_SIZE = 500; // Keep larger for header display
const JPEG_QUALITY = 0.8; // JPEG compression quality
const MAX_CACHE_SIZE_KB = 150; // Maximum size per cached cover in KB

function isWatchlistOwner(
  value: Watchlist["ownerId"],
): value is WatchlistOwner {
  return (
    typeof value === "object" &&
    value !== null &&
    ("username" in value || "email" in value)
  );
}

/**
 * Generate a cache key based on watchlist ID, item count, and poster URLs
 * Includes item count to detect when items are added/removed
 */
function generateCacheKey(
  watchlistId: string,
  itemCount: number,
  itemIds: string[],
): string {
  // Use tmdbIds for a more stable and shorter hash
  const itemsHash = itemIds.join("|");
  // Include item count to ensure cache invalidation when items are added/removed
  return `${CACHE_PREFIX}${CACHE_VERSION}_${watchlistId}_${itemCount}_${btoa(itemsHash).slice(0, 30)}`;
}

/**
 * Get cached cover image from localStorage
 */
function getCachedCover(cacheKey: string): string | null {
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
    console.error("Error reading cover cache:", error);
    return null;
  }
}

/**
 * Save cover image to localStorage cache
 */
function setCachedCover(cacheKey: string, dataUrl: string): void {
  try {
    // Check if data URL is too large (skip caching if > MAX_CACHE_SIZE_KB)
    const dataSize = new Blob([dataUrl]).size;
    const dataSizeKB = dataSize / 1024;

    if (dataSizeKB > MAX_CACHE_SIZE_KB) {
      console.warn(
        `Cover image too large to cache (${dataSizeKB.toFixed(1)}KB), skipping cache`,
      );
      return;
    }

    const data = {
      dataUrl,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving cover cache:", error);
    // If quota exceeded, try to clear covers aggressively
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      clearOldCoverCache(true); // Aggressive mode
      // Retry once
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ dataUrl, timestamp: Date.now() }),
        );
      } catch {
        // Give up silently if still can't save
        console.warn("Failed to cache cover after cleanup, skipping");
      }
    }
  }
}

/**
 * Clear old cover caches to free up space
 * @param aggressive If true, removes ALL cover caches, not just expired ones
 */
function clearOldCoverCache(aggressive = false): void {
  try {
    const keys = Object.keys(localStorage);
    const coverKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

    if (aggressive) {
      // Remove ALL covers to free up maximum space
      console.log(`Aggressively clearing ${coverKeys.length} cover caches`);
      coverKeys.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Ignore errors
        }
      });
    } else {
      // Only remove expired or old version covers
      coverKeys.forEach((key) => {
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
    console.error("Error clearing cover cache:", error);
  }
}

export function WatchlistHeader({
  watchlist,
  actionButton,
  onEdit,
  onImageClick,
  onShare,
  onSave,
  isSaved = false,
  showSaveButton = false,
  onDuplicate,
  showDuplicateButton = false,
  onInviteCollaborator,
  showInviteButton = false,
}: WatchlistHeaderProps) {
  const navigate = useNavigate();
  const { content } = useLanguageStore();
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate 2x2 collage from first 4 posters if no custom image
  useEffect(() => {
    if (watchlist.imageUrl) {
      setCoverImage(watchlist.imageUrl);
      return;
    }

    // Generate collage from first 4 items
    const postersToUse = watchlist.items.slice(0, 4);
    if (postersToUse.length === 0) {
      setCoverImage(null);
      return;
    }

    // Generate cache key using tmdbIds for stability and item count for change detection
    const itemIds = postersToUse.map((item) => item.tmdbId);
    const cacheKey = generateCacheKey(
      watchlist._id,
      watchlist.items.length,
      itemIds,
    );

    // Check cache first
    const cached = getCachedCover(cacheKey);
    if (cached) {
      setCoverImage(cached);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = HEADER_SIZE;
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
          setCoverImage(dataUrl);
          setCachedCover(cacheKey, dataUrl);
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
          setCoverImage(dataUrl);
          // Cache the generated cover image
          setCachedCover(cacheKey, dataUrl);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          // Use JPEG with compression to reduce size
          const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
          setCoverImage(dataUrl);
          // Cache even if some images failed to load
          setCachedCover(cacheKey, dataUrl);
        }
      };
      // Extract poster path and use proxy to avoid CORS
      const posterPath = item.posterUrl.replace(
        /^https:\/\/image\.tmdb\.org\/t\/p\/w\d+/,
        "",
      );
      img.src = getTMDBImageUrl(posterPath);
    });

    // If less than 4 items, immediately set cover after all loaded
    if (totalImages < 4) {
      setTimeout(() => {
        if (loadedCount === totalImages) {
          // Use JPEG with compression to reduce size
          const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
          setCoverImage(dataUrl);
          // Cache the generated cover image
          setCachedCover(cacheKey, dataUrl);
        }
      }, 1000);
    }
  }, [watchlist]);

  const itemCount = watchlist.items.length;
  const ownerUsername = isWatchlistOwner(watchlist.ownerId)
    ? watchlist.ownerId.username || watchlist.ownerId.email
    : null;

  return (
    <div className="relative w-full overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-background/60 to-background" />

      {/* Hidden canvas for generating collage */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="container relative mx-auto px-4 pt-8">
        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{content.watchlists.back}</span>
          </button>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-8">
          {/* Cover Image */}
          <div className="flex-shrink-0">
            <div
              className={`group relative h-56 w-56 overflow-hidden rounded-lg shadow-2xl ${onImageClick ? "cursor-pointer" : ""}`}
              onClick={onImageClick}
            >
              {coverImage ? (
                <>
                  <img
                    src={coverImage}
                    alt={watchlist.name}
                    className="h-full w-full object-cover"
                    decoding="async"
                  />
                  {/* Hover Overlay - only if onImageClick is defined */}
                  {onImageClick && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                      <Pencil className="h-10 w-10 text-white" />
                      <span className="mt-2 text-sm font-medium text-white">
                        {/* {content.watchlists.selectPhoto || "Sélectionner une photo"} */}
                        {"Sélectionner une photo"}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted/50">
                  <Film className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col justify-end space-y-4">
            {watchlist.isPublic && (
              <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {content.watchlists.public}
              </span>
            )}

            <h1
              className={`text-4xl font-bold text-white md:text-6xl ${onEdit ? "cursor-pointer transition-colors hover:text-primary" : ""}`}
              onClick={onEdit}
            >
              {watchlist.name}
            </h1>

            {watchlist.description && (
              <p className="text-[14px] text-muted-foreground">
                {watchlist.description}
              </p>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {ownerUsername && (
                <>
                  <span className="font-semibold text-white">
                    {ownerUsername}
                  </span>
                  <span>•</span>
                </>
              )}
              <span>
                {itemCount}{" "}
                {itemCount === 1
                  ? content.watchlists.item
                  : content.watchlists.items}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Row - Below Header */}
        <div className="mt-6 flex items-center justify-between">
          {/* Left: Icon Buttons */}
          <div className="flex items-center gap-1">
            {showSaveButton && onSave && (
              <button
                onClick={onSave}
                className="group p-3 transition-all hover:scale-105"
                title={
                  isSaved
                    ? "Retirer de la bibliothèque"
                    : "Ajouter à la bibliothèque"
                }
              >
                <img
                  src={plusIcon}
                  alt={isSaved ? "Saved" : "Save"}
                  className={`h-6 w-6 transition-all ${
                    isSaved
                      ? "opacity-100 brightness-0 invert"
                      : "opacity-60 brightness-0 invert group-hover:opacity-100"
                  }`}
                />
              </button>
            )}
            {showDuplicateButton && onDuplicate && (
              <button
                onClick={onDuplicate}
                className="group p-3 transition-all hover:scale-105"
                title="Dupliquer dans mon espace"
              >
                <Copy className="h-6 w-6 text-white opacity-60 transition-all group-hover:opacity-100" />
              </button>
            )}
            {onShare && (
              <button
                onClick={onShare}
                className="group p-3 transition-all hover:scale-105"
                title="Partager"
              >
                <img
                  src={shareIcon}
                  alt="Share"
                  className="h-7 w-7 opacity-60 brightness-0 invert transition-all group-hover:opacity-100"
                />
              </button>
            )}
            {showInviteButton && onInviteCollaborator && (
              <button
                onClick={onInviteCollaborator}
                className="group p-3 transition-all hover:scale-105"
                title="Inviter un collaborateur"
              >
                <UserPlus className="h-6 w-6 text-white opacity-60 transition-all group-hover:opacity-100" />
              </button>
            )}
          </div>

          {/* Right: Action Button (e.g., Add Item) */}
          {actionButton && <div className="flex-shrink-0">{actionButton}</div>}
        </div>
      </div>
    </div>
  );
}
