"use client";

import { useEffect, useState } from "react";
import type { Watchlist } from "@/lib/api-client";
import {
	generateAndCacheThumbnail,
	getCachedThumbnail,
} from "@/lib/thumbnailGenerator";

/**
 * HYBRID THUMBNAIL APPROACH
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
	const id = watchlist._id;
	// MongoDB ObjectIds are 24 hex characters
	return !/^[0-9a-fA-F]{24}$/.test(id);
}

export function useListThumbnail(watchlist: Watchlist | null): string | null {
	const [localThumbnail, setLocalThumbnail] = useState<string | null>(null);

	// Priority 3: Generate local thumbnail for offline watchlists
	const offline = watchlist ? isOfflineWatchlist(watchlist) : false;

	useEffect(() => {
		// Early return if watchlist is null
		if (!watchlist) {
			setLocalThumbnail(null);
			return;
		}

		if (!offline) {
			setLocalThumbnail(null);
			return;
		}

		const posterUrls = watchlist.items
			.slice(0, 4)
			.filter((item) => item.posterUrl)
			.map((item) => item.posterUrl);

		if (posterUrls.length === 0) {
			setLocalThumbnail(null);
			return;
		}

		// Check cache first
		const cached = getCachedThumbnail(watchlist._id);
		if (cached) {
			setLocalThumbnail(cached);
			return;
		}

		// Generate new thumbnail
		let cancelled = false;

		generateAndCacheThumbnail(watchlist._id, posterUrls)
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
	}, [watchlist?._id, offline, watchlist?.items.length, watchlist]);

	// Return priorities (after hooks have been called)
	// Handle null watchlist
	if (!watchlist) {
		return null;
	}

	// Priority 1: Custom image
	if (watchlist.imageUrl) {
		return watchlist.imageUrl;
	}

	// Priority 2: Cloudinary thumbnail (online watchlists)
	if (watchlist.thumbnailUrl) {
		return watchlist.thumbnailUrl;
	}

	// Priority 3: Local generated thumbnail (offline watchlists)
	if (offline) {
		return localThumbnail;
	}

	return null;
}
