import { useCallback, useMemo, type ReactElement } from 'react'
import { View, FlatList, StyleSheet, ActivityIndicator, Dimensions, type StyleProp, type ViewStyle } from 'react-native'
import { GRID_COLUMNS } from '../constants/layout'
import { colors, spacing } from '../constants/theme'
import { useTheme } from '../hooks/useTheme'
import WatchlistCard from './WatchlistCard'
import EmptyState from './EmptyState'
import type { Watchlist } from '../types'

const screenWidth = Dimensions.get('window').width

/** Largeur d'une card pour une grille de `cols` colonnes, gouttières comprises. */
export function getCardWidth(cols: number = GRID_COLUMNS) {
  return (screenWidth - spacing.lg * 2 - spacing.sm * (cols - 1)) / cols
}

interface WatchlistGridProps {
  watchlists: Watchlist[] | undefined
  isPending: boolean
  emptyTitle: string
  /** `false` sur un profil : l'auteur est déjà le sujet de la page. */
  showOwner?: boolean
  ListHeaderComponent?: ReactElement | null
  contentContainerStyle?: StyleProp<ViewStyle>
}

/**
 * Grille de listes — composant PRÉSENTATIONNEL, sans data fetching.
 *
 * Trois écrans (Populaires, Catégorie, Profil) rendaient la même FlatList,
 * dupliquée à l'identique : mêmes colonnes, mêmes gouttières, même état vide,
 * même spinner. Ils divergeaient seulement par la source des données et un
 * éventuel en-tête, d'où cette séparation grille / chargement.
 */
export default function WatchlistGrid({
  watchlists,
  isPending,
  emptyTitle,
  showOwner = true,
  ListHeaderComponent,
  contentContainerStyle,
}: WatchlistGridProps) {
  const theme = useTheme()
  const cardWidth = useMemo(() => getCardWidth(GRID_COLUMNS), [])

  const renderItem = useCallback(
    ({ item }: { item: Watchlist }) => (
      <WatchlistCard watchlist={item} showOwner={showOwner} width={cardWidth} />
    ),
    [cardWidth, showOwner],
  )

  const keyExtractor = useCallback((item: Watchlist) => item.id, [])

  if (isPending) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      data={watchlists ?? []}
      keyExtractor={keyExtractor}
      numColumns={GRID_COLUMNS}
      columnWrapperStyle={styles.row}
      renderItem={renderItem}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={<EmptyState title={emptyTitle} />}
      // Rendu par lots : sur 500 listes, la grille montait tout d'un coup.
      initialNumToRender={GRID_COLUMNS * 4}
      windowSize={7}
      removeClippedSubviews
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
