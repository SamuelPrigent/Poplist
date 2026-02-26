import { View, Text, StyleSheet, ActivityIndicator, Pressable, Dimensions } from 'react-native'
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, withTiming, Easing, useAnimatedRef } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Sortable from 'react-native-sortables'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import { mutate } from 'swr'
import { useMyWatchlists } from '../../hooks/swr'
import { watchlistAPI } from '../../lib/api-client'
import { useLanguageStore } from '../../store/language'
import { usePreferencesStore } from '../../store/preferences'
import { useAuth } from '../../context/auth-context'
import { colors, fontSize, spacing, borderRadius } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'
import WatchlistCard from '../../components/WatchlistCard'
import EmptyState from '../../components/EmptyState'
import CreateListSheet, { type CreateListSheetRef } from '../../components/sheets/CreateListSheet'
import DeleteListSheet, { type DeleteListSheetRef } from '../../components/sheets/DeleteListSheet'
import { Plus } from 'lucide-react-native'
import type { Watchlist } from '../../types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

function getCardWidth(cols: number) {
  return (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * (cols - 1)) / cols
}

type FilterKey = 'mine' | 'saved'

export default function ListsScreen() {
  const { content } = useLanguageStore()
  const { columns } = usePreferencesStore()
  const { user } = useAuth()
  const theme = useTheme()
  const cardWidth = getCardWidth(columns)
  const router = useRouter()
  const { data, isLoading } = useMyWatchlists()
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set(['mine', 'saved']))

  // Local state for ordering (optimistic updates)
  const [orderedWatchlists, setOrderedWatchlists] = useState<Watchlist[]>([])

  // Sync SWR data to local state
  useEffect(() => {
    if (data?.watchlists) {
      setOrderedWatchlists(data.watchlists)
    }
  }, [data?.watchlists])

  // ScrollView ref for auto-scroll during drag
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>()

  // Scroll-based FAB animation
  const lastScrollY = useSharedValue(0)
  const buttonTranslateY = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y
      const diff = y - lastScrollY.value
      const timingConfig = { duration: 200, easing: Easing.out(Easing.quad) }
      if (diff > 5 && y > 50) {
        buttonTranslateY.value = withTiming(200, timingConfig)
      } else if (diff < -5) {
        buttonTranslateY.value = withTiming(0, timingConfig)
      }
      lastScrollY.value = y
    },
  })

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: buttonTranslateY.value }],
  }))

  // Sheet refs
  const createListRef = useRef<CreateListSheetRef>(null)
  const deleteListRef = useRef<DeleteListSheetRef>(null)

  const handleCreateList = useCallback(() => {
    createListRef.current?.present()
  }, [])

  const handleDeleteList = useCallback((watchlist: Watchlist) => {
    deleteListRef.current?.present({ id: watchlist.id, name: watchlist.name })
  }, [])

  const toggleFilter = (key: FilterKey) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const filteredWatchlists = useMemo(() => {
    return orderedWatchlists.filter((w: Watchlist) => {
      const isOwner = w.isOwner === true || w.ownerId === user?.id
      const isCollab = w.isCollaborator === true
      const isSaved = w.isSaved === true && !isOwner && !isCollab

      if (activeFilters.size === 0) return true
      if (activeFilters.has('mine') && (isOwner || isCollab)) return true
      if (activeFilters.has('saved') && isSaved) return true
      return false
    })
  }, [orderedWatchlists, activeFilters, user?.id])

  // Sorting only enabled when showing all items (no subset filtering)
  const isSortEnabled = activeFilters.size === 0 || activeFilters.size === 2

  const handleDragStart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }, [])

  // Drag end handler with optimistic update
  const handleDragEnd = useCallback(async ({ data: reorderedData }: { data: Watchlist[] }) => {
    const previousOrder = orderedWatchlists
    setOrderedWatchlists(reorderedData)

    try {
      await watchlistAPI.reorderWatchlists(reorderedData.map(w => w.id))
      mutate('/watchlists/mine')
    } catch {
      setOrderedWatchlists(previousOrder)
      Toast.show({ type: 'error', text1: 'Erreur lors du réordonnancement' })
    }
  }, [orderedWatchlists])

  const renderItem = useCallback(({ item }: { item: Watchlist }) => (
    <WatchlistCard
      watchlist={item}
      showOwner={false}
      width={cardWidth}
    />
  ), [cardWidth])

  const keyExtractor = useCallback((item: Watchlist) => item.id, [])

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'mine', label: content.watchlists.myWatchlists },
    { key: 'saved', label: content.watchlists.followed },
  ]

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{content.watchlists.myWatchlists}</Text>
      </View>

      {/* Filter chips (multi-select) */}
      <View style={styles.filters}>
        {filters.map((filter) => {
          const isActive = activeFilters.has(filter.key)
          return (
            <Pressable
              key={filter.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => toggleFilter(filter.key)}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {/* Watchlists grid */}
      {filteredWatchlists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState title={content.watchlists.noWatchlists} />
        </View>
      ) : (
        <Animated.ScrollView
          key={columns}
          ref={scrollViewRef}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Sortable.Grid
            data={filteredWatchlists}
            renderItem={renderItem}
            columns={columns}
            keyExtractor={keyExtractor}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            sortEnabled={isSortEnabled}
            dragActivationDelay={600}
            hapticsEnabled={false}
            strategy="insert"
            activeItemScale={1.05}
            activeItemOpacity={0.9}
            inactiveItemOpacity={0.6}
            rowGap={spacing.xl}
            columnGap={spacing.sm}
            scrollableRef={scrollViewRef}
            autoScrollEnabled
          />
        </Animated.ScrollView>
      )}

      {/* Sticky bottom button */}
      <Animated.View style={[styles.createButton, fabAnimatedStyle]}>
        <Pressable
          style={styles.createButtonInner}
          onPress={handleCreateList}
        >
          <Plus size={20} color="#000" />
          <Text style={styles.createButtonText}>Créer une liste</Text>
        </Pressable>
      </Animated.View>

      {/* Sheets */}
      <CreateListSheet ref={createListRef} />
      <DeleteListSheet ref={deleteListRef} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 2,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.foreground,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['3xl'],
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    height: 31,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 0,
    backgroundColor: colors.muted,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  filterTextActive: {
    color: colors.primaryForeground,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 160,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    width: '70%',
  },
  createButtonInner: {
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: fontSize.base,
  },
})
