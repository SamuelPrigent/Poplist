import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import type { Watchlist } from '../types';
import PosterGrid from './PosterGrid';

interface WatchlistCardProps {
  watchlist: Watchlist;
  showOwner?: boolean;
  width?: number;
}

export default function WatchlistCard({
  watchlist,
  showOwner = false,
  width,
}: WatchlistCardProps) {
  const router = useRouter();
  const imageSize = width ?? 160;

  return (
    <Pressable
      style={[styles.container, width != null ? { width } : undefined]}
      onPress={() => router.push(`/lists/${watchlist.id}`)}
    >
      {watchlist.imageUrl ? (
        <Image
          source={{ uri: watchlist.imageUrl }}
          style={[
            styles.coverImage,
            { width: imageSize, height: imageSize },
          ]}
          contentFit="cover"
        />
      ) : (
        <PosterGrid items={watchlist.items} size={imageSize} />
      )}
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={2}>
          {watchlist.name}
        </Text>
        {showOwner && watchlist.owner?.username && (
          <Text style={styles.owner}>
            par {watchlist.owner.username}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {},
  coverImage: {
    borderRadius: borderRadius.lg,
  },
  infoContainer: {
    marginTop: spacing.sm,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  owner: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginTop: 2,
  },
});
