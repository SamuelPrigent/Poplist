import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { CirclePlus } from 'lucide-react-native'
import { useGetWatchlistRecommendations } from '@poplist/shared/generated'
import { getTMDBImageUrl } from '../lib/utils'
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme'
import { useLanguageStore } from '../store/language'

interface ListRecommendationsProps {
  watchlistId: string
  /** Ouvre la fiche du média. */
  onOpenDetails: (tmdbId: number, mediaType: 'movie' | 'tv', title: string) => void
  /** Ouvre le sélecteur de listes pour ce média. */
  onAdd?: (tmdbId: number, mediaType: 'movie' | 'tv', title: string) => void
}

/** PWA : 10 recommandations par page, « Actualiser » fait tourner les pages. */
const PAGE_SIZE = 10

/** « 1h 25 min » / « 45 min ». */
function formatRuntime(minutes?: number | null): string | null {
  if (!minutes) return null
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${String(m).padStart(2, '0')} min` : `${h}h`
}

/**
 * Recommandations en bas d'une liste — portage de
 * `frontend/src/components/List/ListRecommendations.tsx` (rendu mobile).
 * Consomme le hook généré par Kubb, sans méthode SDK écrite à la main.
 */
export default function ListRecommendations({
  watchlistId,
  onOpenDetails,
  onAdd,
}: ListRecommendationsProps) {
  const { content } = useLanguageStore()
  const { data, isLoading } = useGetWatchlistRecommendations(watchlistId)
  const [page, setPage] = useState(0)
  const items = data?.items ?? []

  // Rien tant qu'on n'a rien à montrer : afficher le titre au-dessus d'un
  // spinner donnait une section « Recommandés » vide au chargement.
  if (isLoading || items.length === 0) return null

  // Pagination cyclique, comme la PWA : « Actualiser » fait défiler les pages
  // en boucle plutôt que d'ajouter à la suite.
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const start = (page % totalPages) * PAGE_SIZE
  const displayItems = items.slice(start, start + PAGE_SIZE)
  const showRefresh = items.length > PAGE_SIZE

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Recommandés</Text>
      <Text style={styles.subtitle}>En fonction du contenu de cette liste</Text>

      {displayItems.map((item, index) => {
          const posterUrl = getTMDBImageUrl(item.posterPath, 'w185')
          const isSeries = item.mediaType !== 'movie'
          const typeLabel = isSeries
            ? content.watchlists.contentTypes.series
            : content.watchlists.contentTypes.movie
          const meta = isSeries
            ? item.numberOfSeasons
              ? `${item.numberOfSeasons} ${item.numberOfSeasons === 1 ? 'saison' : 'saisons'}`
              : null
            : formatRuntime(item.runtime)

          return (
            <Pressable
              key={`${item.mediaType}-${item.tmdbId}`}
              style={[styles.row, index === 0 && styles.rowFirst]}
              onPress={() =>
                onOpenDetails(item.tmdbId, item.mediaType as 'movie' | 'tv', item.title)
              }
            >
              {posterUrl ? (
                <Image
                  source={{ uri: posterUrl }}
                  style={styles.poster}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  recyclingKey={`reco-${item.tmdbId}`}
                  transition={0}
                />
              ) : (
                <View style={[styles.poster, styles.noPoster]} />
              )}

              <View style={styles.info}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.metaRow}>
                  <View style={[styles.badge, isSeries && styles.badgeSeries]}>
                    <Text style={[styles.badgeText, isSeries && styles.badgeTextSeries]}>
                      {typeLabel}
                    </Text>
                  </View>
                  {meta ? <Text style={styles.meta}>{meta}</Text> : null}
                </View>
              </View>

              {onAdd && (
                <Pressable
                  style={styles.addButton}
                  hitSlop={8}
                  onPress={() => onAdd(item.tmdbId, item.mediaType as 'movie' | 'tv', item.title)}
                >
                  <CirclePlus size={22} color={colors.mutedForeground} strokeWidth={1.6} />
                </Pressable>
              )}
            </Pressable>
          )
      })}

      {showRefresh && (
        <Pressable style={styles.refresh} onPress={() => setPage(p => p + 1)} hitSlop={8}>
          <Text style={styles.refreshText}>Actualiser</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    // PWA : séparateur haut + marge (mt-4 pt-6 en mobile)
    marginTop: spacing.lg,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(38, 40, 45, 0.6)',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  refresh: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs,
    marginTop: spacing.md,
  },
  refreshText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.mutedForeground,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(38, 40, 45, 0.6)',
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  poster: {
    // PWA : h-[78px] w-[56px]
    width: 56,
    height: 78,
    borderRadius: 6,
    backgroundColor: colors.muted,
  },
  noPoster: {
    backgroundColor: colors.muted,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 6,
  },
  badge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  badgeSeries: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: '#60a5fa',
  },
  badgeTextSeries: {
    color: '#c084fc',
  },
  meta: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  addButton: {
    paddingLeft: spacing.sm,
  },
})
