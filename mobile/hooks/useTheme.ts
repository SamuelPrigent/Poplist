import { colors } from '../constants/theme'

export interface ThemeColors {
  background: string
  panel: string
  container: string
  fab: string
  secondary: string
  border: string
  muted: string
  mutedForeground: string
  card: string
  cardHover: string
  accent: string
  input: string
  ring: string
}

/**
 * Aligné sur `constants/theme.ts` : une SEULE source de vérité pour les
 * couleurs. Avant, ce thème gardait une palette « Spotify » (#121212/#333333)
 * pendant que les nouveaux composants utilisaient les tokens → fonds d'inputs
 * et bordures qui juraient dans les drawers (cf. updateVisual.md).
 */
const MIDNIGHT: ThemeColors = {
  background: colors.background,
  panel: colors.card,
  container: colors.card,
  fab: colors.muted,
  secondary: colors.secondary,
  border: colors.border,
  muted: colors.muted,
  mutedForeground: colors.mutedForeground,
  card: colors.card,
  cardHover: colors.cardHover,
  accent: colors.accent,
  input: colors.card,
  ring: colors.ring,
}

export function useTheme(): ThemeColors {
  return MIDNIGHT
}
