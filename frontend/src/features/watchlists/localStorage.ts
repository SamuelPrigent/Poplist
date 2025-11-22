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
		const items = (watchlist.items || []).map((item: unknown) => {
			const itemData = item as Record<string, unknown>;
			const itemType = itemData.type as string;

			// Handle platformList which can be Platform[] or string[] or undefined
			const rawPlatforms = itemData.platformList as Array<unknown> | undefined;
			const platformList = (rawPlatforms || []).map((p) => {
				if (typeof p === "string") {
					return { name: p, logoPath: "" };
				}
				return p as { name: string; logoPath: string };
			});

			// Handle addedAt which should be a string (ISO date)
			const addedAt = itemData.addedAt;
			const addedAtStr =
				typeof addedAt === "string"
					? addedAt
					: addedAt instanceof Date
						? addedAt.toISOString()
						: new Date().toISOString();

			return {
				tmdbId:
					(itemData.tmdbId as string) ||
					(itemData.id as number)?.toString() ||
					"",
				title: (itemData.title as string) || "",
				posterUrl:
					(itemData.posterUrl as string) ||
					(itemData.poster_path as string) ||
					"",
				type: (itemType === "tv" ? "tv" : "movie") as "movie" | "tv",
				platformList,
				runtime: itemData.runtime as number | undefined,
				numberOfSeasons:
					(itemData.numberOfSeasons as number) ||
					(itemData.number_of_seasons as number),
				numberOfEpisodes:
					(itemData.numberOfEpisodes as number) ||
					(itemData.number_of_episodes as number),
				addedAt: addedAtStr,
			};
		});

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
