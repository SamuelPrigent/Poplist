import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Animated as RNAnimated,
} from 'react-native'
import { Image } from 'expo-image'
import { Film, CirclePlus, CheckCircle2, Search, X } from 'lucide-react-native'
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { watchlistAPI } from '../../lib/api-client'
import { getTMDBImageUrl } from '../../lib/utils'
import { useLanguageStore } from '../../store/language'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fontSize, spacing, borderRadius } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'
import Toast from 'react-native-toast-message'
import AddToListSheet from '../AddToListSheet'

interface TMDBResult {
  id: number
  media_type: 'movie' | 'tv'
  title?: string
  name?: string
  poster_path: string | null
  release_date?: string
  first_air_date?: string
}

export interface SearchSheetRef {
  present: () => void
  dismiss: () => void
}

interface SearchSheetProps {
  watchlistId?: string
  onItemAdded?: () => void
}

/** Button with pulse animation on state change */
function PulseAddButton({ isAdded, onPress }: { isAdded: boolean; onPress: () => void }) {
  const scale = React.useRef(new RNAnimated.Value(1)).current
  const prevAdded = React.useRef(isAdded)

  React.useEffect(() => {
    if (prevAdded.current !== isAdded) {
      prevAdded.current = isAdded
      RNAnimated.sequence([
        RNAnimated.timing(scale, { toValue: 1.35, duration: 80, useNativeDriver: true }),
        RNAnimated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start()
    }
  }, [isAdded])

  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.addButton}>
      <RNAnimated.View style={{ transform: [{ scale }] }}>
        {isAdded ? (
          <CheckCircle2 size={24} color="#121212" fill="#22c55e" />
        ) : (
          <CirclePlus size={24} color={colors.mutedForeground} />
        )}
      </RNAnimated.View>
    </Pressable>
  )
}

