import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useLayoutEffect } from 'react'
import { watchlistAPI } from '../../../../lib/api-client'
import { useLanguageStore } from '../../../../store/language'
import WatchlistGridScreen from '../../../../components/WatchlistGridScreen'

/** Listes d'une catégorie. Grille mutualisée. */
export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const { content } = useLanguageStore()

  useLayoutEffect(() => {
    const cat = id ? content.categories.list[id as keyof typeof content.categories.list] : null
    if (cat) navigation.setOptions({ headerTitle: cat.name })
  }, [id, content, navigation])

  return (
    <WatchlistGridScreen
      queryKey={['/watchlists/genre', id]}
      fetchWatchlists={async () => (await watchlistAPI.getWatchlistsByGenre(id!)).watchlists}
      emptyTitle={content.watchlists.noWatchlistsInCategory}
      enabled={!!id}
    />
  )
}
