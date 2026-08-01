/**
 * Design tokens de l'app mobile — alignés sur la PWA (`frontend/src/styles.css`).
 *
 * Référence : private/redesignMobile.md § 1.
 * Les valeurs PWA sont en HSL dans le CSS ; converties ici en hex.
 *
 * Le fond suit exactement la PWA : l'ancien écart « un peu moins sombre » a été
 * supprimé, l'app paraissait délavée à côté du web.
 */

export const colors = {
  // PWA: hsl(224 15% 4%)
  background: '#08090C',
  // PWA: hsl(210 25% 96%)
  foreground: '#F1F4F8',
  // PWA: hsl(222 20% 7%)
  card: '#0E1013',
  cardForeground: '#F1F4F8',
  cardHover: '#212327CC',
  // PWA: hsl(210 25% 96%) — boutons pleins « blanc cassé »
  primary: '#F1F4F8',
  // PWA: hsl(224 25% 9%)
  primaryForeground: '#121316',
  // PWA: hsl(218 25% 14%) — secondary / muted / accent partagent la même valeur
  secondary: '#1C1E22',
  secondaryForeground: '#F1F4F8',
  muted: '#1C1E22',
  // PWA: hsl(215 15% 55%) → désaturé
  mutedForeground: '#8A8F98',
  accent: '#1C1E22',
  accentForeground: '#F1F4F8',
  // PWA: hsl(0 62.8% 30.6%)
  destructive: '#7F1D1D',
  destructiveForeground: '#F1F4F8',
  // PWA: hsl(218 25% 16%) → désaturé
  border: '#26282D',
  input: '#26282D',
  ring: '#8A8F98',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
}

/**
 * Rayons. L'échelle existante correspond déjà aux classes PWA :
 *   md(8) = rounded-lg · lg(12) = rounded-xl · xl(16) = rounded-2xl
 * `button` (6) = `rounded-md` PWA, utilisé pour les boutons et les inputs.
 */
export const borderRadius = {
  sm: 4,
  button: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
}

/**
 * Échelle typographique PWA (cf. § 1 du plan) :
 *   nav 11 · méta 12-13 · corps 14-15 · titre section 20 · titre page 28
 */
export const fontSize = {
  nav: 11,
  xs: 12,
  xsPlus: 13,
  sm: 14,
  smPlus: 15,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  pageTitle: 28,
  '3xl': 30,
}

/** Poids utilisés par la PWA (évite les '600'/'bold' magiques dans le code). */
export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const
