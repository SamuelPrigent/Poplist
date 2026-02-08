import useSWR, { type SWRConfiguration } from 'swr'
import type { Watchlist } from '@/lib/api-client'

/**
 * SWR fetcher compatible with the api-client cookie-based auth.
 * Uses the same /api proxy as the rest of the app.
 */
async function fetcher<T>(endpoint: string): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Hook for fetching the current user's watchlists.
 * Shared cache: call `mutate('/watchlists/mine')` from anywhere to invalidate.
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
