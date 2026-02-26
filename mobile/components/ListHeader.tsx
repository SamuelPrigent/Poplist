import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, LayoutChangeEvent } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, interpolate, Extrapolation, type SharedValue } from 'react-native-reanimated';
import { User, UserPlus, Share2, EllipsisVertical, Copy, LogOut } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useLanguageStore } from '../store/language';
import type { Watchlist } from '../types';
import PosterGrid from './PosterGrid';
import SaveButton from './SaveButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = Math.round(SCREEN_WIDTH * 0.48);
const IMAGE_SIZE_MAX = Math.round(IMAGE_SIZE * 1.22);  // 22% bigger at top (was 30%)
const IMAGE_SIZE_MIN = Math.round(IMAGE_SIZE * 0.73);  // 27% smaller when scrolled

interface ListHeaderProps {
  watchlist: Watchlist;
  isOwner?: boolean;
  isSaved?: boolean;
  isCollaborator?: boolean;
  scrollY?: SharedValue<number>;
  onAddCollaborator?: () => void;
  onShare?: () => void;
  onMenu?: () => void;
  onSave?: () => void;
  onDuplicate?: () => void;
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
  onMenu,
  onSave,
  onDuplicate,
  onLeave,
  onTitleLayout,
}: ListHeaderProps) {
  const router = useRouter();
  const { content } = useLanguageStore();
  const itemCount = watchlist.items.length;

  const animatedImageStyle = useAnimatedStyle(() => {
    if (!scrollY) return { transform: [{ scale: 1 }] };
    const scale = interpolate(
      scrollY.value,
      [0, 300],
      [1, IMAGE_SIZE_MIN / IMAGE_SIZE_MAX],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }] };
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
              style={styles.coverImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={`cover-${watchlist.id}`}
              transition={0}
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
                cachePolicy="memory-disk"
                recyclingKey={`avatar-${watchlist.owner.username}`}
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
              <Share2 size={26} color={colors.foreground} strokeWidth={1.8} />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={onMenu}>
              <EllipsisVertical size={26} color={colors.foreground} strokeWidth={1.8} />
            </Pressable>
          </>
        ) : (
          <>
            <SaveButton isSaved={isSaved} onToggle={onSave ?? (() => {})} />
            <Pressable style={styles.actionBtn} onPress={onDuplicate}>
              <Copy size={26} color={colors.foreground} strokeWidth={1.8} />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={onShare}>
              <Share2 size={26} color={colors.foreground} strokeWidth={1.8} />
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
    width: IMAGE_SIZE_MAX,
    height: IMAGE_SIZE_MAX,
    borderRadius: 6,
    overflow: 'hidden',
  },
  coverImage: {
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
