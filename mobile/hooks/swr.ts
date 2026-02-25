import useSWR, { type SWRConfiguration } from 'swr'
import { request } from '../lib/api-client'
import type { Watchlist } from '../types'

/**
 * SWR fetcher using the mobile api-client (Bearer token auth)
 */
async function fetcher<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint)
}

/**
 * Hook for fetching the current user's watchlists.
 * Shared cache: call mutate('/watchlists/mine') from anywhere to invalidate.
 */
export function useMyWatchlists(config?: SWRConfiguration) {
  return useSWR<{ watchlists: Watchlist[] }>(
    '/watchlists/mine',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      dedupingInterval: 2000,
      ...config,
    }
  )
}

/**
 * Hook for fetching a single watchlist by ID.
 * Pass null to disable the request (conditional fetching).
 */
export function useWatchlist(id: string | null, config?: SWRConfiguration) {
  return useSWR(
    id ? `/watchlists/${id}` : null,
    fetcher,
    { revalidateOnFocus: true, revalidateOnMount: true, dedupingInterval: 2000, ...config }
  )
}

/**
 * Hook for fetching public featured watchlists.
 * Longer dedup interval since this data changes infrequently.
 */
export function usePublicWatchlists(config?: SWRConfiguration) {
  return useSWR('/watchlists/public/featured', fetcher, {
    revalidateOnFocus: false, dedupingInterval: 30000, ...config
  })
}

/**
 * Hook for fetching watchlists by genre.
 * Pass null to disable the request (conditional fetching).
 */
export function useWatchlistsByGenre(genre: string | null, config?: SWRConfiguration) {
  return useSWR(
    genre ? `/watchlists/by-genre/${genre}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000, ...config }
  )
}

/**
 * Hook for fetching a user's public profile by username.
 * Pass null to disable the request (conditional fetching).
 */
export function useUserProfile(username: string | null, config?: SWRConfiguration) {
  return useSWR(
    username ? `/user/profile/${username}` : null,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 5000, ...config }
  )
}

export { fetcher }
