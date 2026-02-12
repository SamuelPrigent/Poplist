import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { ChevronDown, X, Check } from 'lucide-react-native'
import { tmdbAPI } from '../../lib/api-client'
import { useLanguageStore } from '../../store/language'
import { getTMDBImageUrl, getTMDBLanguage } from '../../lib/utils'
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme'
import ItemDetailSheet from '../../components/ItemDetailSheet'
import type { WatchlistItem } from '../../types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const POSTER_GAP = spacing.sm
const POSTER_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - POSTER_GAP * 2) / 3
const POSTER_HEIGHT = POSTER_WIDTH * 1.5

type MediaType = 'movie' | 'tv'
type SortType = 'popularity.desc' | 'vote_average.desc'

interface GenreDef {
  id: number
  key: string
}

const MOVIE_GENRES: GenreDef[] = [
  { id: 28, key: 'action' },
  { id: 12, key: 'adventure' },
  { id: 16, key: 'animation' },
  { id: 35, key: 'comedy' },
  { id: 80, key: 'crime' },
  { id: 99, key: 'documentary' },
  { id: 18, key: 'drama' },
  { id: 10751, key: 'family' },
  { id: 14, key: 'fantasy' },
  { id: 27, key: 'horror' },
  { id: 10749, key: 'romance' },
  { id: 878, key: 'scienceFiction' },
  { id: 53, key: 'thriller' },
]

const TV_GENRES: GenreDef[] = [
  { id: 16, key: 'animation' },
  { id: 35, key: 'comedy' },
  { id: 80, key: 'crime' },
  { id: 99, key: 'documentary' },
  { id: 18, key: 'drama' },
  { id: 10751, key: 'family' },
  { id: 10765, key: 'sciFiFantasy' },
  { id: 10762, key: 'kids' },
  { id: 9648, key: 'mystery' },
  { id: 10766, key: 'soap' },
  { id: 37, key: 'western' },
]

interface DiscoverResult {
  id: number
  title?: string
  name?: string
  poster_path?: string
  backdrop_path?: string
  overview?: string
  vote_average?: number
  vote_count?: number
  release_date?: string
  first_air_date?: string
}

