import type { Request, Response } from "express";
import { saveToCache } from "../middleware/cache.middleware.js";

const TMDB_API_KEY = process.env.TMDB_API; // Using existing TMDB_API env variable
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

/**
 * Helper function to fetch from TMDB API
 */
async function fetchFromTMDB(
	endpoint: string,
	params: Record<string, string> = {},
) {
	const url = new URL(`${TMDB_BASE_URL}${endpoint}`);

	// Add query params
	Object.entries(params).forEach(([key, value]) => {
		url.searchParams.append(key, value);
	});

	const response = await fetch(url.toString(), {
		headers: {
			Authorization: `Bearer ${TMDB_API_KEY}`,
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`TMDB API error: ${response.status}`);
	}

	return response.json();
}

/**
 * GET /api/tmdb/trending/:timeWindow
 * Get trending movies/TV shows
 */
export async function getTrending(req: Request, res: Response): Promise<void> {
	try {
		const { timeWindow } = req.params; // 'day' or 'week'
		const language = (req.query.language as string) || "fr-FR";
		const page = (req.query.page as string) || "1";

		if (timeWindow !== "day" && timeWindow !== "week") {
			res.status(400).json({ error: 'timeWindow must be "day" or "week"' });
			return;
		}

		const data = await fetchFromTMDB(`/trending/all/${timeWindow}`, {
			language,
			page,
		});

		// Save to cache
		if (res.locals.cacheKey) {
			await saveToCache(
				res.locals.cacheKey,
				data,
				res.locals.cacheDurationDays,
			);
		}

		res.json(data);
	} catch (error) {
		console.error("Error fetching trending:", error);
		res.status(500).json({ error: "Failed to fetch trending content" });
	}
}

/**
 * GET /api/tmdb/:type/:id/similar
 * Get similar movies/TV shows
 */
export async function getSimilar(req: Request, res: Response): Promise<void> {
	try {
		const { type, id } = req.params; // 'movie' or 'tv'
		const language = (req.query.language as string) || "fr-FR";
		const page = (req.query.page as string) || "1";

		if (type !== "movie" && type !== "tv") {
			res.status(400).json({ error: 'type must be "movie" or "tv"' });
			return;
		}

		const data = await fetchFromTMDB(`/${type}/${id}/similar`, {
			language,
			page,
		});

		// Save to cache
		if (res.locals.cacheKey) {
			await saveToCache(
				res.locals.cacheKey,
				data,
				res.locals.cacheDurationDays,
			);
		}

		res.json(data);
	} catch (error) {
		console.error("Error fetching similar content:", error);
		res.status(500).json({ error: "Failed to fetch similar content" });
	}
}

/**
 * GET /api/tmdb/:type/popular
 * Get popular movies/TV shows
 */
export async function getPopular(req: Request, res: Response): Promise<void> {
	try {
		const { type } = req.params; // 'movie' or 'tv'
		const language = (req.query.language as string) || "fr-FR";
		const page = (req.query.page as string) || "1";
		const region = (req.query.region as string) || "FR";

		if (type !== "movie" && type !== "tv") {
			res.status(400).json({ error: 'type must be "movie" or "tv"' });
			return;
		}

		const data = await fetchFromTMDB(`/${type}/popular`, {
			language,
			page,
			region,
		});

		// Save to cache
		if (res.locals.cacheKey) {
			await saveToCache(
				res.locals.cacheKey,
				data,
				res.locals.cacheDurationDays,
			);
		}

		res.json(data);
	} catch (error) {
		console.error("Error fetching popular content:", error);
		res.status(500).json({ error: "Failed to fetch popular content" });
	}
}

/**
 * GET /api/tmdb/:type/top_rated
 * Get top rated movies/TV shows
 */
export async function getTopRated(req: Request, res: Response): Promise<void> {
	try {
		const { type } = req.params; // 'movie' or 'tv'
		const language = (req.query.language as string) || "fr-FR";
		const page = (req.query.page as string) || "1";
		const region = (req.query.region as string) || "FR";

		if (type !== "movie" && type !== "tv") {
			res.status(400).json({ error: 'type must be "movie" or "tv"' });
			return;
		}

		const data = await fetchFromTMDB(`/${type}/top_rated`, {
			language,
			page,
			region,
		});

		// Save to cache
		if (res.locals.cacheKey) {
			await saveToCache(
				res.locals.cacheKey,
				data,
				res.locals.cacheDurationDays,
			);
		}

		res.json(data);
	} catch (error) {
		console.error("Error fetching top rated content:", error);
		res.status(500).json({ error: "Failed to fetch top rated content" });
	}
}

/**
 * GET /api/tmdb/discover/:type
 * Discover movies/TV shows with filters
 */
export async function discover(req: Request, res: Response): Promise<void> {
	try {
		const { type } = req.params; // 'movie' or 'tv'
		const language = (req.query.language as string) || "fr-FR";
		const page = (req.query.page as string) || "1";
		const region = (req.query.region as string) || "FR";

		// Optional filters
		const withGenres = req.query.with_genres as string;
		const sortBy = (req.query.sort_by as string) || "popularity.desc";

		if (type !== "movie" && type !== "tv") {
			res.status(400).json({ error: 'type must be "movie" or "tv"' });
			return;
		}

		const params: Record<string, string> = {
			language,
			page,
			region,
			sort_by: sortBy,
		};

		if (withGenres) {
			params.with_genres = withGenres;
		}

		const data = await fetchFromTMDB(`/discover/${type}`, params);

		// Save to cache
		if (res.locals.cacheKey) {
			await saveToCache(
				res.locals.cacheKey,
				data,
				res.locals.cacheDurationDays,
			);
		}

		res.json(data);
	} catch (error) {
		console.error("Error discovering content:", error);
		res.status(500).json({ error: "Failed to discover content" });
	}
}

/**
 * GET /api/tmdb/genre/:type/list
 * Get list of genres
 */
export async function getGenres(req: Request, res: Response): Promise<void> {
	try {
		const { type } = req.params; // 'movie' or 'tv'
		const language = (req.query.language as string) || "fr-FR";

		if (type !== "movie" && type !== "tv") {
			res.status(400).json({ error: 'type must be "movie" or "tv"' });
			return;
		}

		const data = await fetchFromTMDB(`/genre/${type}/list`, {
			language,
		});

		// Save to cache
		if (res.locals.cacheKey) {
			await saveToCache(
				res.locals.cacheKey,
				data,
				res.locals.cacheDurationDays,
			);
		}

		res.json(data);
	} catch (error) {
		console.error("Error fetching genres:", error);
		res.status(500).json({ error: "Failed to fetch genres" });
	}
}
