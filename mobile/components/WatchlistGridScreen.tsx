import { useQuery } from '@tanstack/react-query'
import WatchlistGrid from './WatchlistGrid'
import type { Watchlist } from '../types'

export { getCardWidth } from './WatchlistGrid'

interface WatchlistGridScreenProps {
  /** Clé de cache — par convention l'endpoint appelé (cf. `hooks/queries.ts`). */
  queryKey: readonly unknown[]
  fetchWatchlists: () => Promise<Watchlist[]>
  emptyTitle: string
  showOwner?: boolean
  enabled?: boolean
}

/**
 * Écran « grille de listes » : la query + la grille.
 *
 * Ces écrans fetchaient en `useState` + `useEffect`, sans cache : chaque
 * montage relançait la requête et réaffichait un spinner, y compris sur un
 * simple retour arrière. react-query mutualise le cache entre écrans et
 * supprime les états de chargement recodés à la main.
 */
export default function WatchlistGridScreen({
  queryKey,
  fetchWatchlists,
  emptyTitle,
  showOwner = true,
  enabled = true,
}: WatchlistGridScreenProps) {
  const { data, isPending } = useQuery({
    queryKey,
    queryFn: fetchWatchlists,
    enabled,
    staleTime: 30_000,
  })

  return (
    <WatchlistGrid
      watchlists={data}
      isPending={enabled && isPending}
      emptyTitle={emptyTitle}
      showOwner={showOwner}
    />
  )
}
