import type { Watchlist } from "./api-client";

// Storage keys
export const WATCHLISTS_KEY = "watchlists";
export const SAVED_WATCHLISTS_KEY = "savedWatchlists"; // Array of watchlist IDs that are followed

/**
 * Migrate localStorage data from _id to id (MongoDB to PostgreSQL migration)
 */
function migrateWatchlistIds(watchlists: any[]): Watchlist[] {
	return watchlists.map((w) => {
		// If watchlist has _id but no id, migrate it
		if (w._id && !w.id) {
			const { _id, ...rest } = w;
			return { ...rest, id: _id };
		}
		return w;
	});
}

/**
 * Get all watchlists from localStorage
 */
export function getLocalWatchlists(): Watchlist[] {
	try {
		const data = localStorage.getItem(WATCHLISTS_KEY);
		if (!data) return [];

		const parsed = JSON.parse(data);
		const migrated = migrateWatchlistIds(parsed);

		// Save migrated data back if migration occurred
		if (JSON.stringify(parsed) !== JSON.stringify(migrated)) {
			localStorage.setItem(WATCHLISTS_KEY, JSON.stringify(migrated));
		}

		return migrated;
	} catch (error) {
		console.error("Failed to parse watchlists from localStorage:", error);
		return [];
	}
}

/**
 * Save watchlists to localStorage
 */
export function saveLocalWatchlists(watchlists: Watchlist[]): void {
	try {
		localStorage.setItem(WATCHLISTS_KEY, JSON.stringify(watchlists));
	} catch (error) {
		console.error("Failed to save watchlists to localStorage:", error);
	}
}

/**
 * Get list of followed watchlist IDs
 */
export function getSavedWatchlistIds(): string[] {
	try {
		const data = localStorage.getItem(SAVED_WATCHLISTS_KEY);
		return data ? JSON.parse(data) : [];
	} catch (error) {
		console.error(
			"Failed to parse saved watchlist IDs from localStorage:",
			error,
		);
		return [];
	}
}

/**
 * Save list of followed watchlist IDs
 */
export function saveSavedWatchlistIds(ids: string[]): void {
	try {
		localStorage.setItem(SAVED_WATCHLISTS_KEY, JSON.stringify(ids));
	} catch (error) {
		console.error("Failed to save saved watchlist IDs to localStorage:", error);
	}
}

/**
 * Check if a watchlist is followed
 */
export function isWatchlistSaved(watchlistId: string): boolean {
	const savedIds = getSavedWatchlistIds();
	return savedIds.includes(watchlistId);
}

/**
 * Follow a watchlist (add to saved list)
 */
export function followWatchlist(watchlistId: string): void {
	const savedIds = getSavedWatchlistIds();
	if (!savedIds.includes(watchlistId)) {
		savedIds.push(watchlistId);
		saveSavedWatchlistIds(savedIds);
	}
}

/**
 * Unfollow a watchlist (remove from saved list)
 */
export function unfollowWatchlist(watchlistId: string): void {
	const savedIds = getSavedWatchlistIds();
	const filtered = savedIds.filter((id) => id !== watchlistId);
	saveSavedWatchlistIds(filtered);
}

/**
 * Get watchlists with isOwner flag (for local mode)
 * A watchlist is "owned" if its ownerId is "offline"
 */
export function getLocalWatchlistsWithOwnership(): Watchlist[] {
	const watchlists = getLocalWatchlists();
	const savedIds = getSavedWatchlistIds();

	return watchlists.map((w) => ({
		...w,
		isOwner: w.ownerId === "offline",
		isSaved: savedIds.includes(w.id),
	}));
}
