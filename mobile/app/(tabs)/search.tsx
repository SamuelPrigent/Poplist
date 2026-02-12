import { View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator, Pressable } from 'react-native'
import { useState, useCallback, useRef, useMemo } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { Search, Plus, Film } from 'lucide-react-native'
import { watchlistAPI } from '../../lib/api-client'
import { getTMDBImageUrl } from '../../lib/utils'
import { useLanguageStore } from '../../store/language'
import { usePreferencesStore } from '../../store/preferences'
import { colors, fontSize, spacing, borderRadius } from '../../constants/theme'
import EmptyState from '../../components/EmptyState'
import FloatingActionButton from '../../components/FloatingActionButton'
import ItemDetailSheet from '../../components/ItemDetailSheet'
import type { WatchlistItem } from '../../types'

interface TMDBResult {
  id: number
  media_type: 'movie' | 'tv'
  title?: string
  name?: string
  poster_path: string | null
  release_date?: string
  first_air_date?: string
}

export default function SearchScreen() {
  const { content, language } = useLanguageStore()
  const { handedness } = usePreferencesStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TMDBResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<TextInput>(null)
  const listRef = useRef<FlatList>(null)

  const performSearch = useCallback(async (text: string) => {
    if (text.length < 2) {
      setResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await watchlistAPI.searchTMDB({
        query: text,
        language: language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : language === 'de' ? 'de-DE' : language === 'it' ? 'it-IT' : language === 'pt' ? 'pt-BR' : 'en-US',
      })
      setResults(response.results)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }, [language])

  const handleSearch = useCallback((text: string) => {
    setQuery(text)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      performSearch(text)
    }, 300)
  }, [performSearch])

  const handleAddPress = (item: TMDBResult) => {
    const index = results.findIndex((r) => r.id === item.id && r.media_type === item.media_type)
    if (index !== -1) setSelectedIndex(index)
  }

  // Convert results to WatchlistItem[] for the detail sheet
  const sheetItems: WatchlistItem[] = useMemo(() =>
    results.map((r) => ({
      tmdbId: r.id,
      title: r.title || r.name || '',
      posterPath: r.poster_path || null,
      mediaType: r.media_type,
      platformList: [],
      addedAt: new Date().toISOString(),
    })),
    [results],
  )

  const getYear = (item: TMDBResult) => {
    const date = item.release_date || item.first_air_date
    return date ? date.substring(0, 4) : ''
  }

  const renderResultItem = ({ item }: { item: TMDBResult }) => {
    const year = getYear(item)
    const typeLabel = item.media_type === 'movie'
      ? content.watchlists.contentTypes.movie
      : content.watchlists.contentTypes.series
    const posterUrl = getTMDBImageUrl(item.poster_path, 'w92')

    return (
      <Pressable style={styles.resultItem} onPress={() => handleAddPress(item)}>
        {posterUrl ? (
          <Image
            source={{ uri: posterUrl }}
            style={styles.poster}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.poster, styles.noPoster]}>
            <Film size={20} color={colors.mutedForeground} strokeWidth={1.5} />
          </View>
        )}
        <View style={styles.resultInfo}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.title || item.name}
          </Text>
          <Text style={styles.resultMeta}>
            {typeLabel}{year ? ` \u00b7 ${year}` : ''}
          </Text>
        </View>
        <Pressable
          style={styles.addButton}
          onPress={() => handleAddPress(item)}
          hitSlop={8}
        >
          <Plus size={18} color={colors.foreground} />
        </Pressable>
      </Pressable>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top bar — search input */}
      <View style={styles.topBar}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.mutedForeground} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={content.watchlists.searchPlaceholder}
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Content zone */}
      <View style={styles.contentZone}>
        {/* Loading indicator */}
        {isSearching && (
          <ActivityIndicator style={styles.spinner} color={colors.primary} />
        )}

        {/* Results or empty state */}
        {query.length < 2 && !isSearching ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              title={content.watchlists.startSearching}
            />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={results}
            keyExtractor={(item) => `${item.id}-${item.media_type}`}
            renderItem={renderResultItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !isSearching ? (
                <View style={styles.emptyContainer}>
                  <EmptyState title={content.watchlists.noResults} />
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* FAB — search focus */}
      <FloatingActionButton
        icon={<Search size={24} color={colors.foreground} />}
        onPress={() => {
          inputRef.current?.blur()
          setTimeout(() => inputRef.current?.focus(), 50)
        }}
        handedness={handedness}
      />

      {/* Detail sheet */}
      <ItemDetailSheet
        item={selectedIndex !== null ? sheetItems[selectedIndex] : null}
        visible={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
        items={sheetItems}
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
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  contentZone: {
    flex: 1,
  },
  spinner: {
    marginVertical: spacing.md,
  },
  listContent: {
    paddingBottom: spacing['2xl'],
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  poster: {
    width: 50,
    height: 75,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.secondary,
  },
  noPoster: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.foreground,
  },
  resultMeta: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing['4xl'],
  },
})
