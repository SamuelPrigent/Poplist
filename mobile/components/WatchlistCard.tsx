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
  layout?: 'grid' | 'list';
}

export default function WatchlistCard({
  watchlist,
  showOwner = false,
  width,
  layout = 'grid',
}: WatchlistCardProps) {
  const router = useRouter();

  if (layout === 'list') {
    const thumbSize = 64;
    return (
      <Pressable
        style={[styles.listContainer, width != null ? { width } : undefined]}
        onPress={() => router.push(`/lists/${watchlist.id}`)}
      >
        {watchlist.imageUrl ? (
          <Image
            source={{ uri: watchlist.imageUrl }}
            style={[styles.listThumb, { width: thumbSize, height: thumbSize }]}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={`card-${watchlist.id}`}
            transition={0}
          />
        ) : (
          <PosterGrid items={watchlist.items} size={thumbSize} />
        )}
        <View style={styles.listInfo}>
          <View style={styles.nameRow}>
            {watchlist.isSaved && !watchlist.isOwner && (
              <CircleCheck size={13} color={colors.background} fill="#22c55e" style={styles.savedIcon} />
            )}
            {watchlist.collaborators && watchlist.collaborators.length > 0 && (
              <UsersRound size={13} color={colors.mutedForeground} style={styles.collabIcon} />
            )}
            <Text style={[styles.listName, { flex: 1 }]} numberOfLines={1}>
              {watchlist.name}
            </Text>
          </View>
          <Text style={styles.listMeta}>
            {watchlist.items?.length ?? 0} {(watchlist.items?.length ?? 0) === 1 ? 'élément' : 'éléments'}
            {showOwner && watchlist.owner?.username ? ` · ${watchlist.owner.username}` : ''}
          </Text>
          {watchlist.description ? (
            <Text style={styles.listDesc} numberOfLines={1}>{watchlist.description}</Text>
          ) : null}
        </View>
      </Pressable>
    );
  }

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
          <Text style={[styles.name, { flex: 1 }]} numberOfLines={1}>
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
  // List layout
  listContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  listThumb: {
    borderRadius: borderRadius.md,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.foreground,
  },
  listMeta: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginTop: 3,
  },
  listDesc: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginTop: 2,
  },
});
