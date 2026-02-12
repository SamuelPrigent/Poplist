import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AuthProvider } from '../context/auth-context';
import { colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.foreground,
              animation: 'fade',
            }}
          >
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="lists/[id]"
              options={{
                headerShown: true,
                headerTitle: '',
                headerBackTitle: 'Retour',
                headerTransparent: true,
                headerStyle: { backgroundColor: 'transparent' },
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="categories/index"
              options={{
                headerShown: true,
                headerTitle: 'Catégories',
                headerBackTitle: 'Retour',
              }}
            />
            <Stack.Screen
              name="categories/[id]"
              options={{
                headerShown: true,
                headerTitle: '',
                headerBackTitle: 'Retour',
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
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="users/index"
              options={{
                headerShown: true,
                headerTitle: 'Créateurs',
                headerBackTitle: 'Retour',
              }}
            />
            <Stack.Screen
              name="popular/index"
              options={{
                headerShown: true,
                headerTitle: 'Listes communautaires',
                headerBackTitle: 'Retour',
              }}
            />
          </Stack>
          <Toast />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
