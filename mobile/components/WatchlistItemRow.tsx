import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { MoreVertical } from 'lucide-react-native'
import { getTMDBImageUrl } from '../lib/utils'
import { useLanguageStore } from '../store/language'
import type { WatchlistItem } from '../types'

interface WatchlistItemRowProps {
  item: WatchlistItem
  onPress: () => void
  onOptionsPress?: () => void
  drag?: () => void
  isActive?: boolean
}

export default function WatchlistItemRow({
  item,
  onPress,
  onOptionsPress,
  drag,
  isActive,
}: WatchlistItemRowProps) {
  const { content } = useLanguageStore()
  const typeLabel =
    item.mediaType === 'movie'
      ? content.watchlists.contentTypes.movie
      : content.watchlists.contentTypes.series
  const posterUrl = getTMDBImageUrl(item.posterPath, 'w154')

  return (
    <Pressable
      style={[styles.container, isActive && styles.containerActive]}
      onPress={onPress}
      onLongPress={drag}
      delayLongPress={600}
    >
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
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{typeLabel}</Text>
          </View>
        </View>
      </View>

      <Pressable
        style={styles.optionsButton}
        onPress={onOptionsPress}
        hitSlop={4}
      >
        <MoreVertical size={20} color="#b3b3b3" />
      </Pressable>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  poster: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: '#2a2a2a',
  },
  noPoster: {
    backgroundColor: '#282828',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    color: '#fff',
  },
  containerActive: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    transform: [{ scale: 1.03 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  optionsButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
