import { View, FlatList, StyleSheet, ActivityIndicator, Dimensions } from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect, useState, useLayoutEffect } from 'react'
import { watchlistAPI } from '../../lib/api-client'
import { useLanguageStore } from '../../store/language'
import { usePreferencesStore } from '../../store/preferences'
import { colors, spacing } from '../../constants/theme'
import WatchlistCard from '../../components/WatchlistCard'
import EmptyState from '../../components/EmptyState'
import type { Watchlist } from '../../types'

const screenWidth = Dimensions.get('window').width
function getCardWidth(cols: number) {
  return (screenWidth - spacing.lg * 2 - spacing.sm * (cols - 1)) / cols
}

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const { content } = useLanguageStore()
  const { columns } = usePreferencesStore()
  const cardWidth = getCardWidth(columns)
  const [watchlists, setWatchlists] = useState<Watchlist[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useLayoutEffect(() => {
    const cat = id ? content.categories.list[id as keyof typeof content.categories.list] : null
    if (cat) navigation.setOptions({ headerTitle: cat.name })
  }, [id, content, navigation])

  useEffect(() => {
    if (id) loadWatchlists()
  }, [id])

  const loadWatchlists = async () => {
    try {
      const response = await watchlistAPI.getWatchlistsByGenre(id!)
      setWatchlists(response.watchlists)
    } catch (error) {
      console.error('Failed to load category watchlists:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={watchlists}
      keyExtractor={(item) => item.id}
      key={columns}
      numColumns={columns}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <WatchlistCard watchlist={item} showOwner width={cardWidth} />
      )}
      ListEmptyComponent={
        <EmptyState title={content.watchlists.noWatchlistsInCategory} />
      }
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  row: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
})
