import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Star } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';

interface TrendingCardProps {
  title: string;
  /** Image de FOND : backdrop TMDB (pas l'affiche portrait). */
  backdropUrl: string | null;
  typeLabel: string;
  /** Note TMDB sur 10 (affichée telle quelle, comme la PWA). */
  voteAverage?: number;
  /** Durée (film) ou « N saisons, N ep » (série). */
  meta?: string | null;
  onPress: () => void;
  /** Ouvre le sélecteur de liste. Absent → pas de bouton +. */
  onAddPress?: () => void;
}

/**
 * Carte « Tendances » pleine largeur — portage de
 * `frontend/src/components/Home/TrendingCardMobile.tsx` :
 * backdrop en fond (ratio 2/1, radius 16), dégradé bas sur 2/3, note en haut à
 * gauche, bouton + en haut à droite, titre + badge type + méta en bas.
 */
export default function TrendingCard({
  title,
  backdropUrl,
  typeLabel,
  voteAverage,
  meta,
  onPress,
  onAddPress,
}: TrendingCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {backdropUrl ? (
        <Image
          source={{ uri: backdropUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
        />
      ) : null}

      {/* Dégradé bas sur 2/3 de la hauteur (lisibilité du texte) */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
        style={styles.scrim}
        pointerEvents="none"
      />

      {/* Note — haut gauche */}
      {voteAverage && voteAverage > 0 ? (
        <View style={styles.rating}>
          <Star size={14} color="#facc15" fill="#facc15" />
          <Text style={styles.ratingText}>{voteAverage.toFixed(1)}</Text>
        </View>
      ) : null}

      {/* Bouton + — haut droite */}
      {onAddPress && (
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
          onPress={onAddPress}
          hitSlop={6}
        >
          <Plus size={20} color="#FFFFFF" />
        </Pressable>
      )}

      {/* Titre + méta — bas */}
      <View style={styles.bottom}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{typeLabel}</Text>
          </View>
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    // PWA : aspect-[2/1] rounded-2xl
    aspectRatio: 2,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.muted,
    justifyContent: 'flex-end',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '66%',
  },
  rating: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  ratingText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: '#FFFFFF',
  },
  addButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  addButtonPressed: {
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  bottom: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 14,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 6,
  },
  typeBadge: {
    borderRadius: borderRadius.button,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: '#FFFFFF',
  },
  meta: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
  },
});
