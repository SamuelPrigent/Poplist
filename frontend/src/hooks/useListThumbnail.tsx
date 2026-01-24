import { useEffect, useState } from "react";
import type { Watchlist } from "@/lib/api-client";
import {
	generateAndCacheThumbnail,
	getCachedThumbnail,
} from "@/lib/thumbnailGenerator";
import { getTMDBImageUrl } from "@/lib/utils";

/**
 * ⚠️ HYBRID THUMBNAIL APPROACH
 *
 * For ONLINE watchlists (from backend):
 * - Returns Cloudinary-generated thumbnail URL from backend
 * - Benefits: CDN caching, server-side generation, 1 HTTP call
 *
 * For OFFLINE watchlists (localStorage):
 * - Generates thumbnail client-side using Canvas
 * - Caches in localStorage for performance
 * - Automatically regenerates when items change
 *
 * Priority: custom imageUrl > generated thumbnail (Cloudinary or local) > null
 */

function isOfflineWatchlist(watchlist: Watchlist): boolean {
	// Offline watchlists have IDs that are not MongoDB ObjectIds
	// They're typically UUIDs or custom strings like "quick-add"
	const id = watchlist.id;
	// MongoDB ObjectIds are 24 hex characters
	return !/^[0-9a-fA-F]{24}$/.test(id);
}

export function useListThumbnail(watchlist: Watchlist | null): string | null {
	const [localThumbnail, setLocalThumbnail] = useState<string | null>(null);

	// Determine if this is an offline watchlist
	const offline = watchlist ? isOfflineWatchlist(watchlist) : false;

	// For offline watchlists: generate thumbnail if not cached
	useEffect(() => {
		// Early return if watchlist is null or online
		if (!watchlist || !offline) {
			setLocalThumbnail(null);
			return;
		}

		// For offline watchlists: generate and cache thumbnail
		const items = watchlist.items ?? [];
		const posterUrls = items
			.slice(0, 4)
			.map((item) => getTMDBImageUrl(item.posterPath, "w342"))
			.filter((url): url is string => url !== null);

		if (posterUrls.length === 0) {
			setLocalThumbnail(null);
			return;
		}

		// Check cache first
		const cached = getCachedThumbnail(watchlist.id);
		if (cached) {
			setLocalThumbnail(cached);
			return;
		}

		// Generate new thumbnail
		let cancelled = false;

		generateAndCacheThumbnail(watchlist.id, posterUrls)
			.then((thumbnail) => {
				if (!cancelled) {
					setLocalThumbnail(thumbnail);
				}
			})
			.catch((error) => {
				console.error("Failed to generate thumbnail:", error);
				if (!cancelled) {
					setLocalThumbnail(null);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [watchlist?.id, offline, watchlist?.items?.length, watchlist]);

	// Return priorities (after hooks have been called)
	// Handle null watchlist
	if (!watchlist) {
		return null;
	}

	// Priority 1: Custom image
	if (watchlist.imageUrl) {
		return watchlist.imageUrl;
	}

	// Priority 2: Local cached thumbnail (for immediate updates after reorder/move/delete)
	// Read cache synchronously for instant updates without flickering
	const cached = getCachedThumbnail(watchlist.id);
	if (cached) {
		return cached;
	}

	// Priority 3: Cloudinary thumbnail (online watchlists)
	if (watchlist.thumbnailUrl) {
		return watchlist.thumbnailUrl;
	}

	// Priority 4: State-based local thumbnail (for offline async generation)
	if (offline && localThumbnail) {
		return localThumbnail;
	}

	return null;
}
