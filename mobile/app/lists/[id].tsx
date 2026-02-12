import { View, Text, FlatList, StyleSheet, ActivityIndicator, Share, Platform } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect, useState, useLayoutEffect } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { watchlistAPI } from '../../lib/api-client'
import { useAuth } from '../../context/auth-context'
import { colors, fontSize, spacing } from '../../constants/theme'
import ListHeader from '../../components/ListHeader'
import WatchlistItemRow from '../../components/WatchlistItemRow'
import ItemDetailSheet from '../../components/ItemDetailSheet'
import EmptyState from '../../components/EmptyState'
import type { Watchlist, WatchlistItem } from '../../types'
import { useLanguageStore } from '../../store/language'

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { content } = useLanguageStore()
  const { user } = useAuth()
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isCollaborator, setIsCollaborator] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: '' })
  }, [navigation])

  useEffect(() => {
    if (id) loadWatchlist()
  }, [id])

  const loadWatchlist = async () => {
    try {
      const response = await watchlistAPI.getById(id!)
      setWatchlist(response.watchlist)
      setIsSaved(response.isSaved)
      setIsCollaborator(response.isCollaborator)
    } catch (error) {
      console.error('Failed to load watchlist:', error)
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

  if (!watchlist) {
    return (
      <View style={styles.loading}>
        <Text style={styles.error}>Liste introuvable</Text>
      </View>
    )
  }

  const isOwner = watchlist.isOwner === true || watchlist.ownerId === user?.id

  const handleShare = async () => {
    const url = `https://poplist.me/lists/${id}`
    const message = `Découvre la liste "${watchlist.name}" sur Poplist !\n${url}`
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? { message, url }
          : { message },
      )
    } catch (_) {
      // User cancelled or share failed — silent
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <LinearGradient
        colors={['rgba(12, 39, 55, 0.45)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="none"
      />
      <FlatList
        style={styles.list}
        contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 32 }]}
        data={watchlist.items}
        keyExtractor={(item) => item.tmdbId.toString()}
        ListHeaderComponent={
          <ListHeader
            watchlist={watchlist}
            isOwner={isOwner}
            isSaved={isSaved}
            isCollaborator={isCollaborator}
            onShare={handleShare}
          />
        }
        renderItem={({ item, index }) => (
          <WatchlistItemRow
            item={item}
            index={index}
            onPress={() => setSelectedIndex(index)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title={content.watchlists.noItemsYet}
            description={content.watchlists.noItemsDescription}
          />
        }
      />
      <ItemDetailSheet
        item={selectedIndex !== null ? watchlist.items[selectedIndex] : null}
        visible={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
        items={watchlist.items}
        currentIndex={selectedIndex ?? 0}
        onNavigate={setSelectedIndex}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    zIndex: 0,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  error: {
    fontSize: fontSize.base,
    color: colors.destructive,
  },
})
