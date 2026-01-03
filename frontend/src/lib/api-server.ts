/**
 * Server-side API functions for Next.js Server Components
 * Uses fetch with Next.js caching and revalidation
 */

import type {
	FullMediaDetails,
	UserProfileResponse,
	Watchlist,
} from "./api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/**
 * Fetch public/featured watchlists
 * Revalidates every 60 seconds
 */
export async function fetchPublicWatchlists(
	limit?: number,
): Promise<{ watchlists: Watchlist[] }> {
	const url = new URL(`${API_URL}/watchlists/public/featured`);
	if (limit) url.searchParams.set("limit", limit.toString());

	const res = await fetch(url.toString(), {
		next: { revalidate: 60 },
	});

	if (!res.ok) {
		throw new Error("Failed to fetch public watchlists");
	}

	return res.json();
}

/**
 * Fetch all public watchlists
 * Revalidates every 5 minutes
 */
export async function fetchAllPublicWatchlists(): Promise<{
	watchlists: Watchlist[];
}> {
	const res = await fetch(`${API_URL}/watchlists/public/all`, {
		next: { revalidate: 300 },
	});

	if (!res.ok) {
		throw new Error("Failed to fetch all public watchlists");
	}

	return res.json();
}

/**
 * Fetch watchlists by genre
 * Revalidates every 5 minutes
 */
export async function fetchWatchlistsByGenre(
	genre: string,
): Promise<{ watchlists: Watchlist[] }> {
	const res = await fetch(`${API_URL}/watchlists/by-genre/${genre}`, {
		next: { revalidate: 300 },
	});

	if (!res.ok) {
		throw new Error("Failed to fetch watchlists by genre");
	}

	return res.json();
}

/**
 * Fetch a public watchlist by ID
 * Revalidates every 60 seconds
 */
export async function fetchPublicWatchlist(
	id: string,
): Promise<{ watchlist: Watchlist }> {
	const res = await fetch(`${API_URL}/watchlists/public/${id}`, {
		next: { revalidate: 60 },
	});

	if (!res.ok) {
		throw new Error("Failed to fetch watchlist");
	}

	return res.json();
}

/**
 * Fetch user profile by username
 * Revalidates every 5 minutes
 */
export async function fetchUserProfile(
	username: string,
): Promise<UserProfileResponse> {
	const res = await fetch(`${API_URL}/user/profile/${username}`, {
		next: { revalidate: 300 },
	});

	if (!res.ok) {
		throw new Error("User not found");
	}

	return res.json();
}

/**
 * Fetch trending movies/TV shows
 * Revalidates every hour
 */
export async function fetchTrending(
	timeWindow: "day" | "week" = "day",
	page: number = 1,
): Promise<{
	results: Array<{
		id: number;
		media_type: "movie" | "tv";
		title?: string;
		name?: string;
		poster_path?: string;
		backdrop_path?: string;
		overview?: string;
		vote_average?: number;
		release_date?: string;
		first_air_date?: string;
	}>;
	page: number;
	total_pages: number;
	total_results: number;
}> {
	const url = new URL(`${API_URL}/tmdb/trending/${timeWindow}`);
	url.searchParams.set("page", page.toString());

	const res = await fetch(url.toString(), {
		next: { revalidate: 3600 },
	});

	if (!res.ok) {
		throw new Error("Failed to fetch trending");
	}

	return res.json();
}

/**
 * Fetch item details (movie or TV show)
 * Revalidates every hour
 */
export async function fetchItemDetails(
	tmdbId: string,
	type: "movie" | "tv",
	language?: string,
): Promise<{ details: FullMediaDetails }> {
	const url = new URL(`${API_URL}/watchlists/items/${tmdbId}/${type}/details`);
	if (language) url.searchParams.set("language", language);

	const res = await fetch(url.toString(), {
		next: { revalidate: 3600 },
	});

	if (!res.ok) {
		throw new Error("Failed to fetch item details");
	}

	return res.json();
}
