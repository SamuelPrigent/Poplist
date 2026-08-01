import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors, borderRadius, fontSize, fontWeight, spacing } from '../constants/theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  /** Icône rendue à gauche du label (ex. <Plus size={18} />). */
  icon?: React.ReactNode;
  /** `outline` = bouton secondaire (bordure, fond transparent) — ex. « Annuler ». */
  variant?: 'solid' | 'outline';
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Bouton d'action pleine largeur — remplace TOUS les boutons flottants de
 * l'app (cf. redesignMobile.md § 2.6). Reprend le style PWA : fond blanc cassé,
 * texte sombre, hauteur ~52px, coins `rounded-lg`.
 */
export default function PrimaryButton({
  label,
  onPress,
  icon,
  variant = 'solid',
  disabled = false,
  loading = false,
}: PrimaryButtonProps) {
  const isOutline = variant === 'outline';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isOutline ? styles.outline : styles.solid,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.foreground : colors.primaryForeground} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, isOutline && styles.labelOutline]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    // PWA : Button size=default → h-9 (36px), rounded-2xl (16)
    height: 36,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  solid: {
    backgroundColor: colors.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primaryForeground,
  },
  labelOutline: {
    color: colors.foreground,
  },
});
