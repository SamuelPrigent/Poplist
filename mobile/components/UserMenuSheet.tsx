import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native'
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { User as UserIcon, Shield, Coffee, LogOut } from 'lucide-react-native'
import { userMenuContent, externalLinks } from '@poplist/shared/content'
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme'
import { useLanguageStore } from '../store/language'
import { useAuth } from '../context/auth-context'
import { sheetModalProps, SHEET_BACKDROP_OPACITY } from './sheets/sheetTheme'

export interface UserMenuSheetRef {
  present: () => void
  dismiss: () => void
}

/**
 * Menu de la bulle d'avatar — portage de `MobileHeader.tsx` (PWA) :
 * Paramètres du profil · Confidentialité · Buy me a coffee · Déconnexion.
 *
 * Les libellés viennent de `@poplist/shared/content` (source unique
 * partagée avec le web, hors du dossier généré par Kubb).
 */
const UserMenuSheet = forwardRef<UserMenuSheetRef>(function UserMenuSheet(_props, ref) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { language } = useLanguageStore()
  const { logout } = useAuth()
  const t = userMenuContent[language as keyof typeof userMenuContent] ?? userMenuContent.fr

  useImperativeHandle(ref, () => ({
    present: () => sheetRef.current?.present(),
    dismiss: () => sheetRef.current?.dismiss(),
  }))

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={SHEET_BACKDROP_OPACITY}
        pressBehavior="close"
      />
    ),
    [],
  )

  const go = useCallback((action: () => void) => {
    sheetRef.current?.dismiss()
    // Laisse l'animation de fermeture se jouer avant la navigation.
    setTimeout(action, 180)
  }, [])

  return (
    <BottomSheetModal
      ref={sheetRef}
      {...sheetModalProps}
      snapPoints={undefined}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: colors.background,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
      }}
    >
      <BottomSheetView
        style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
      >
        <Pressable style={styles.item} onPress={() => go(() => router.push('/account'))}>
          <UserIcon size={16} color={colors.foreground} />
          <Text style={styles.label}>{t.profileSettings}</Text>
        </Pressable>

        <Pressable style={styles.item} onPress={() => go(() => router.push('/privacy'))}>
          <Shield size={16} color={colors.foreground} />
          <Text style={styles.label}>{t.privacy}</Text>
        </Pressable>

        <Pressable
          style={styles.item}
          onPress={() => go(() => Linking.openURL(externalLinks.buyMeACoffee))}
        >
          <Coffee size={16} color={colors.foreground} />
          <Text style={styles.label}>{t.buyMeACoffee}</Text>
        </Pressable>

        <View style={styles.separator} />

        <Pressable style={styles.item} onPress={() => go(() => void logout())}>
          <LogOut size={16} color="#f87171" />
          <Text style={[styles.label, styles.labelDanger]}>{t.logout}</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  )
})

export default UserMenuSheet

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  item: {
    // PWA : gap-2.5 rounded-md px-3 py-2 text-sm
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: borderRadius.button,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
  },
  labelDanger: {
    color: '#f87171',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
    marginHorizontal: spacing.md,
  },
})
