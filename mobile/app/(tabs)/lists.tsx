import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, Dimensions } from 'react-native'
import { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Plus } from 'lucide-react-native'
import { useMyWatchlists } from '../../hooks/swr'
import { useLanguageStore } from '../../store/language'
import { usePreferencesStore } from '../../store/preferences'
import { useAuth } from '../../context/auth-context'
import { colors, fontSize, spacing, borderRadius } from '../../constants/theme'
import WatchlistCard from '../../components/WatchlistCard'
import EmptyState from '../../components/EmptyState'
import FloatingActionButton from '../../components/FloatingActionButton'
import type { Watchlist } from '../../types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

function getCardWidth(cols: number) {
  return (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * (cols - 1)) / cols
}

type FilterKey = 'mine' | 'saved'

export default function ListsScreen() {
  const { content } = useLanguageStore()
  const { columns, handedness } = usePreferencesStore()
  const { user } = useAuth()
  const cardWidth = getCardWidth(columns)
  const router = useRouter()
  const { data, isLoading } = useMyWatchlists()
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set(['mine', 'saved']))

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

  const watchlists = data?.watchlists ?? []

  const filteredWatchlists = watchlists.filter((w: Watchlist) => {
    const isOwner = w.isOwner === true || w.ownerId === user?.id
    const isCollab = w.isCollaborator === true
    const isSaved = w.isSaved === true && !isOwner && !isCollab

    // No filter active → show all
    if (activeFilters.size === 0) return true

    if (activeFilters.has('mine') && (isOwner || isCollab)) return true
    if (activeFilters.has('saved') && isSaved) return true

    return false
  })

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'mine', label: content.watchlists.myWatchlists },
    { key: 'saved', label: content.watchlists.followed },
  ]

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
      <FlatList
        key={columns}
        data={filteredWatchlists}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <WatchlistCard
              watchlist={item}
              showOwner={false}
              width={cardWidth}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState title={content.watchlists.noWatchlists} />
        }
      />

      {/* FAB */}
      <FloatingActionButton
        icon={<Plus size={24} color={colors.foreground} />}
        onPress={() => {/* Phase 1: non-functional */}}
        handedness={handedness}
      />
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
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.foreground,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  filterTextActive: {
    color: colors.primaryForeground,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  columnWrapper: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
})
