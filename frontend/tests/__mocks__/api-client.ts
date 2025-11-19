import { vi } from 'vitest';
import type { Watchlist, WatchlistItem } from '@/lib/api-client';

// Mock data
export const mockWatchlist: Watchlist = {
  _id: '123456789012345678901234',
  name: 'Test Watchlist',
  description: 'A test watchlist',
  ownerId: 'user123',
  isPublic: false,
  items: [],
  categories: [],
  likedBy: [],
  collaborators: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockWatchlistItem: WatchlistItem = {
  tmdbId: '12345',
  title: 'Test Movie',
  posterUrl: 'https://example.com/poster.jpg',
  type: 'movie',
  platformList: [],
  addedAt: new Date().toISOString(),
};

// Mock API responses
export const mockWatchlistAPI = {
  getMine: vi.fn().mockResolvedValue({
    watchlists: [mockWatchlist],
  }),
  getById: vi.fn().mockResolvedValue({
    watchlist: mockWatchlist,
  }),
  create: vi.fn().mockResolvedValue({
    watchlist: mockWatchlist,
  }),
  update: vi.fn().mockResolvedValue({
    watchlist: mockWatchlist,
  }),
  delete: vi.fn().mockResolvedValue({}),
  addItem: vi.fn().mockResolvedValue({
    watchlist: { ...mockWatchlist, items: [mockWatchlistItem] },
  }),
  removeItem: vi.fn().mockResolvedValue({
    watchlist: mockWatchlist,
  }),
  uploadCover: vi.fn().mockResolvedValue({
    watchlist: { ...mockWatchlist, imageUrl: 'https://example.com/cover.jpg' },
  }),
  deleteCover: vi.fn().mockResolvedValue({
    watchlist: { ...mockWatchlist, imageUrl: undefined },
  }),
  saveWatchlist: vi.fn().mockResolvedValue({}),
  unsaveWatchlist: vi.fn().mockResolvedValue({}),
  duplicateWatchlist: vi.fn().mockResolvedValue({
    watchlist: { ...mockWatchlist, _id: 'duplicated123' },
  }),
};

export const mockAuthAPI = {
  login: vi.fn().mockResolvedValue({
    user: { id: 'user123', email: 'test@example.com', username: 'testuser' },
    token: 'mock-token',
  }),
  register: vi.fn().mockResolvedValue({
    user: { id: 'user123', email: 'test@example.com', username: 'testuser' },
    token: 'mock-token',
  }),
  logout: vi.fn().mockResolvedValue({}),
  getCurrentUser: vi.fn().mockResolvedValue({
    user: { id: 'user123', email: 'test@example.com', username: 'testuser' },
  }),
};

export const mockTmdbAPI = {
  searchMulti: vi.fn().mockResolvedValue({
    results: [],
    total_results: 0,
    page: 1,
    total_pages: 0,
  }),
  getMovieDetails: vi.fn().mockResolvedValue({
    id: 12345,
    title: 'Test Movie',
    poster_path: '/poster.jpg',
  }),
  getTvDetails: vi.fn().mockResolvedValue({
    id: 12345,
    name: 'Test TV Show',
    poster_path: '/poster.jpg',
  }),
};
