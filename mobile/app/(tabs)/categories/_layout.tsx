import { View } from 'react-native'
import { Stack } from 'expo-router'
import { colors } from '../../../constants/theme'
import { useTheme } from '../../../hooks/useTheme'

/**
 * Stack de l'onglet « Catégories ».
 *
 * Le détail d'une catégorie a été déplacé dans `(tabs)/(detail)` : tant qu'il
 * vivait ici, l'historique était cloisonné à cet onglet.
 */
export default function CategoriesLayout() {
  const theme = useTheme()

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
        <Stack.Screen name="index" />
      </Stack>
    </View>
  )
}
