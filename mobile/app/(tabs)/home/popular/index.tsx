import { View, FlatList, StyleSheet, ActivityIndicator, Dimensions } from 'react-native'
import { useEffect, useState } from 'react'
import { watchlistAPI } from '../../../../lib/api-client'
import { useLanguageStore } from '../../../../store/language'
import { usePreferencesStore } from '../../../../store/preferences'
import { colors, spacing } from '../../../../constants/theme'
import { useTheme } from '../../../../hooks/useTheme'
import WatchlistCard from '../../../../components/WatchlistCard'
import EmptyState from '../../../../components/EmptyState'
import type { Watchlist } from '../../../../types'

const screenWidth = Dimensions.get('window').width

function getCardWidth(cols: number) {
  return (screenWidth - spacing.lg * 2 - spacing.sm * (cols - 1)) / cols
}

export default function AllPopularScreen() {
  const theme = useTheme()
  const { content } = useLanguageStore()
  const { columns } = usePreferencesStore()
  const isListMode = columns === 1
  const gridCols = isListMode ? 2 : columns
  const cardWidth = getCardWidth(gridCols)
  const [watchlists, setWatchlists] = useState<Watchlist[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadWatchlists()
  }, [])

  const loadWatchlists = async () => {
    try {
      const response = await watchlistAPI.getPublicWatchlists(500)
      setWatchlists(response.watchlists)
    } catch (error) {
      console.error('Failed to load popular watchlists:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (isListMode) {
    return (
      <FlatList
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        data={watchlists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WatchlistCard watchlist={item} showOwner layout="list" />
        )}
        ListEmptyComponent={
          <EmptyState title={content.watchlists.noItemsYet} />
        }
      />
    )
  }

  return (
    <FlatList
      key={gridCols}
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      data={watchlists}
      keyExtractor={(item) => item.id}
      numColumns={gridCols}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <WatchlistCard watchlist={item} showOwner width={cardWidth} />
      )}
      ListEmptyComponent={
        <EmptyState title={content.watchlists.noItemsYet} />
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
    paddingBottom: spacing['4xl'],
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
