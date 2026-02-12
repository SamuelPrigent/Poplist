import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../services/auth-storage'
import { API_BASE_URL } from '../constants/api'
import type {
  User,
  Platform,
  WatchlistItem,
  Watchlist,
  Collaborator,
  FullMediaDetails,
  UserProfileResponse,
} from '../types'

interface RequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: unknown
  _isRetry?: boolean
}

// Callback to notify the app when tokens are invalid (for auto-logout)
let onAuthError: (() => void) | null = null

export function setAuthErrorHandler(handler: () => void) {
  onAuthError = handler
}

// Track if a refresh is already in progress
let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken()
      if (!refreshToken) return false

      const response = await fetch(`${API_BASE_URL}/auth/mobile/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        await saveTokens(data.accessToken, data.refreshToken)
        return true
      }

      return false
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, _isRetry, ...restOptions } = options
  const token = await getAccessToken()

  const config: RequestInit = {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  // Handle 401 - try to refresh token
  const shouldAttemptRefresh =
    response.status === 401 &&
    !_isRetry &&
    endpoint !== '/auth/mobile/refresh' &&
    endpoint !== '/auth/mobile/logout'

  if (shouldAttemptRefresh) {
    const refreshed = await refreshAccessToken()

    if (refreshed) {
      return request<T>(endpoint, { ...options, _isRetry: true })
    }

    if (onAuthError) {
      onAuthError()
    }
    throw new Error('Session expired. Please log in again.')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

// Auth API
export const authAPI = {
  loginWithGoogle: (code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken: string; user: User }> =>
    request('/auth/mobile/google', {
      method: 'POST',
      body: { code, redirectUri },
    }),

  login: (email: string, password: string): Promise<{ user: User }> =>
    request('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  signup: (email: string, password: string): Promise<{ user: User }> =>
    request('/auth/signup', {
      method: 'POST',
      body: { email, password },
    }),

  logout: async (): Promise<void> => {
    const refreshToken = await getRefreshToken()
    try {
      await request('/auth/mobile/logout', {
        method: 'POST',
        body: { refreshToken: refreshToken || '' },
      })
    } catch {
      // Ignore errors - just clean up
    }
    await clearTokens()
  },

  me: (): Promise<{ user: User }> => request('/auth/me'),

  updateUsername: (username: string): Promise<{ user: User }> =>
    request('/auth/profile/username', {
      method: 'PUT',
      body: { username },
    }),

  changePassword: (oldPassword: string, newPassword: string): Promise<void> =>
    request('/auth/profile/password', {
      method: 'PUT',
      body: { oldPassword, newPassword },
    }),

  updateLanguage: (language: string): Promise<void> =>
    request('/auth/profile/language', {
      method: 'PUT',
      body: { language },
    }),

  deleteAccount: (confirmation: string): Promise<void> =>
    request('/auth/profile/account', {
      method: 'DELETE',
      body: { confirmation },
    }),
}

// Watchlist API
export const watchlistAPI = {
  getMine: (): Promise<{ watchlists: Watchlist[] }> =>
    request('/watchlists/mine'),

  getById: (id: string): Promise<{ watchlist: Watchlist; isSaved: boolean; isCollaborator: boolean }> =>
    request(`/watchlists/${id}`),

  create: (data: {
    name: string
    description?: string
    isPublic?: boolean
    genres?: string[]
    items?: WatchlistItem[]
  }): Promise<{ watchlist: Watchlist }> =>
    request('/watchlists', { method: 'POST', body: data }),

  update: (id: string, data: {
    name?: string
    description?: string
    isPublic?: boolean
    genres?: string[]
    items?: WatchlistItem[]
  }): Promise<{ watchlist: Watchlist }> =>
    request(`/watchlists/${id}`, { method: 'PUT', body: data }),

  delete: (id: string): Promise<{ message: string }> =>
    request(`/watchlists/${id}`, { method: 'DELETE' }),

  addCollaborator: (id: string, username: string): Promise<{ collaborators: Collaborator[] }> =>
    request(`/watchlists/${id}/collaborators`, { method: 'POST', body: { username } }),

  removeCollaborator: (id: string, collaboratorId: string): Promise<{ collaborators: Collaborator[] }> =>
    request(`/watchlists/${id}/collaborators/${collaboratorId}`, { method: 'DELETE' }),

  leaveWatchlist: (id: string): Promise<{ message: string }> =>
    request(`/watchlists/${id}/leave`, { method: 'POST' }),

  getPublic: (id: string): Promise<{ watchlist: Watchlist }> =>
    request(`/watchlists/public/${id}`),

  addItem: (id: string, data: {
    tmdbId: string
    mediaType: 'movie' | 'tv'
    language?: string
    region?: string
  }): Promise<{ watchlist: Watchlist }> =>
    request(`/watchlists/${id}/items`, { method: 'POST', body: data }),

  removeItem: (id: string, tmdbId: string): Promise<{ watchlist: Watchlist }> =>
    request(`/watchlists/${id}/items/${tmdbId}`, { method: 'DELETE' }),

  moveItem: (id: string, tmdbId: string, position: 'first' | 'last'): Promise<{ watchlist: Watchlist }> =>
    request(`/watchlists/${id}/items/${tmdbId}/position`, { method: 'PUT', body: { position } }),

  reorderItems: (id: string, orderedTmdbIds: string[]): Promise<{ watchlist: Watchlist }> =>
    request(`/watchlists/${id}/items/reorder`, { method: 'PUT', body: { orderedTmdbIds } }),

  reorderWatchlists: (orderedWatchlistIds: string[]): Promise<{ message: string }> =>
    request('/watchlists/reorder', { method: 'PUT', body: { orderedWatchlistIds } }),

  uploadCover: (id: string, imageData: string): Promise<{ watchlist: Watchlist; imageUrl: string }> =>
    request(`/watchlists/${id}/upload-cover`, { method: 'POST', body: { imageData } }),

  deleteCover: (id: string): Promise<{ message: string; watchlist: Watchlist }> =>
    request(`/watchlists/${id}/cover`, { method: 'DELETE' }),

  fetchTMDBProviders: async (tmdbId: string, type: 'movie' | 'tv', region: string = 'FR'): Promise<Platform[]> => {
    // Whitelist: only show these providers (matched by TMDB provider_name)
    const ALLOWED_PROVIDERS: Record<string, string> = {
      'Netflix': 'Netflix',
      'Amazon Prime Video': 'Prime Video',
      'Prime Video': 'Prime Video',
      'Apple TV Plus': 'Apple TV',
      'Apple TV+': 'Apple TV',
      'Crunchyroll': 'Crunchyroll',
      'YouTube': 'YouTube',
      'YouTube Premium': 'YouTube',
      'Max': 'HBO Max',
      'HBO Max': 'HBO Max',
      'Max Amazon Channel': 'HBO Max',
      'Disney Plus': 'Disney+',
      'Disney+': 'Disney+',
    }

    try {
      const response = await request<any>(`/tmdb/${type}/${tmdbId}/providers?region=${region}`)
      const regionData = response.results[region]
      if (!regionData) return []

      const allProviders: { name: string; logoPath: string }[] = []
      if (regionData.flatrate) allProviders.push(...regionData.flatrate.map((p: any) => ({ name: p.provider_name, logoPath: p.logo_path })))
      if (regionData.buy) allProviders.push(...regionData.buy.map((p: any) => ({ name: p.provider_name, logoPath: p.logo_path })))
      if (regionData.rent) allProviders.push(...regionData.rent.map((p: any) => ({ name: p.provider_name, logoPath: p.logo_path })))

      const matched = new Map<string, Platform>()
      for (const p of allProviders) {
        const displayName = ALLOWED_PROVIDERS[p.name]
        if (displayName && !matched.has(displayName)) {
          matched.set(displayName, { name: displayName, logoPath: p.logoPath })
        }
      }

      return Array.from(matched.values())
    } catch {
      return []
    }
  },

  searchTMDB: (params: {
    query: string
    language?: string
    region?: string
    page?: number
  }): Promise<{
    results: Array<{
      id: number
      media_type: 'movie' | 'tv'
      title?: string
      name?: string
      poster_path: string | null
      release_date?: string
      first_air_date?: string
    }>
    total_pages: number
    total_results: number
  }> => {
    const searchParams = new URLSearchParams({
      query: params.query,
      ...(params.language && { language: params.language }),
      ...(params.region && { region: params.region }),
      ...(params.page && { page: params.page.toString() }),
    })
    return request(`/watchlists/search/tmdb?${searchParams.toString()}`)
  },

  getItemDetails: (tmdbId: string, type: 'movie' | 'tv', language?: string): Promise<{ details: FullMediaDetails }> => {
    const searchParams = new URLSearchParams()
    if (language) searchParams.append('language', language)
    const query = searchParams.toString()
    return request(`/watchlists/items/${tmdbId}/${type}/details${query ? `?${query}` : ''}`)
  },

  getPublicWatchlists: (limit?: number): Promise<{ watchlists: Watchlist[] }> => {
    const searchParams = new URLSearchParams()
    if (limit) searchParams.append('limit', limit.toString())
    const query = searchParams.toString()
    return request(`/watchlists/public/featured${query ? `?${query}` : ''}`)
  },

  getWatchlistsByGenre: (genre: string): Promise<{ watchlists: Watchlist[] }> =>
    request(`/watchlists/by-genre/${genre}`),

  saveWatchlist: (id: string): Promise<{ message: string }> =>
    request(`/watchlists/${id}/like-and-save`, { method: 'POST' }),

  unsaveWatchlist: (id: string): Promise<{ message: string }> =>
    request(`/watchlists/${id}/unlike-and-unsave`, { method: 'DELETE' }),

  duplicateWatchlist: (id: string): Promise<{ watchlist: Watchlist }> =>
    request(`/watchlists/${id}/duplicate`, { method: 'POST' }),
}

// User API
export const userAPI = {
  uploadAvatar: (imageData: string): Promise<{ user: User; avatarUrl: string }> =>
    request('/user/upload-avatar', { method: 'POST', body: { imageData } }),

  deleteAvatar: (): Promise<{ message: string; user: User }> =>
    request('/user/avatar', { method: 'DELETE' }),

  getProfile: (): Promise<{ user: User }> =>
    request('/user/profile'),

  getUserProfileByUsername: (username: string): Promise<UserProfileResponse> =>
    request(`/user/profile/${username}`),
}

// TMDB API
export const tmdbAPI = {
  getTrending: (timeWindow: 'day' | 'week' = 'day', page: number = 1) => {
    const searchParams = new URLSearchParams({ page: page.toString() })
    return request<{
      results: Array<{
        id: number
        media_type: 'movie' | 'tv'
        title?: string
        name?: string
        poster_path?: string
        backdrop_path?: string
        overview?: string
        vote_average?: number
        release_date?: string
        first_air_date?: string
      }>
      page: number
      total_pages: number
      total_results: number
    }>(`/tmdb/trending/${timeWindow}?${searchParams.toString()}`)
  },

  getDiscover: (
    mediaType: 'movie' | 'tv',
    options: {
      page?: number
      language?: string
      sortBy?: string
      voteCountGte?: number
      voteAverageGte?: number
      releaseDateGte?: string
      releaseDateLte?: string
      withGenres?: string
    } = {},
  ) => {
    const searchParams = new URLSearchParams()
    searchParams.set('page', (options.page || 1).toString())
    searchParams.set('language', options.language || 'fr-FR')
    searchParams.set('sort_by', options.sortBy || 'popularity.desc')
    if (options.voteCountGte) searchParams.set('vote_count.gte', options.voteCountGte.toString())
    if (options.voteAverageGte) searchParams.set('vote_average.gte', options.voteAverageGte.toString())
    const dateField = mediaType === 'movie' ? 'primary_release_date' : 'first_air_date'
    if (options.releaseDateGte) searchParams.set(`${dateField}.gte`, options.releaseDateGte)
    if (options.releaseDateLte) searchParams.set(`${dateField}.lte`, options.releaseDateLte)
    if (options.withGenres) searchParams.set('with_genres', options.withGenres)
    return request<{
      results: Array<{
        id: number
        title?: string
        name?: string
        poster_path?: string
        backdrop_path?: string
        overview?: string
        vote_average?: number
        vote_count?: number
        release_date?: string
        first_air_date?: string
      }>
      page: number
      total_pages: number
      total_results: number
    }>(`/tmdb/discover/${mediaType}?${searchParams.toString()}`)
  },
}
