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
    </Stack>
    </View>
  )
}