export default function ExploreScreen() {
  const { content, language } = useLanguageStore()

  // Filters
  const [mediaType, setMediaType] = useState<MediaType>('movie')
  const [sortBy, setSortBy] = useState<SortType>('popularity.desc')
  const [selectedGenres, setSelectedGenres] = useState<Set<number>>(new Set())
  const [yearMin, setYearMin] = useState('')
  const [yearMax, setYearMax] = useState('')

  // Genre modal
  const [genreModalVisible, setGenreModalVisible] = useState(false)

  // Data
  const [results, setResults] = useState<DiscoverResult[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Detail sheet
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const isLoadingMoreRef = useRef(false)
  const tmdbLang = getTMDBLanguage(language)

  useEffect(() => {
    setResults([])
    setPage(1)
    setTotalPages(1)
    fetchDiscover(1, true)
  }, [mediaType, sortBy, selectedGenres, yearMin, yearMax])

  const fetchDiscover = async (pageNum: number, isReset: boolean) => {
    if (isReset) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
      isLoadingMoreRef.current = true
    }

    try {
      const genresStr = selectedGenres.size > 0
        ? Array.from(selectedGenres).join('|')
        : undefined

      const response = await tmdbAPI.getDiscover(mediaType, {
        page: pageNum,
        language: tmdbLang,
        sortBy,
        voteCountGte: 100,
        voteAverageGte: 5,
        releaseDateGte: yearMin ? `${yearMin}-01-01` : undefined,
        releaseDateLte: yearMax ? `${yearMax}-12-31` : undefined,
        withGenres: genresStr,
      })

      if (isReset) {
        setResults(response.results)
      } else {
        setResults((prev) => [...prev, ...response.results])
      }
      setTotalPages(response.total_pages)
      setPage(pageNum)
    } catch (error) {
      console.error('Failed to load discover:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
      isLoadingMoreRef.current = false
    }
  }

  const loadMore = useCallback(() => {
    if (isLoadingMoreRef.current || page >= totalPages) return
    fetchDiscover(page + 1, false)
  }, [page, totalPages, mediaType, sortBy, selectedGenres, yearMin, yearMax])

  const toggleGenre = (genreId: number) => {
    setSelectedGenres((prev) => {
      const next = new Set(prev)
      if (next.has(genreId)) {
        next.delete(genreId)
      } else {
        next.add(genreId)
      }
      return next
    })
  }

  // Convert results to WatchlistItem[] for the detail sheet
  const sheetItems: WatchlistItem[] = useMemo(() =>
    results.map((r) => ({
      tmdbId: r.id,
      title: r.title || r.name || '',
      posterPath: r.poster_path || null,
      mediaType,
      platformList: [],
      addedAt: new Date().toISOString(),
    })),
    [results, mediaType],
  )

  const genres = mediaType === 'movie' ? MOVIE_GENRES : TV_GENRES

  // Genre label for the select button
  const genreButtonLabel = selectedGenres.size === 0
    ? 'Genres'
    : selectedGenres.size === 1
      ? (content.explore.genres as Record<string, string>)[
          genres.find((g) => selectedGenres.has(g.id))?.key || ''
        ] || 'Genre'
      : `${selectedGenres.size} genres`

  const renderPoster = useCallback(({ item, index }: { item: DiscoverResult; index: number }) => {
    const posterUrl = getTMDBImageUrl(item.poster_path, 'w342')
    return (
      <Pressable style={styles.posterWrapper} onPress={() => setSelectedIndex(index)}>
        {posterUrl ? (
          <Image
            source={{ uri: posterUrl }}
            style={styles.posterImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.posterImage, styles.posterPlaceholder]}>
            <Text style={styles.posterPlaceholderText}>
              {item.title || item.name}
            </Text>
          </View>
        )}
      </Pressable>
    )
  }, [mediaType])

  const renderFooter = () => {
    if (!isLoadingMore) return <View style={{ height: spacing['3xl'] }} />
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Filters header */}
      <View style={styles.filtersContainer}>
        {/* Title */}
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>{content.explore.title}</Text>
        </View>

        {/* Row 1: Media type + Sort — all on one line */}
        <View style={styles.filterRow}>
          <Pressable
            style={[styles.filterBtn, mediaType === 'movie' && styles.filterBtnActive]}
            onPress={() => setMediaType('movie')}
          >
            <Text style={[styles.filterBtnText, mediaType === 'movie' && styles.filterBtnTextActive]}>
              {content.explore.filters.movies}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterBtn, mediaType === 'tv' && styles.filterBtnActive]}
            onPress={() => setMediaType('tv')}
          >
            <Text style={[styles.filterBtnText, mediaType === 'tv' && styles.filterBtnTextActive]}>
              {content.explore.filters.series}
            </Text>
          </Pressable>

          <View style={styles.filterSpacer} />

          <Pressable
            style={[styles.filterBtn, sortBy === 'popularity.desc' && styles.filterBtnActive]}
            onPress={() => setSortBy('popularity.desc')}
          >
            <Text style={[styles.filterBtnText, sortBy === 'popularity.desc' && styles.filterBtnTextActive]}>
              {content.explore.filters.popular}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterBtn, sortBy === 'vote_average.desc' && styles.filterBtnActive]}
            onPress={() => setSortBy('vote_average.desc')}
          >
            <Text style={[styles.filterBtnText, sortBy === 'vote_average.desc' && styles.filterBtnTextActive]}>
              {content.explore.filters.bestRated}
            </Text>
          </Pressable>
        </View>

        {/* Row 2: Genre select + Year inputs */}
        <View style={styles.filterRow}>
          {/* Genre select button */}
          <Pressable
            style={[styles.selectBtn, selectedGenres.size > 0 && styles.selectBtnActive]}
            onPress={() => setGenreModalVisible(true)}
          >
            <Text
              style={[styles.selectBtnText, selectedGenres.size > 0 && styles.selectBtnTextActive]}
              numberOfLines={1}
            >
              {genreButtonLabel}
            </Text>
            <ChevronDown size={14} color={selectedGenres.size > 0 ? colors.foreground : colors.mutedForeground} />
          </Pressable>

          {/* Year min */}
          <View style={styles.yearInput}>
            <TextInput
              style={styles.yearInputText}
              placeholder={content.explore.filters.yearMin}
              placeholderTextColor={colors.mutedForeground}
              value={yearMin}
              onChangeText={(text) => setYearMin(text.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>

          {/* Year max */}
          <View style={styles.yearInput}>
            <TextInput
              style={styles.yearInputText}
              placeholder={content.explore.filters.yearMax}
              placeholderTextColor={colors.mutedForeground}
              value={yearMax}
              onChangeText={(text) => setYearMax(text.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>

          {/* Clear years */}
          {(yearMin || yearMax) && (
            <Pressable
              style={styles.clearBtn}
              onPress={() => { setYearMin(''); setYearMax('') }}
            >
              <X size={14} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Results grid */}
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{content.explore.noResults}</Text>
          <Text style={styles.emptyDescription}>{content.explore.noResultsDescription}</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          numColumns={3}
          columnWrapperStyle={styles.posterRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderPoster}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      )}

      {/* Genre select modal */}
      <Modal
        visible={genreModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGenreModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setGenreModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Genres</Text>
              {selectedGenres.size > 0 && (
                <Pressable onPress={() => setSelectedGenres(new Set())}>
                  <Text style={styles.modalClear}>{content.explore.filters.clearYears}</Text>
                </Pressable>
              )}
            </View>
            <ScrollView style={styles.modalList}>
              {genres.map((genre) => {
                const isActive = selectedGenres.has(genre.id)
                const label = (content.explore.genres as Record<string, string>)[genre.key] || genre.key
                return (
                  <Pressable
                    key={genre.id}
                    style={styles.modalItem}
                    onPress={() => toggleGenre(genre.id)}
                  >
                    <Text style={[styles.modalItemText, isActive && styles.modalItemTextActive]}>
                      {label}
                    </Text>
                    {isActive && <Check size={18} color={colors.foreground} />}
                  </Pressable>
                )
              })}
            </ScrollView>
            <Pressable
              style={styles.modalDone}
              onPress={() => setGenreModalVisible(false)}
            >
              <Text style={styles.modalDoneText}>OK</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

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
  filtersContainer: {
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  pageTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.foreground,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBtnText: {
    fontSize: fontSize.xs,
    color: colors.foreground,
  },
  filterBtnTextActive: {
    color: colors.primaryForeground,
  },
  filterSpacer: {
    width: spacing.sm,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectBtnActive: {
    borderColor: colors.mutedForeground,
  },
  selectBtnText: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  selectBtnTextActive: {
    color: colors.foreground,
  },
  yearInput: {
    flex: 1,
  },
  yearInputText: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    fontSize: fontSize.xs,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
  },
  clearBtn: {
    padding: spacing.xs,
  },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0a1122',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  modalClear: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  modalList: {
    paddingHorizontal: spacing.lg,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: {
    fontSize: fontSize.base,
    color: colors.mutedForeground,
  },
  modalItemTextActive: {
    color: colors.foreground,
    fontWeight: '600',
  },
  modalDone: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  modalDoneText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.primaryForeground,
  },
  // Grid
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  gridContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  posterRow: {
    gap: POSTER_GAP,
    marginBottom: POSTER_GAP,
  },
  posterWrapper: {
    width: POSTER_WIDTH,
  },
  posterImage: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: borderRadius.md,
  },
  posterPlaceholder: {
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.sm,
  },
  posterPlaceholderText: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  loadingMore: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
})
