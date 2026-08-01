import { View } from 'react-native'
import { Stack } from 'expo-router'

import { useTheme } from '../../../hooks/useTheme'

/**
 * Stack de l'onglet « Mes listes » (`/lists`).
 *
 * Le DÉTAIL d'une liste a été sorti d'ici vers `(tabs)/list/[id]` : tant qu'il
 * vivait sous ce segment, l'onglet « Mes listes » restait allumé alors qu'on
 * était dans une liste, ce que la PWA ne fait pas.
 */
export default function ListsLayout() {
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