const SearchSheet = forwardRef<SearchSheetRef, SearchSheetProps>(function SearchSheet({ watchlistId, onItemAdded }, ref) {
  const { content, language } = useLanguageStore()
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TMDBResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedItem, setSelectedItem] = useState<TMDBResult | null>(null)
  const [addToListVisible, setAddToListVisible] = useState(false)
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set())

  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const snapPoints = ['100%']

  useImperativeHandle(ref, () => ({
    present: () => bottomSheetRef.current?.present(),
    dismiss: () => bottomSheetRef.current?.dismiss(),
  }))

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

  const handleClear = useCallback(() => {
    setQuery('')
    setResults([])
  }, [])

  const handleToggleItem = useCallback(async (item: TMDBResult) => {
    if (watchlistId) {
      const isCurrentlyAdded = addedItems.has(item.id)

      // Optimistic toggle
      if (isCurrentlyAdded) {
        setAddedItems(prev => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
      } else {
        setAddedItems(prev => new Set(prev).add(item.id))
      }

      try {
        if (isCurrentlyAdded) {
          await watchlistAPI.removeItem(watchlistId, item.id.toString())
        } else {
          await watchlistAPI.addItem(watchlistId, {
            tmdbId: item.id.toString(),
            mediaType: item.media_type,
            language: language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : language === 'de' ? 'de-DE' : language === 'it' ? 'it-IT' : language === 'pt' ? 'pt-BR' : 'en-US',
          })
        }
        onItemAdded?.()
      } catch (error: any) {
        // Revert on error
        if (isCurrentlyAdded) {
          setAddedItems(prev => new Set(prev).add(item.id))
        } else {
          setAddedItems(prev => {
            const next = new Set(prev)
            next.delete(item.id)
            return next
          })
        }
        Toast.show({
          type: 'error',
          text1: error?.message || 'Erreur',
        })
      }
    } else {
      // Explorer mode — open list picker
      setSelectedItem(item)
      setAddToListVisible(true)
    }
  }, [watchlistId, language, onItemAdded, addedItems])

  const handleDismiss = useCallback(() => {
    setQuery('')
    setResults([])
    setSelectedItem(null)
    setAddToListVisible(false)
    setAddedItems(new Set())
  }, [])

  const handleAddToListClose = useCallback(() => {
    setAddToListVisible(false)
    setSelectedItem(null)
  }, [])

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
        pressBehavior="close"
      />
    ),
    []
  )

  const getYear = (item: TMDBResult) => {
    const date = item.release_date || item.first_air_date
    return date ? date.substring(0, 4) : ''
  }

  const renderResultItem = useCallback(({ item }: { item: TMDBResult }) => {
    const year = getYear(item)
    const typeLabel = item.media_type === 'movie'
      ? content.watchlists.contentTypes.movie
      : content.watchlists.contentTypes.series
    const posterUrl = getTMDBImageUrl(item.poster_path, 'w92')
    const isAdded = addedItems.has(item.id)

    return (
      <View style={styles.resultItem}>
        {posterUrl ? (
          <Image
            source={{ uri: posterUrl }}
            style={[styles.poster, { backgroundColor: theme.secondary }]}
            contentFit="cover"
            recyclingKey={`search-${item.id}`}
            transition={0}
          />
        ) : (
          <View style={[styles.poster, styles.noPoster, { backgroundColor: theme.secondary }]}>
            <Film size={20} color={colors.mutedForeground} strokeWidth={1.5} />
          </View>
        )}
        <View style={styles.resultInfo}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.title || item.name}
          </Text>
          <Text style={styles.resultMeta}>
            {typeLabel}{year ? ` · ${year}` : ''}
          </Text>
        </View>
        <PulseAddButton
          isAdded={isAdded}
          onPress={() => handleToggleItem(item)}
        />
      </View>
    )
  }, [content, theme, handleToggleItem, addedItems])

  return (
    <>
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        onDismiss={handleDismiss}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: 'rgba(255,255,255,0.25)', width: 36 }}
        backgroundStyle={{ backgroundColor: theme.panel, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="none"
        android_keyboardInputMode="adjustResize"
      >
        {/* Search bar */}
        <View style={styles.searchBarContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme.secondary }]}>
            <Search size={18} color={colors.mutedForeground} />
            <BottomSheetTextInput
              style={styles.searchInput}
              placeholder={content.watchlists.searchPlaceholder}
              placeholderTextColor={colors.mutedForeground}
              value={query}
              onChangeText={handleSearch}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {query.length > 0 && (
              <Pressable onPress={handleClear} hitSlop={8}>
                <X size={18} color={theme.mutedForeground} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Content */}
        {isSearching && (
          <ActivityIndicator style={styles.spinner} color={colors.primary} />
        )}

        {query.length < 2 && !isSearching ? (
          <View style={styles.emptyContainer}>
            <Film size={48} color={colors.mutedForeground} strokeWidth={1} />
            <Text style={styles.emptyText}>
              {content.watchlists.startSearching}
            </Text>
          </View>
        ) : (
          <BottomSheetFlatList
            data={results}
            keyExtractor={(item: TMDBResult) => `${item.id}-${item.media_type}`}
            renderItem={renderResultItem}
            contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + spacing.lg, spacing['4xl']) }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              !isSearching ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{content.watchlists.noResults}</Text>
                </View>
              ) : null
            }
          />
        )}
      </BottomSheetModal>

      {/* Add to list modal */}
      <AddToListSheet
        visible={addToListVisible}
        onClose={handleAddToListClose}
        selectedItem={selectedItem ? {
          tmdbId: selectedItem.id,
          mediaType: selectedItem.media_type,
          title: selectedItem.title || selectedItem.name || '',
        } : undefined}
      />
    </>
  )
})

export default SearchSheet

const styles = StyleSheet.create({
  searchBarContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
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
  spinner: {
    marginVertical: spacing.md,
  },
  listContent: {
    paddingBottom: spacing['4xl'],
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
    padding: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing['4xl'],
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.mutedForeground,
    textAlign: 'center',
    paddingHorizontal: spacing['3xl'],
  },
})
