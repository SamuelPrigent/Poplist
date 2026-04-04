import { View } from 'react-native'
import { Stack } from 'expo-router'
import { colors } from '../../../constants/theme'
import { useTheme } from '../../../hooks/useTheme'

export default function HomeLayout() {
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
      <Stack.Screen
        name="categories/index"
        options={{
          headerShown: true,
          headerTitle: 'Catégories',
          headerBackTitle: 'Retour',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: colors.foreground,
        }}
      />
      <Stack.Screen
        name="categories/[id]"
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackTitle: 'Retour',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: colors.foreground,
        }}
      />
      <Stack.Screen
        name="users/index"
        options={{
          headerShown: true,
          headerTitle: 'Créateurs',
          headerBackTitle: 'Retour',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: colors.foreground,
        }}
      />
      <Stack.Screen
        name="user/[username]"
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackTitle: 'Retour',
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent' },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="popular/index"
        options={{
          headerShown: true,
          headerTitle: 'Listes communautaires',
          headerBackTitle: 'Retour',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: colors.foreground,
        }}
      />
    </Stack>
    </View>
  )
}
