import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { UsersRound, CircleCheck } from 'lucide-react-native';
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
          cachePolicy="memory-disk"
          recyclingKey={`card-${watchlist.id}`}
          transition={0}
        />
      ) : (
        <PosterGrid items={watchlist.items} size={imageSize} />
      )}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          {watchlist.isSaved && !watchlist.isOwner && (
            <CircleCheck size={13} color={colors.background} fill="#22c55e" style={styles.savedIcon} />
          )}
          {watchlist.collaborators && watchlist.collaborators.length > 0 && (
            <UsersRound size={13} color={colors.mutedForeground} style={styles.collabIcon} />
          )}
          <Text style={[styles.name, { flex: 1 }]} numberOfLines={2}>
            {watchlist.name}
          </Text>
        </View>
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedIcon: {
    marginRight: 4,
  },
  collabIcon: {
    marginRight: 4,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.foreground,
  },
  owner: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginTop: 2,
  },
});
