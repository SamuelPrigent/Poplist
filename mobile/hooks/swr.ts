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

export { fetcher }
