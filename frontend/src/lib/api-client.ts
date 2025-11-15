const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Helper to get TMDB image URL through proxy to avoid CORS issues
export function getTMDBImageUrl(logoPath: string): string {
  if (!logoPath || !logoPath.startsWith("/")) {
    return "";
  }
  return `${API_URL}/image-proxy?path=${encodeURIComponent(logoPath)}`;
}

// Helper to get local watch provider logo based on provider name
export function getWatchProviderLogo(providerName: string): string | null {
  const nameMap: Record<string, string | null> = {
    netflix: "/src/assets/watchProvider/netflix2.svg",
    "amazon prime video": "/src/assets/watchProvider/primeVideo.svg",
    "amazon prime video with ads": "/src/assets/watchProvider/primeVideo.svg",
    youtube: "/src/assets/watchProvider/youtube.svg",
    "apple tv": "/src/assets/watchProvider/appleTv.svg",
    "disney plus": "/src/assets/watchProvider/disneyplus.svg",
    crunchyroll: "/src/assets/watchProvider/Crunchyroll.svg",
    "hbo max": "/src/assets/watchProvider/hbo.svg",
  };

  const normalized = providerName.toLowerCase();
  return nameMap[normalized] || null;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  _isRetry?: boolean; // Internal flag to prevent infinite retry loops
}

// Callback to notify the app when tokens are invalid (for auto-logout)
let onAuthError: (() => void) | null = null;

export function setAuthErrorHandler(handler: () => void) {
  onAuthError = handler;
}

