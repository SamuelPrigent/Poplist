import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight } from '../constants/theme';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

/**
 * En-tête de section — portage de la PWA (cf. redesignMobile.md § 3.1) :
 * titre 20 semibold à gauche, action « Voir tout » discrète à droite.
 * La PWA masque la description en mobile → on n'en affiche pas ici.
 */
export default function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text style={styles.seeAll}>Voir tout</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    // Resserré : 19px laissait trop d'air entre le titre et le contenu.
    marginBottom: spacing.lg,
  },
  title: {
    flexShrink: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: '#FFFFFF',
  },
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
});
