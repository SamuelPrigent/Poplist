import React, { forwardRef, useCallback, useImperativeHandle, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Linking,
  Dimensions,
  useWindowDimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import { User as UserIcon, Shield, Coffee, LogOut } from 'lucide-react-native'
import { userMenuContent, externalLinks } from '@poplist/shared/content'
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme'
import { useLanguageStore } from '../store/language'
import { useAuth } from '../context/auth-context'

/** Position à l'écran du déclencheur (la bulle d'avatar). */
export interface MenuAnchor {
  x: number
  y: number
  width: number
  height: number
}

export interface UserMenuPopoverRef {
  /** Ouvre le menu ancré sous la bulle (mesurer avec `measureInWindow`). */
  present: (anchor: MenuAnchor) => void
  dismiss: () => void
}

/** Largeur du panneau — PWA : `w-52` = 208px. */
const MENU_WIDTH = 208
/** PWA : `sideOffset={8}`. */
const SIDE_OFFSET = 8

/**
 * Menu de la bulle d'avatar — portage de `MobileHeader.tsx` (PWA).
 *
 * C'est un **popover ancré au déclencheur**, comme sur le web (et non un
 * drawer bas) : panneau 208px, coins 6, bordure, ombre, ouvert juste sous la
 * bulle. Les libellés viennent de `@poplist/shared/content`.
 */
const UserMenuPopover = forwardRef<UserMenuPopoverRef>(function UserMenuPopover(_props, ref) {
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null)
  const router = useRouter()
  const { width: screenWidth } = useWindowDimensions()
  const { language } = useLanguageStore()
  const { logout } = useAuth()
  const t = userMenuContent[language as keyof typeof userMenuContent] ?? userMenuContent.fr

  useImperativeHandle(ref, () => ({
    present: (a: MenuAnchor) => setAnchor(a),
    dismiss: () => setAnchor(null),
  }))

  const go = useCallback((action: () => void) => {
    setAnchor(null)
    // Laisse la fermeture se peindre avant de naviguer.
    requestAnimationFrame(action)
  }, [])

  if (!anchor) return null

  // Ancrage : aligné à gauche de la bulle, replié si le panneau déborde.
  const left = Math.min(Math.max(anchor.x, spacing.sm), screenWidth - MENU_WIDTH - spacing.sm)
  const top = anchor.y + anchor.height + SIDE_OFFSET

  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => setAnchor(null)}>
      {/* Zone de fermeture : tout clic hors du panneau referme le menu. */}
      <Pressable style={styles.backdrop} onPress={() => setAnchor(null)}>
        <View style={[styles.panel, { top, left }]}>
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
        </View>
      </Pressable>
    </Modal>
  )
})

export default UserMenuPopover

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    // Pas de voile sombre : un popover web n'assombrit pas la page.
    backgroundColor: 'transparent',
  },
  panel: {
    position: 'absolute',
    width: MENU_WIDTH,
    // PWA : rounded-md border bg-popover p-1.5 shadow-md
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  item: {
    // PWA : gap-2.5 rounded-md px-3 py-2 text-sm
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.button,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  labelDanger: {
    color: '#f87171',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
    marginHorizontal: spacing.sm,
  },
})
