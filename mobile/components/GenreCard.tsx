import React from 'react';
import { View, Text, Pressable, StyleSheet, ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';

interface GenreCardProps {
  categoryId: string;
  name: string;
  onPress: () => void;
  /** Nombre de listes du genre. `undefined` = pas encore chargé → badge masqué. */
  listCount?: number;
}

/**
 * Card de catégorie — portage de la PWA
 * (`frontend/src/components/List/ListCardGenre.tsx`), cf. redesignMobile.md § 3.1 :
 * dégradé vif par genre, image découpée centrée en bas, badge « N listes » en
 * haut à droite, titre en bas à gauche. Ratio 21/20.
 */

/** Dégradés PWA (vivid → deep) + cutout, par catégorie. */
const CATEGORY_VISUALS: Record<
  string,
  { vivid: string; deep: string; cutout: ImageSourcePropType | null }
> = {
  movies: { vivid: '#005ef4', deep: '#24a7cf', cutout: require('../assets/categories/avatar.png') },
  series: { vivid: '#ffb700', deep: '#e5e22a', cutout: require('../assets/categories/friends.png') },
  animation: {
    vivid: '#ff0c49',
    deep: '#e02076',
    cutout: require('../assets/categories/spider.png'),
  },
  enfant: { vivid: '#0b6dff', deep: '#0e8dc8', cutout: require('../assets/categories/yeti.png') },
  jeunesse: { vivid: '#00d0ff', deep: '#33a261', cutout: require('../assets/categories/brian.png') },
  documentaries: {
    vivid: '#0055FF',
    deep: '#076498',
    cutout: require('../assets/categories/perroquet.png'),
  },
  // `anime` et `action` ont désormais leurs propres visuels (assets convertis
  // depuis `frontend/public/categories/`), à l'identique de la PWA.
  anime: { vivid: '#451ee5', deep: '#ba5df0', cutout: require('../assets/categories/solo.png') },
  action: { vivid: '#00ba28', deep: '#32e058', cutout: require('../assets/categories/action.png') },
};

const DEFAULT_VISUALS = CATEGORY_VISUALS.movies;

export default function GenreCard({ categoryId, name, onPress, listCount }: GenreCardProps) {
  const visuals = CATEGORY_VISUALS[categoryId] || DEFAULT_VISUALS;

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <LinearGradient
        colors={[visuals.vivid, visuals.deep]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.card}
      >
        {/* Voile sombre haut (lisibilité du badge) */}
        <LinearGradient
          colors={['rgba(0,0,0,0.18)', 'transparent']}
          style={styles.topScrim}
          pointerEvents="none"
        />

        {/* Cutout centré en bas, 85 % de la hauteur (comme la PWA) */}
        {visuals.cutout && (
          <View style={styles.cutoutWrap} pointerEvents="none">
            <Image
              source={visuals.cutout}
              style={styles.cutout}
              // PWA : objectFit contain + objectPosition center bottom.
              // (`cover` rognait les côtés du personnage.)
              contentFit="contain"
              contentPosition="bottom center"
              transition={0}
            />
          </View>
        )}

        {/* Voile sombre bas (lisibilité du titre) */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.32)']}
          style={styles.bottomScrim}
          pointerEvents="none"
        />

        {/* Badge « N listes » — masqué tant que la donnée n'est pas chargée */}
        {listCount !== undefined && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {listCount} {listCount === 1 ? 'liste' : 'listes'}
            </Text>
          </View>
        )}

        {/* Titre en bas à gauche */}
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  card: {
    flex: 1,
    // PWA : aspect-[21/20]
    aspectRatio: 21 / 20,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  bottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  cutoutWrap: {
    position: 'absolute',
    // PWA : conteneur à 85 % de la hauteur, aligné en bas. (Le passage à
    // pleine hauteur + débord latéral rendait les personnages trop gros.)
    left: 0,
    right: 0,
    bottom: 0,
    height: '88%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cutout: {
    height: '100%',
    width: '100%',
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.30)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: 'rgba(255,255,255,0.95)',
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
});
