import { vi } from 'vitest';
import type { Watchlist } from '@/lib/api-client';

const mockWatchlists: Watchlist[] = [];

export const getLocalWatchlists = vi.fn(() => mockWatchlists);

export const getLocalWatchlistsWithOwnership = vi.fn(() =>
  mockWatchlists.map((w) => ({
    ...w,
    isOwner: w.ownerId === 'offline',
    isSaved: false,
  }))
);

export const getSavedWatchlistIds = vi.fn(() => []);

export const saveWatchlistId = vi.fn();

export const removeSavedWatchlistId = vi.fn();
