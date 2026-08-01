import { StyleSheet } from 'react-native'
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme'

/**
 * Style commun à TOUS les bottom sheets — portage exact du drawer PWA
 * (`frontend/src/components/ui/drawer.tsx`), cf. redesignMobile.md § 4.
 *
 * Valeurs PWA de référence :
 *   overlay        bg-black/80
 *   conteneur      rounded-t-2xl (16px), liseré haut 1px border, max-h 85vh
 *   handle         h-1.5 w-11 (6×44) rounded-full, muted-foreground à 40 %
 *   titre          centré, 16px semibold, suivi d'un séparateur 1px
 *   formulaire     space-y-4 entre les groupes (16), space-y-2 dans un groupe (8)
 *   champs         label 14 medium (astérisque rouge si requis)
 *                  input h-10 (40px) rounded-md (6) border-input px-3 py-2 text-sm
 *   chips genres   rounded-full px-3 py-1.5 text-xs font-medium, gap-2 (8)
 *   actions        gap-2 (8), empilées et pleine largeur en mobile
 *   conteneur      px-4, pb = 2.25rem (36) + safe-area
 */

/** Props à étaler sur <BottomSheetModal> pour obtenir le look PWA. */
export const sheetModalProps = {
  // PWA : max-h-[85vh]
  snapPoints: ['85%'] as const,
  enablePanDownToClose: true,
  handleIndicatorStyle: {
    backgroundColor: 'rgba(124, 135, 152, 0.4)', // mutedForeground @ 40 %
    width: 44,
    height: 6,
    borderRadius: 999,
  },
  backgroundStyle: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl, // 16 = rounded-t-2xl
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  keyboardBehavior: 'extend' as const,
  keyboardBlurBehavior: 'restore' as const,
  android_keyboardInputMode: 'adjustResize' as const,
}

/** Opacité du backdrop, alignée sur `bg-black/80` de la PWA. */
export const SHEET_BACKDROP_OPACITY = 0.8

export const sheetStyles = StyleSheet.create({
  container: {
    // PWA : px-4
    paddingHorizontal: spacing.lg,
  },
  /** Titre centré + séparateur (PWA : DrawerHeader). */
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    // PWA : h-10 rounded-md border-input px-3 py-2 text-sm
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.foreground,
    backgroundColor: colors.background,
  },
  textarea: {
    height: undefined,
    minHeight: 88,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  /** Groupe label + champ (PWA : space-y-2). */
  field: {
    gap: spacing.sm,
  },
  /** Écart entre deux groupes de champs (PWA : space-y-4). */
  fieldGap: {
    marginTop: spacing.lg,
  },
  /** Chips de genres : pilules `muted` (PWA). */
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    // PWA : px-3 py-1.5 text-xs
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.muted,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.mutedForeground,
  },
  chipTextActive: {
    color: colors.primaryForeground,
    fontWeight: fontWeight.medium,
  },
  /** Bloc d'actions empilées en bas du sheet. */
  actions: {
    // PWA : gap-2, boutons empilés pleine largeur en mobile
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  /** Texte descriptif (sheets de confirmation). */
  description: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
})
