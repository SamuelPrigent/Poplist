import { Tabs } from 'expo-router'
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs'
import { Home, Bookmark, Search, LayoutGrid } from 'lucide-react-native'
import { View, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../context/auth-context'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { colors, fontSize, spacing } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'

/**
 * Bottom nav — portage de la PWA
 * (`frontend/src/components/layout/MobileBottomNav.tsx`) : Accueil ·
 * Catégories · Explorer · Mes listes.
 *
 * Le Compte n'est PAS un onglet (comme sur le web) : on y accède par la bulle
 * d'avatar à gauche du titre de chaque page. L'écran reste routable via
 * `href: null`, qui le masque de la barre sans supprimer la route.
 */

function TabIcon({ Icon, color, focused }: { Icon: typeof Home; color: string; focused: boolean }) {
  return (
    <View style={styles.iconWrap}>
      {/* Barre blanche de l'onglet actif, remontée jusqu'au bord haut de la
          barre (le bouton porte un paddingTop de 8). */}
      {focused && <View style={styles.activeIndicator} />}
      <Icon size={20} color={color} strokeWidth={focused ? 2.2 : 1.8} />
    </View>
  )
}

/** Bouton d'onglet : mise en page uniquement (l'état actif est géré par l'icône). */
function TabBarButton({ children, onPress, accessibilityState }: BottomTabBarButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.tabButton}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
    >
      {children}
    </Pressable>
  )
}

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const theme = useTheme()
  // Safe-area basse : sans ça la barre passe SOUS la barre gestuelle Android
  // (libellés coupés). Équivalent du pb-[env(safe-area-inset-bottom)] de la PWA.
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, router])

  return (
    <Tabs
      // `firstRoute` (défaut) renvoyait sur Accueil en quittant un écran de
      // détail, quel que soit l'onglet d'origine. `history` revient à l'onglet
      // réellement visité juste avant.
      backBehavior="history"
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          // PWA : barre OPAQUE avec un liseré haut de 1px (avant : rgba semi-transparent).
          backgroundColor: theme.background,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          paddingTop: 0,
          // +3px pour ne pas coller aux boutons natifs Android.
          paddingBottom: Math.max(insets.bottom, spacing.sm) + 3,
          // PWA : barre compacte. 56 dp donnait une barre nettement plus haute
          // que le web sur un écran à navigation gestuelle.
          height: 48 + insets.bottom,
        },
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: colors.foreground,
        headerShown: false,
        // « Voir tout » de Catégories / Bibliothèque bascule d'ONGLET (et non
        // dans un stack) : les tabs n'acceptent que none|fade|shift, `shift`
        // est le plus proche du slide des écrans empilés.
        animation: 'shift',
        // Sans fond explicite, la transition d'onglet laisse voir un flash
        // blanc (fond par défaut de la scène).
        sceneStyle: { backgroundColor: theme.background },
        tabBarButton: props => <TabBarButton {...props} />,
        tabBarLabelStyle: {
          fontSize: fontSize.nav,
          fontWeight: '400',
          marginTop: 5,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Home} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Catégories',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={LayoutGrid} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Search} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: 'Mes listes',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Bookmark} color={color} focused={focused} />
          ),
        }}
      />
      {/* Tous les écrans de détail (liste, catégorie, profil, palmarès,
          créateurs) vivent dans une stack unique : aucun onglet ne s'allume
          quand on y est, et l'historique reste linéaire d'un écran à l'autre. */}
      <Tabs.Screen name="(detail)" options={{ href: null }} />
      {/* Compte : routable mais absent de la barre (accès par la bulle avatar) */}
      <Tabs.Screen name="account" options={{ href: null }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.sm,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
  },
  activeIndicator: {
    position: 'absolute',
    // PWA : `top-[1px]` + `-translate-y-1/2` → la barre est À CHEVAL sur le
    // bord haut de la nav, moitié rognée. `-spacing.sm` la posait entièrement
    // SOUS le liseré. On remonte donc d'une demi-hauteur (4 / 2 = 2) de plus.
    // Aucun `overflow: hidden` sur le chemin, sinon elle disparaît.
    top: -(spacing.sm + 2),
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
})
