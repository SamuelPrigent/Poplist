import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Film } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';
import type { Watchlist } from '../types';
import PosterGrid from './PosterGrid';

interface ListCardSmallProps {
  watchlist: Watchlist;
  onPress: () => void;
}

/**
 * Carte compacte de la section « Bibliothèque » en haut de l'accueil.
 * Portage de `frontend/src/components/List/ListCardSmall.tsx` :
 * row · gap 12 · radius 8 · padding 12 · vignette 64 · titre 14 semibold ·
 * « N éléments » 12 muted.
 */
export default function ListCardSmall({ watchlist, onPress }: ListCardSmallProps) {
  const count = watchlist.items?.length ?? 0;
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.thumb}>
        {watchlist.imageUrl ? (
          <Image
            source={{ uri: watchlist.imageUrl }}
            style={styles.thumbImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={`small-${watchlist.id}`}
            transition={0}
          />
        ) : count > 0 ? (
          <PosterGrid items={watchlist.items} size={64} />
        ) : (
          <View style={styles.placeholder}>
            <Film size={28} color={colors.mutedForeground} strokeWidth={1} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {watchlist.name}
        </Text>
        <Text style={styles.count}>
          {count} {count === 1 ? 'élément' : 'éléments'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    // PWA sous 414px : bg-transparent + p-0. On applique ce rendu à TOUTE
    // l'app mobile (demande explicite) : ni carte, ni fond, ni padding.
    backgroundColor: 'transparent',
    padding: 0,
  },
  pressed: {
    opacity: 0.7,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.button,
    overflow: 'hidden',
    backgroundColor: colors.muted,
  },
  thumbImage: {
    width: 64,
    height: 64,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: '#FFFFFF',
  },
  count: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginTop: 2,
  },
});
