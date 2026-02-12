import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useLanguageStore } from '../store/language';
import type { Watchlist } from '../types';
import PosterGrid from './PosterGrid';

interface WatchlistCardSmallProps {
  watchlist: Watchlist;
  onPress?: () => void;
}

export default function WatchlistCardSmall({
  watchlist,
  onPress,
}: WatchlistCardSmallProps) {
  const router = useRouter();
  const { content } = useLanguageStore();
  const itemCount = watchlist.items.length;
  const itemLabel =
    itemCount === 1 ? content.watchlists.item : content.watchlists.items;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/lists/${watchlist.id}`);
    }
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      {watchlist.imageUrl ? (
        <Image
          source={{ uri: watchlist.imageUrl }}
          style={styles.thumbnail}
          contentFit="cover"
        />
      ) : (
        <PosterGrid items={watchlist.items} size={64} />
      )}
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {watchlist.name}
        </Text>
        <Text style={styles.count}>
          {itemCount} {itemLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    gap: spacing.md,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  count: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginTop: 2,
  },
});
