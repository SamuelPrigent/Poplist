import type { Watchlist } from "@/lib/api-client";
import { watchlistAPI } from "@/lib/api-client";

const STORAGE_KEY = "watchlists";

export function getLocalWatchlists(): Watchlist[] {
	try {
		const data = localStorage.getItem(STORAGE_KEY);
		return data ? JSON.parse(data) : [];
	} catch (error) {
		console.error("Failed to read local watchlists:", error);
		return [];
	}
}

export function saveLocalWatchlists(watchlists: Watchlist[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlists));
	} catch (error) {
		console.error("Failed to save local watchlists:", error);
	}
}

export function clearLocalWatchlists(): void {
	localStorage.removeItem(STORAGE_KEY);
}

export async function mergeLocalWatchlistsToDB(): Promise<void> {
	const localWatchlists = getLocalWatchlists();

	if (localWatchlists.length === 0) {
		return;
	}

	console.log(
		`Merging ${localWatchlists.length} local watchlists to database...`,
	);

	const promises = localWatchlists.map((watchlist) => {
		// Transform items to ensure proper format
		const items = (watchlist.items || []).map((item: any) => ({
			tmdbId: item.tmdbId || item.id?.toString() || "",
			title: item.title || "",
			posterUrl: item.posterUrl || item.poster_path || "",
			type: item.type || "movie",
			platformList: item.platformList || [],
			runtime: item.runtime,
			numberOfSeasons: item.numberOfSeasons || item.number_of_seasons,
			numberOfEpisodes: item.numberOfEpisodes || item.number_of_episodes,
			addedAt: item.addedAt || new Date(),
		}));

		return watchlistAPI.create({
			name: watchlist.name,
			description: watchlist.description,
			isPublic: watchlist.isPublic,
			categories: watchlist.categories || [],
			items: items,
			fromLocalStorage: true,
		});
	});

	try {
		await Promise.all(promises);
		// Don't clear localStorage - keep it as a permanent backup
		// Users might want to create multiple accounts or recreate after errors
		console.log("Successfully merged local watchlists to database");
	} catch (error) {
		console.error("Failed to merge local watchlists:", error);
		throw error;
	}
}
