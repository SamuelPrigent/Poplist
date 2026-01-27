import { useEffect, useState } from "react";
import type { Watchlist } from "@/lib/api-client";
import {
	generateAndCacheThumbnail,
	getCachedThumbnail,
} from "@/lib/thumbnailGenerator";
import { getTMDBImageUrl } from "@/lib/utils";

/**
 * HYBRID THUMBNAIL APPROACH
 *
 * For watchlists the user OWNS (online or offline):
 * - Generates thumbnail client-side for immediate feedback after reorder
 * - Uses content-based cache key (posterHash) so cache auto-invalidates
 *
 * For watchlists the user does NOT own:
 * - Uses Cloudinary thumbnail from backend only
 * - NO local caching to avoid stale thumbnails
 *
 * Priority: custom imageUrl > local cache (if owner) > Cloudinary thumbnail
 */

function isOfflineWatchlist(watchlist: Watchlist): boolean {
	// Offline watchlists have IDs that are not MongoDB ObjectIds
	// MongoDB ObjectIds are 24 hex characters
	const id = watchlist.id;
	return !/^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Generate a simple hash from poster paths for cache invalidation
 */
function getPosterPathsHash(watchlist: Watchlist): string {
	const items = watchlist.items ?? [];
	const paths = items
		.slice(0, 4)
		.map((item) => item.posterPath || "")
		.join("|");
	// Simple hash: use first 8 chars of base64 encoded string
	if (typeof btoa !== "undefined") {
		try {
			return btoa(paths).slice(0, 8);
		} catch {
			return paths.slice(0, 8);
		}
	}
	return paths.slice(0, 8);
}

export function useListThumbnail(watchlist: Watchlist | null): string | null {
	const [localThumbnail, setLocalThumbnail] = useState<string | null>(null);

	// Determine if this is an offline watchlist
	const offline = watchlist ? isOfflineWatchlist(watchlist) : false;

	// Determine if user can modify this watchlist (owner or collaborator)
	// For offline lists, user is always the owner
	const canModify = watchlist
		? offline || watchlist.isOwner || watchlist.isCollaborator
		: false;

	// Generate content-based cache key
	const posterHash = watchlist ? getPosterPathsHash(watchlist) : "";

	// Generate thumbnail for watchlists the user can modify (for immediate feedback)
	useEffect(() => {
		// Skip if watchlist is null or user can't modify (visitors use Cloudinary only)
		if (!watchlist || !canModify) {
			return;
		}

		const items = watchlist.items ?? [];
		const posterUrls = items
			.slice(0, 4)
			.map((item) => getTMDBImageUrl(item.posterPath, "w342"))
			.filter((url): url is string => url !== null);

		if (posterUrls.length === 0) {
			return;
		}

		// Cache key includes poster hash for auto-invalidation when items change
		const cacheKey = `${watchlist.id}_${posterHash}`;

		// Check cache first
		const cached = getCachedThumbnail(cacheKey);
		if (cached) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setLocalThumbnail(cached);
			return;
		}

		// Generate new thumbnail
		let cancelled = false;

		generateAndCacheThumbnail(cacheKey, posterUrls)
			.then((thumbnail) => {
				if (!cancelled) {
					setLocalThumbnail(thumbnail);
				}
			})
			.catch((error) => {
				console.error("Failed to generate thumbnail:", error);
			});

		return () => {
			cancelled = true;
		};
	}, [watchlist?.id, canModify, posterHash, watchlist]);

	// Reset local thumbnail when user can no longer modify
	useEffect(() => {
		if (!canModify) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setLocalThumbnail(null);
		}
	}, [canModify]);

	// Return priorities
	if (!watchlist) {
		return null;
	}

	// Priority 1: Custom image (user uploaded)
	if (watchlist.imageUrl) {
		return watchlist.imageUrl;
	}

	// Priority 2: Local cached thumbnail (for owners - immediate feedback after reorder)
	// Uses content-based key so stale cache is never returned
	if (canModify && localThumbnail) {
		return localThumbnail;
	}

	// Priority 3: Cloudinary thumbnail (for visitors or fallback)
	if (watchlist.thumbnailUrl) {
		return watchlist.thumbnailUrl;
	}

	return null;
}
