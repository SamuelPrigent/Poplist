import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { getTMDBImageUrl } from '../lib/utils';
import { useLanguageStore } from '../store/language';
import type { WatchlistItem } from '../types';

interface WatchlistItemRowProps {
  item: WatchlistItem;
  index: number;
  onPress: () => void;
}

export default function WatchlistItemRow({ item, index, onPress }: WatchlistItemRowProps) {
  const { content } = useLanguageStore();
  const typeLabel =
    item.mediaType === 'movie'
      ? content.watchlists.contentTypes.movie
      : content.watchlists.contentTypes.series;
  const posterUrl = getTMDBImageUrl(item.posterPath, 'w92');

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <Text style={styles.index}>{index + 1}</Text>
      {posterUrl ? (
        <Image
          source={{ uri: posterUrl }}
          style={styles.poster}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.poster, styles.noPoster]} />
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.type}>{typeLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  index: {
    width: 28,
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  poster: {
    width: 40,
    height: 60,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.muted,
  },
  noPoster: {
    backgroundColor: colors.secondary,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.foreground,
  },
  type: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginTop: 2,
  },
});
