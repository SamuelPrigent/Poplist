const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, ...restOptions } = options;

  const config: RequestInit = {
    ...restOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Auth API
export const authAPI = {
  signup: (email: string, password: string) =>
    request('/auth/signup', {
      method: 'POST',
      body: { email, password },
    }),

  login: (email: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  me: () => request('/auth/me'),

  refresh: () =>
    request('/auth/refresh', {
      method: 'POST',
    }),
};

// Watchlist API
export interface WatchlistItem {
  tmdbId: string;
  title: string;
  posterUrl: string;
  type: 'movie' | 'tv';
  platformList: string[];
}

export interface Watchlist {
  _id: string;
  ownerId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  collaborators: string[];
  items: WatchlistItem[];
  createdAt: string;
  updatedAt: string;
}

export const watchlistAPI = {
  getMine: (): Promise<{ watchlists: Watchlist[] }> =>
    request('/watchlists/mine'),

  create: (data: {
    name: string;
    description?: string;
    isPublic?: boolean;
    items?: WatchlistItem[];
    fromLocalStorage?: boolean;
  }): Promise<{ watchlist: Watchlist }> =>
    request('/watchlists', {
      method: 'POST',
      body: data,
    }),

  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      isPublic?: boolean;
      items?: WatchlistItem[];
    }
  ): Promise<{ watchlist: Watchlist }> =>
    request(`/watchlists/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string): Promise<{ message: string }> =>
    request(`/watchlists/${id}`, {
      method: 'DELETE',
    }),

  createShareLink: (id: string): Promise<{ shareUrl: string; expiresAt: string }> =>
    request(`/watchlists/${id}/share`, {
      method: 'POST',
    }),

  addCollaborator: (id: string, email: string): Promise<{ message: string }> =>
    request(`/watchlists/${id}/collaborators`, {
      method: 'POST',
      body: { email },
    }),

  getPublic: (id: string): Promise<{ watchlist: Watchlist }> =>
    request(`/watchlists/public/${id}`),
};

// TMDB API
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export const tmdbAPI = {
  getTrending: async (timeWindow: 'day' | 'week' = 'day') => {
    const response = await fetch(
      `${TMDB_BASE_URL}/trending/all/${timeWindow}`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch trending');
    }

    return response.json();
  },
};
