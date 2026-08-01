import { watchlistAPI } from '../../../../lib/api-client'
import { useLanguageStore } from '../../../../store/language'
import WatchlistGridScreen from '../../../../components/WatchlistGridScreen'

/** « Voir tout » des listes populaires. Grille mutualisée. */
export default function AllPopularScreen() {
  const { content } = useLanguageStore()

  return (
    <WatchlistGridScreen
      queryKey={['/watchlists/public/featured', 500]}
      fetchWatchlists={async () => (await watchlistAPI.getPublicWatchlists(500)).watchlists}
      emptyTitle={content.watchlists.noItemsYet}
    />
  )
}
