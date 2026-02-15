import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { User, UserPlus, Send, Pencil, CirclePlus, Copy } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useLanguageStore } from '../store/language';
import type { Watchlist } from '../types';
import PosterGrid from './PosterGrid';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = Math.round(SCREEN_WIDTH * 0.48);

interface ListHeaderProps {
  watchlist: Watchlist;
  isOwner?: boolean;
  isSaved?: boolean;
  isCollaborator?: boolean;
  onAddCollaborator?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  onSave?: () => void;
  onDuplicate?: () => void;
}

export default function ListHeader({
  watchlist,
  isOwner = false,
  isSaved = false,
  isCollaborator = false,
  onAddCollaborator,
  onShare,
  onEdit,
  onSave,
  onDuplicate,
}: ListHeaderProps) {
  const router = useRouter();
  const { content } = useLanguageStore();
  const itemCount = watchlist.items.length;
  const itemLabel =
    itemCount === 1 ? content.watchlists.item : content.watchlists.items;
  const saveCount = watchlist.followersCount ?? 0;
  const saveLabel = saveCount === 1 ? 'sauvegarde' : 'sauvegardes';

  return (
    <View style={styles.container}>
      {/* Centered cover image / poster grid */}
      <View style={styles.imageRow}>
        {watchlist.imageUrl ? (
          <Image
            source={{ uri: watchlist.imageUrl }}
            style={styles.coverImage}
            contentFit="cover"
          />
        ) : (
          <PosterGrid items={watchlist.items} size={IMAGE_SIZE} />
        )}
      </View>

      {/* Title */}
      <Text style={styles.name}>{watchlist.name}</Text>

      {/* Description */}
      {watchlist.description ? (
        <Text style={styles.description}>{watchlist.description}</Text>
      ) : null}

      {/* Meta row: avatar · nb éléments · nb sauvegardes */}
      <View style={styles.metaRow}>
        {watchlist.owner?.username && (
          <Pressable
            style={styles.ownerInline}
            onPress={() => router.push(`/user/${watchlist.owner?.username}`)}
          >
            {watchlist.owner.avatarUrl ? (
              <Image
                source={{ uri: watchlist.owner.avatarUrl }}
                style={styles.ownerAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.ownerAvatarPlaceholder}>
                <User size={14} color={colors.mutedForeground} />
              </View>
            )}
            <Text style={styles.ownerName}>{watchlist.owner.username}</Text>
          </Pressable>
        )}
        <Text style={styles.metaDot}>{'\u00B7'}</Text>
        <Text style={styles.metaText}>
          {itemCount} {itemLabel}
        </Text>
        {saveCount > 0 && (
          <>
            <Text style={styles.metaDot}>{'\u00B7'}</Text>
            <Text style={styles.metaText}>
              {saveCount} {saveLabel}
            </Text>
          </>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        {isOwner ? (
          <>
            <Pressable style={styles.actionBtn} onPress={onAddCollaborator}>
              <UserPlus size={22} color={colors.foreground} strokeWidth={1.5} />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={onShare}>
              <Send size={22} color={colors.foreground} strokeWidth={1.5} />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={onEdit}>
              <Pencil size={22} color={colors.foreground} strokeWidth={1.5} />
            </Pressable>
          </>
        ) : (
          <>
            <Pressable style={styles.actionBtn} onPress={onSave}>
              <CirclePlus
                size={22}
                color={colors.foreground}
                strokeWidth={isSaved ? 2.5 : 1.5}
              />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={onDuplicate}>
              <Copy size={22} color={colors.foreground} strokeWidth={1.5} />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={onShare}>
              <Send size={22} color={colors.foreground} strokeWidth={1.5} />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xl,
  },
  imageRow: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  coverImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: borderRadius.lg,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginTop: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  ownerInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ownerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  ownerAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  metaDot: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
