import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, LayoutChangeEvent } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, interpolate, Extrapolation, type SharedValue } from 'react-native-reanimated';
import { User, UserPlus, Send, Pencil, Copy, Trash2, LogOut } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useLanguageStore } from '../store/language';
import type { Watchlist } from '../types';
import PosterGrid from './PosterGrid';
import SaveButton from './SaveButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = Math.round(SCREEN_WIDTH * 0.48);
const IMAGE_SIZE_MAX = Math.round(IMAGE_SIZE * 1.15);  // 15% bigger at top
const IMAGE_SIZE_MIN = Math.round(IMAGE_SIZE * 0.73);  // 27% smaller when scrolled

interface ListHeaderProps {
  watchlist: Watchlist;
  isOwner?: boolean;
  isSaved?: boolean;
  isCollaborator?: boolean;
  scrollY?: SharedValue<number>;
  onAddCollaborator?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  onSave?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onLeave?: () => void;
  onTitleLayout?: (event: LayoutChangeEvent) => void;
}

export default function ListHeader({
  watchlist,
  isOwner = false,
  isSaved = false,
  isCollaborator = false,
  scrollY,
  onAddCollaborator,
  onShare,
  onEdit,
  onSave,
  onDuplicate,
  onDelete,
  onLeave,
  onTitleLayout,
}: ListHeaderProps) {
  const router = useRouter();
  const { content } = useLanguageStore();
  const itemCount = watchlist.items.length;

  const animatedImageStyle = useAnimatedStyle(() => {
    if (!scrollY) return { width: IMAGE_SIZE, height: IMAGE_SIZE };
    const size = interpolate(
      scrollY.value,
      [0, 300],
      [IMAGE_SIZE_MAX, IMAGE_SIZE_MIN],
      Extrapolation.CLAMP,
    );
    return { width: size, height: size };
  });
  const itemLabel =
    itemCount === 1 ? content.watchlists.item : content.watchlists.items;
  const saveCount = watchlist.followersCount ?? 0;
  const saveLabel = saveCount === 1 ? 'sauvegarde' : 'sauvegardes';

  return (
    <View style={styles.container}>
      {/* Centered cover image / poster grid */}
      <View style={styles.imageRow}>
        <Animated.View style={[styles.animatedImageWrapper, animatedImageStyle]}>
          {watchlist.imageUrl ? (
            <Image
              source={{ uri: watchlist.imageUrl }}
              style={styles.coverImageFill}
              contentFit="cover"
            />
          ) : (
            <PosterGrid items={watchlist.items} size="fill" />
          )}
        </Animated.View>
      </View>

      {/* Title */}
      <Text style={styles.name} onLayout={onTitleLayout}>{watchlist.name}</Text>

      {/* Description */}
      {watchlist.description ? (
        <Text style={styles.description}>{watchlist.description}</Text>
      ) : null}

      {/* Meta row: avatar · nb elements · nb sauvegardes */}
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
              <UserPlus size={26} color={colors.foreground} strokeWidth={1.8} />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={onShare}>
              <Send size={26} color={colors.foreground} strokeWidth={1.8} />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={onEdit}>
              <Pencil size={26} color={colors.foreground} strokeWidth={1.8} />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={onDelete}>
              <Trash2 size={26} color={colors.destructive} strokeWidth={1.8} />
            </Pressable>
          </>
        ) : (
          <>
            <SaveButton isSaved={isSaved} onToggle={onSave ?? (() => {})} />
            <Pressable style={styles.actionBtn} onPress={onDuplicate}>
              <Copy size={26} color={colors.foreground} strokeWidth={1.8} />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={onShare}>
              <Send size={26} color={colors.foreground} strokeWidth={1.8} />
            </Pressable>
            {isCollaborator && (
              <Pressable style={styles.actionBtn} onPress={onLeave}>
                <LogOut size={26} color={colors.destructive} strokeWidth={1.8} />
              </Pressable>
            )}
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
  animatedImageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  coverImageFill: {
    width: '100%',
    height: '100%',
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
