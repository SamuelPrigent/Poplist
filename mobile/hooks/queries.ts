import { useQuery } from '@tanstack/react-query'
import { request } from '../lib/api-client'
import { queryClient } from '../lib/query-client'
import type { Watchlist, UserProfileResponse } from '../types'

/**
 * Hooks de data fetching TanStack Query (remplacent les hooks SWR).
 *
 * Convention de queryKey : `[endpoint]` — la MÊME clé que SWR (l'URL de
 * l'endpoint). Ça rend l'invalidation mécanique : l'ancien
 * `mutate('/watchlists/mine')` global de SWR devient le `mutate()` exporté
 * ci-dessous, à signature identique.
 *
 * Le mapping des options SWR → TanStack Query :
 *   - dedupingInterval → staleTime
 *   - revalidateOnFocus → refetchOnWindowFocus (piloté par le focusManager
 *     branché sur AppState dans lib/query-client.ts)
 */

async function fetcher<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint)
}

/**
 * Invalide (et refetch si montée) la query d'un endpoint, ou applique un
 * update optimiste du cache. Signature compatible avec l'ancien `mutate`
 * global de SWR :
 *   - mutate(endpoint) → invalide + refetch
 *   - mutate(endpoint, updater, false) → update optimiste sans revalidation
 *     (équivalent TanStack Query : setQueryData)
 *   - mutate(endpoint, updater) → update optimiste PUIS revalidation
 */
export async function mutate<T>(
  endpoint: string,
  updater?: (current: T | undefined) => T,
  revalidate: boolean = true
): Promise<void> {
  if (updater) {
    queryClient.setQueryData<T>([endpoint], current => updater(current))
  }
  if (!updater || revalidate) {
    await queryClient.invalidateQueries({ queryKey: [endpoint] })
  }
}

/** Watchlists de l'utilisateur connecté. */
export function useMyWatchlists() {
  return useQuery<{ watchlists: Watchlist[] }>({
    queryKey: ['/watchlists/mine'],
    queryFn: () => fetcher('/watchlists/mine'),
    staleTime: 2_000,
  })
}

/** Une watchlist par id. Passer null pour désactiver (fetch conditionnel). */
export function useWatchlist(id: string | null) {
  return useQuery<{ watchlist: Watchlist; isSaved: boolean; isOwner: boolean; isCollaborator: boolean }>({
    queryKey: [`/watchlists/${id}`],
    queryFn: () => fetcher(`/watchlists/${id}`),
    enabled: !!id,
    staleTime: 2_000,
  })
}

/** Watchlists publiques mises en avant. */
export function usePublicWatchlists() {
  return useQuery<{ watchlists: Watchlist[] }>({
    queryKey: ['/watchlists/public/featured'],
    queryFn: () => fetcher('/watchlists/public/featured'),
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  })
}

/** Watchlists publiques d'un genre. Passer null pour désactiver. */
export function useWatchlistsByGenre(genre: string | null) {
  return useQuery<{ watchlists: Watchlist[] }>({
    queryKey: [`/watchlists/by-genre/${genre}`],
    queryFn: () => fetcher(`/watchlists/by-genre/${genre}`),
    enabled: !!genre,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  })
}

/** Profil public d'un user par username. Passer null pour désactiver. */
export function useUserProfile(username: string | null) {
  return useQuery<UserProfileResponse>({
    queryKey: [`/user/profile/${username}`],
    queryFn: () => fetcher(`/user/profile/${username}`),
    enabled: !!username,
    staleTime: 5_000,
  })
}
