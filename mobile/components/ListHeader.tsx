import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, LayoutChangeEvent } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { User, UserPlus, Users, Share2, EllipsisVertical, Copy, LogOut } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useLanguageStore } from '../store/language';
import type { Watchlist, Collaborator } from '../types';
import PosterGrid from './PosterGrid';
import SaveButton from './SaveButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = Math.round(SCREEN_WIDTH * 0.48);
const IMAGE_SIZE_MAX = Math.round(IMAGE_SIZE * 1.22); // 22% bigger at top (was 30%)
const IMAGE_SIZE_MIN = Math.round(IMAGE_SIZE * 0.73); // 27% smaller when scrolled

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
  const itemCount = watchlist.items?.length ?? 0;

  const animatedImageStyle = useAnimatedStyle(() => {
    if (!scrollY) return { transform: [{ scale: 1 }] };
    const scale = interpolate(
      scrollY.value,
      [0, 300],
      [1, IMAGE_SIZE_MIN / IMAGE_SIZE_MAX],
      Extrapolation.CLAMP
    );
    return { transform: [{ scale }] };
  });
  const itemLabel = itemCount === 1 ? content.watchlists.item : content.watchlists.items;
  const saveCount = watchlist.followersCount ?? 0;
  const saveLabel = saveCount === 1 ? 'sauvegarde' : 'sauvegardes';

  // Use dominant color as-is, but darken if too bright
  const raw = watchlist.dominantColor;
  let tinted = '#1a1a2e';
  if (raw) {
    const r = parseInt(raw.slice(1, 3), 16);
    const g = parseInt(raw.slice(3, 5), 16);
    const b = parseInt(raw.slice(5, 7), 16);
    // Perceived luminance
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const MAX_LUM = 0.18;
    if (lum > MAX_LUM) {
      // Scale down RGB proportionally to hit target brightness
      const scale = MAX_LUM / lum;
      tinted = `#${Math.round(r * scale)
        .toString(16)
        .padStart(2, '0')}${Math.round(g * scale)
        .toString(16)
        .padStart(2, '0')}${Math.round(b * scale)
        .toString(16)
        .padStart(2, '0')}`;
    } else {
      tinted = raw;
    }
  }

  return (
    <View style={styles.container}>
      {/* Gradient glow behind cover — solid tinted color, smooth fade to background */}
      <LinearGradient
        colors={[tinted, tinted, colors.background]}
        locations={[0, 0.6, 0.85]}
        style={styles.gradientGlow}
      />

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
            <PosterGrid items={watchlist.items ?? []} size="fill" />
          )}
        </Animated.View>
      </View>

      {/* Title */}
      <Text style={styles.name} onLayout={onTitleLayout}>
        {watchlist.name}
      </Text>

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
        {/* Collaborator avatars – overlapping bubbles */}
        {(watchlist.collaborators?.length ?? 0) > 0 && (
          <>
            <Text style={styles.metaComma}>,</Text>
            <View style={styles.collaboratorBubbles}>
              {watchlist
                .collaborators!.slice(0, 3)
                .map((collaborator: Collaborator, index: number) => (
                  <View
                    key={collaborator.id}
                    style={[styles.collaboratorRing, index > 0 && { marginLeft: -8 }]}
                  >
                    {collaborator.avatarUrl ? (
                      <Image
                        source={{ uri: collaborator.avatarUrl }}
                        style={styles.collaboratorAvatar}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        recyclingKey={`collab-${collaborator.id}`}
                      />
                    ) : (
                      <View style={styles.collaboratorPlaceholder}>
                        <User size={12} color={colors.mutedForeground} />
                      </View>
                    )}
                  </View>
                ))}
              {watchlist.collaborators!.length > 3 && (
                <View style={[styles.collaboratorRing, { marginLeft: -8 }]}>
                  <View style={styles.collaboratorPlaceholder}>
                    <Text style={styles.collaboratorOverflow}>
                      +{watchlist.collaborators!.length - 3}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </>
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
              {(watchlist.collaborators?.length ?? 0) > 0 ? (
                <Users size={26} color={colors.foreground} strokeWidth={1.8} />
              ) : (
                <UserPlus size={26} color={colors.foreground} strokeWidth={1.8} />
              )}
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

const GRADIENT_HEIGHT = IMAGE_SIZE_MAX + 200;

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xl,
  },
  gradientGlow: {
    position: 'absolute',
    top: -200,
    left: -spacing.lg,
    right: -spacing.lg,
    height: GRADIENT_HEIGHT,
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
    flexShrink: 0,
  },
  ownerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    flexShrink: 0,
  },
  ownerAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
  metaComma: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  collaboratorBubbles: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    minHeight: 24,
  },
  collaboratorRing: {
    width: 24,
    minWidth: 24,
    height: 24,
    minHeight: 24,
    borderRadius: 12,
    overflow: 'hidden',
    flexShrink: 0,
  },
  collaboratorAvatar: {
    width: 24,
    minWidth: 24,
    height: 24,
    minHeight: 24,
    borderRadius: 12,
  },
  collaboratorPlaceholder: {
    width: 24,
    minWidth: 24,
    height: 24,
    minHeight: 24,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collaboratorOverflow: {
    fontSize: 10,
    fontWeight: '600',
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
