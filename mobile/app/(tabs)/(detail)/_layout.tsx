import { View } from 'react-native'
import { Stack } from 'expo-router'
import { colors } from '../../../constants/theme'
import { useTheme } from '../../../hooks/useTheme'

/**
 * Stack UNIQUE de tous les écrans de détail (liste, catégorie, profil,
 * palmarès, créateurs).
 *
 * Avant, chaque onglet avait sa propre stack et les détails étaient répartis
 * entre elles (`home/user/…`, `categories/[id]`, `list/[id]`). L'historique
 * était donc cloisonné par onglet : ouvrir une liste depuis une catégorie
 * quittait la stack `categories` et le retour retombait sur l'onglet initial
 * (Accueil) au lieu de la catégorie d'origine.
 *
 * Tout est désormais empilé ici, à plat : catégorie → liste → profil → liste
 * revient exactement sur ses pas. Le groupe est entre parenthèses, donc absent
 * des URLs (`/list/<id>`, `/user/<username>`…), et masqué de la barre
 * (`href: null`) pour qu'aucun onglet ne s'allume sur un écran de détail.
 *
 * Le retour au-delà du premier détail est géré par `backBehavior="history"`
 * sur le navigateur d'onglets : il ramène à l'onglet d'où l'on vient.
 */
export default function DetailLayout() {
  const theme = useTheme()

  const headerBase = {
    headerShown: true,
    headerBackTitle: 'Retour',
    headerStyle: { backgroundColor: theme.background },
    headerTintColor: colors.foreground,
  } as const

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right',
          animationDuration: 120,
        }}
      >
        {/* Titre posé par l'écran lui-même (nom de la liste), header transparent
            pour laisser passer l'image de couverture. */}
        <Stack.Screen
          name="list/[id]"
          options={{
            ...headerBase,
            headerTitle: '',
            headerTransparent: true,
            headerStyle: { backgroundColor: 'transparent' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen name="categories/[id]" options={{ ...headerBase, headerTitle: '' }} />
        <Stack.Screen
          name="user/[username]"
          options={{
            ...headerBase,
            headerTitle: '',
            headerTransparent: true,
            headerStyle: { backgroundColor: 'transparent' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen name="popular/index" options={{ ...headerBase, headerTitle: 'Listes communautaires' }} />
        <Stack.Screen name="users/index" options={{ ...headerBase, headerTitle: 'Créateurs' }} />
      </Stack>
    </View>
  )
}
