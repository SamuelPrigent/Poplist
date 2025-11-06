import { watchlistAPI } from '@/lib/api-client';
import type { Watchlist } from '@/lib/api-client';

const STORAGE_KEY = 'watchlists';

export function getLocalWatchlists(): Watchlist[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to read local watchlists:', error);
    return [];
  }
}

export function saveLocalWatchlists(watchlists: Watchlist[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlists));
  } catch (error) {
    console.error('Failed to save local watchlists:', error);
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

  console.log(`Merging ${localWatchlists.length} local watchlists to database...`);

  const promises = localWatchlists.map((watchlist) =>
    watchlistAPI.create({
      name: watchlist.name,
      description: watchlist.description,
      isPublic: watchlist.isPublic,
      items: watchlist.items,
      fromLocalStorage: true,
    })
  );

  try {
    await Promise.all(promises);
    clearLocalWatchlists();
    console.log('Successfully merged local watchlists to database');
  } catch (error) {
    console.error('Failed to merge local watchlists:', error);
    throw error;
  }
}