// Track if a refresh is already in progress to avoid multiple concurrent refreshes
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        console.log("✅ Access token refreshed successfully");
        return true;
      }

      // Silent fail - refresh token expired is expected behavior
      return false;
    } catch {
      // Silent fail - network errors are rare and will be caught elsewhere
      return false;
    } finally {
      // Clear the promise after completion
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, _isRetry, ...restOptions } = options;

  const config: RequestInit = {
    ...restOptions,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  // Handle 401 Unauthorized - try to refresh token
  // Exclude /auth/refresh, /auth/logout, and /auth/me from auto-refresh
  // /auth/me is excluded because 401 is expected when not authenticated
  const shouldAttemptRefresh =
    response.status === 401 &&
    !_isRetry &&
    endpoint !== "/auth/refresh" &&
    endpoint !== "/auth/logout" &&
    endpoint !== "/auth/me";

  if (shouldAttemptRefresh) {
    console.log("🔄 Access token expired, attempting refresh...");

    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // Retry the original request with the new access token
      console.log("🔄 Retrying original request with new token...");
      return request<T>(endpoint, { ...options, _isRetry: true });
    }

    // Refresh failed - notify the app to logout (will clean cookies)
    console.log("🚪 Refresh failed, triggering logout...");
    if (onAuthError) {
      onAuthError();
    }
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

// Auth API
export const authAPI = {
  signup: (email: string, password: string) =>
    request("/auth/signup", {
      method: "POST",
      body: { email, password },
    }),

  login: (email: string, password: string) =>
    request("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  logout: () =>
    request("/auth/logout", {
      method: "POST",
    }),

  me: () => request("/auth/me"),

  refresh: () =>
    request("/auth/refresh", {
      method: "POST",
    }),

  updateUsername: (username: string) =>
    request("/auth/profile/username", {
      method: "PUT",
      body: { username },
    }),

  changePassword: (oldPassword: string, newPassword: string) =>
    request("/auth/profile/password", {
      method: "PUT",
      body: { oldPassword, newPassword },
    }),

  updateLanguage: (language: string) =>
    request("/auth/profile/language", {
      method: "PUT",
      body: { language },
    }),
};

// Watchlist API
export interface Platform {
  name: string;
  logoPath: string;
}

export interface WatchlistItem {
  tmdbId: string;
  title: string;
  posterUrl: string;
  type: "movie" | "tv";
  platformList: Platform[];
  runtime?: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  addedAt: string;
}

export interface WatchlistOwner {
  _id?: string;
  email: string;
  username?: string;
  [key: string]: unknown;
}

export interface Watchlist {
  _id: string;
  ownerId: string | WatchlistOwner;
  name: string;
  description?: string;
  imageUrl?: string;
  isPublic: boolean;
  categories?: string[];
  collaborators: string[];
  items: WatchlistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface FullMediaDetails {
  tmdbId: string;
  title: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  releaseDate: string;
  runtime?: number;
  rating: number;
  voteCount: number;
  genres: string[];
  cast: Array<{
    name: string;
    character: string;
    profileUrl: string;
  }>;
  director?: string;
  type: "movie" | "tv";
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
}

export const watchlistAPI = {
  getMine: (): Promise<{ watchlists: Watchlist[] }> =>
    request("/watchlists/mine"),

  getById: (id: string): Promise<{ watchlist: Watchlist }> =>
    request(`/watchlists/${id}`),

  create: (data: {
    name: string;
    description?: string;
    isPublic?: boolean;
    categories?: string[];
    items?: WatchlistItem[];
    fromLocalStorage?: boolean;
  }): Promise<{ watchlist: Watchlist }> =>
    request("/watchlists", {
      method: "POST",
      body: data,
    }),

  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      isPublic?: boolean;
      items?: WatchlistItem[];
    },
  ): Promise<{ watchlist: Watchlist }> =>
    request(`/watchlists/${id}`, {
      method: "PUT",
      body: data,
    }),

  delete: (id: string): Promise<{ message: string }> =>
    request(`/watchlists/${id}`, {
      method: "DELETE",
    }),

  createShareLink: (
    id: string,
  ): Promise<{ shareUrl: string; expiresAt: string }> =>
    request(`/watchlists/${id}/share`, {
      method: "POST",
    }),

  addCollaborator: (id: string, email: string): Promise<{ message: string }> =>
    request(`/watchlists/${id}/collaborators`, {
      method: "POST",
      body: { email },
    }),

  getPublic: (id: string): Promise<{ watchlist: Watchlist }> =>
    request(`/watchlists/public/${id}`),

  addItem: (
    id: string,
    data: {
      tmdbId: string;
      type: "movie" | "tv";
      language?: string;
      region?: string;
    },
  ): Promise<{ watchlist: Watchlist }> =>
    request(`/watchlists/${id}/items`, {
      method: "POST",
      body: data,
    }),

  removeItem: (id: string, tmdbId: string): Promise<{ watchlist: Watchlist }> =>
    request(`/watchlists/${id}/items/${tmdbId}`, {
      method: "DELETE",
    }),

  moveItem: (
    id: string,
    tmdbId: string,
    position: "first" | "last",
  ): Promise<{ watchlist: Watchlist }> =>
    request(`/watchlists/${id}/items/${tmdbId}/position`, {
      method: "PUT",
      body: { position },
    }),

  reorderItems: (
    id: string,
    orderedTmdbIds: string[],
  ): Promise<{ watchlist: Watchlist }> =>
    request(`/watchlists/${id}/items/reorder`, {
      method: "PUT",
      body: { orderedTmdbIds },
    }),

  reorderWatchlists: (
    orderedWatchlistIds: string[],
  ): Promise<{ message: string }> =>
    request(`/watchlists/reorder`, {
      method: "PUT",
      body: { orderedWatchlistIds },
    }),

  uploadCover: (
    id: string,
    imageData: string,
  ): Promise<{ watchlist: Watchlist; imageUrl: string }> =>
    request(`/watchlists/${id}/upload-cover`, {
      method: "POST",
      body: { imageData },
    }),

  deleteCover: (
    id: string,
  ): Promise<{ message: string; watchlist: Watchlist }> =>
    request(`/watchlists/${id}/cover`, {
      method: "DELETE",
    }),

  searchTMDB: (params: {
    query: string;
    language?: string;
    region?: string;
    page?: number;
  }): Promise<{
    results: Array<{
      id: number;
      media_type: "movie" | "tv";
      title?: string;
      name?: string;
      poster_path: string | null;
      release_date?: string;
      first_air_date?: string;
      runtime?: number;
    }>;
    total_pages: number;
    total_results: number;
  }> => {
    const searchParams = new URLSearchParams({
      query: params.query,
      ...(params.language && { language: params.language }),
      ...(params.region && { region: params.region }),
      ...(params.page && { page: params.page.toString() }),
    });
    return request(`/watchlists/search/tmdb?${searchParams.toString()}`);
  },

  getItemDetails: (
    tmdbId: string,
    type: "movie" | "tv",
    language?: string,
  ): Promise<{ details: FullMediaDetails }> => {
    const searchParams = new URLSearchParams();
    if (language) searchParams.append("language", language);
    const query = searchParams.toString();
    return request(
      `/watchlists/items/${tmdbId}/${type}/details${query ? `?${query}` : ""}`,
    );
  },

  getPublicWatchlists: (
    limit?: number,
  ): Promise<{ watchlists: Watchlist[] }> => {
    const searchParams = new URLSearchParams();
    if (limit) searchParams.append("limit", limit.toString());
    const query = searchParams.toString();
    return request(`/watchlists/public/featured${query ? `?${query}` : ""}`);
  },

  getAllPublicWatchlists: (): Promise<{ watchlists: Watchlist[] }> =>
    request("/watchlists/public/all"),

  getWatchlistsByCategory: (
    category: string,
  ): Promise<{ watchlists: Watchlist[] }> =>
    request(`/watchlists/by-category/${category}`),

  saveWatchlist: (id: string): Promise<{ message: string }> =>
    request(`/watchlists/${id}/save`, {
      method: "POST",
    }),

  unsaveWatchlist: (id: string): Promise<{ message: string }> =>
    request(`/watchlists/${id}/unsave`, {
      method: "DELETE",
    }),

  duplicateWatchlist: (id: string): Promise<{ watchlist: Watchlist }> =>
    request(`/watchlists/${id}/duplicate`, {
      method: "POST",
    }),
};

// TMDB API
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const tmdbAPI = {
  getTrending: async (timeWindow: "day" | "week" = "day") => {
    const response = await fetch(
      `${TMDB_BASE_URL}/trending/all/${timeWindow}`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch trending");
    }

    return response.json();
  },
};
