import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { GripVertical, CirclePlus, CircleCheck } from 'lucide-react-native'
import { getTMDBImageUrl } from '../lib/utils'
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme'
import { useLanguageStore } from '../store/language'
import ProviderIcon from './ProviderIcon'
import { getMatchedProviders } from '../lib/providers'
import type { WatchlistItem } from '../types'

interface WatchlistItemRowProps {
  item: WatchlistItem
  onPress: () => void
  /** Ouvre le sélecteur de listes (drawer « Ajouter à une liste »). */
  onPickerPress?: () => void
  /** `true` → coche verte : l'élément est dans au moins une de mes listes. */
  isInMyLists?: boolean
  drag?: () => void
  isActive?: boolean
  /** Poignée de drag : réservée au propriétaire de la liste. */
  showGrip?: boolean
}

/** « 1h 25 min » / « 45 min » (format PWA, minutes sur 2 chiffres). */
function formatRuntime(minutes?: number | null): string | null {
  if (!minutes) return null
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${String(m).padStart(2, '0')} min` : `${h}h`
}

/**
 * Ligne d'un élément de liste — portage de `SortableMobileCard`
 * (`frontend/src/components/List/ListItemsTable.tsx`) :
 * poignée de drag · affiche 52px étirée · titre · badge de type ·
 * durée + plateformes · sélecteur de listes à droite (coche verte si présent).
 */
export default function WatchlistItemRow({
  item,
  onPress,
  onPickerPress,
  isInMyLists = false,
  drag,
  isActive,
  showGrip = true,
}: WatchlistItemRowProps) {
  const { content } = useLanguageStore()
  const isSeries = item.mediaType !== 'movie'
  const typeLabel = isSeries
    ? content.watchlists.contentTypes.series
    : content.watchlists.contentTypes.movie
  const posterUrl = getTMDBImageUrl(item.posterPath, 'w154')

  const duration = isSeries
    ? item.numberOfSeasons
      ? `${item.numberOfSeasons} ${item.numberOfSeasons === 1 ? 'saison' : 'saisons'}`
      : null
    : formatRuntime(item.runtime)

  // `platformList` contient des objets TMDB : on passe par le mapping partagé.
  const platforms = getMatchedProviders(item.platformList ?? [])

  return (
    <Pressable
      style={[styles.container, isActive && styles.containerActive]}
      onPress={onPress}
      onLongPress={drag}
      delayLongPress={600}
    >
      {/* Poignée de glisser-déposer (PWA : GripVertical à gauche). L'appui
          long reste actif : la poignée est un repère visuel, comme sur le web. */}
      {showGrip && (
        <View style={styles.gripWrap}>
          <GripVertical size={14} color="rgba(138, 143, 152, 0.4)" />
        </View>
      )}

      {posterUrl ? (
        <Image
          source={{ uri: posterUrl }}
          style={styles.poster}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={`item-${item.tmdbId}`}
          transition={0}
        />
      ) : (
        <View style={[styles.poster, styles.noPoster]} />
      )}

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.badgesRow}>
          <View style={[styles.badge, isSeries && styles.badgeSeries]}>
            <Text style={[styles.badgeText, isSeries && styles.badgeTextSeries]}>{typeLabel}</Text>
          </View>
        </View>

        {/* Durée · plateformes (PWA : mt-2 pt-2, 14 muted) */}
        {(duration || platforms.length > 0) && (
          <View style={styles.metaRow}>
            {duration ? <Text style={styles.metaText}>{duration}</Text> : null}
            {duration && platforms.length > 0 ? <Text style={styles.metaDot}>·</Text> : null}
            {platforms.length > 0 && (
              <View style={styles.providers}>
                {platforms.slice(0, 3).map(p => (
                  <ProviderIcon key={p} provider={p} size={22} />
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Sélecteur de listes — remplace l'ancien menu « … » */}
      {onPickerPress && (
        <Pressable style={styles.pickerButton} onPress={onPickerPress} hitSlop={8}>
          {isInMyLists ? (
            <CircleCheck size={22} color={colors.background} fill="#22c55e" />
          ) : (
            <CirclePlus size={22} color={colors.mutedForeground} strokeWidth={1.6} />
          )}
        </Pressable>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    // PWA (SortableMobileCard) : py-3 gap-2.25 + bordure haute border/60
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(38, 40, 45, 0.6)',
    gap: 9,
  },
  gripWrap: {
    justifyContent: 'center',
    paddingRight: 2,
  },
  poster: {
    // PWA : w-[52px] + self-stretch (l'affiche occupe TOUTE la hauteur de la ligne)
    width: 52,
    minHeight: 78,
    alignSelf: 'stretch',
    borderRadius: 6,
    backgroundColor: colors.muted,
  },
  noPoster: {
    backgroundColor: colors.muted,
  },
  info: {
    flex: 1,
    paddingRight: 4,
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: '#ffffff',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 6,
    alignItems: 'center',
  },
  badge: {
    // PWA : rounded-full px-2 py-0.5 text-xs — film bleu, série violet
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  metaText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  metaDot: {
    fontSize: fontSize.lg,
    lineHeight: 18,
    color: 'rgba(138, 143, 152, 0.7)',
  },
  providers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pickerButton: {
    // PWA : aligné en HAUT de la ligne (top-3.5), pas centré verticalement
    alignSelf: 'flex-start',
    paddingTop: 2,
    paddingLeft: 6,
  },
  containerActive: {
    backgroundColor: colors.card,
    borderRadius: 8,
    transform: [{ scale: 1.03 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
})
