import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, LogBox } from 'react-native';

// Suppress known expo-image Glide error on Android (native bug in rerenderIfNeeded)
LogBox.ignoreLogs(["You can't start or clear loads in RequestListener"]);
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import Toast, { ToastConfig } from 'react-native-toast-message';
import { Check, X, Info } from 'lucide-react-native';
import { AuthProvider } from '../context/auth-context';
import { colors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

const iconConfig = {
  success: { bg: '#1DB954', Icon: Check },
  error: { bg: '#ef4444', Icon: X },
  info: { bg: '#3b82f6', Icon: Info },
} as const;

const CustomToast = ({ text1, type }: { text1?: string; type: 'success' | 'error' | 'info' }) => {
  const { bg, Icon } = iconConfig[type];
  return (
    <View style={styles.toastContainer}>
      <View style={[styles.iconCircle, { backgroundColor: bg }]}>
        <Icon size={14} color="#121212" />
      </View>
      <Text style={styles.toastText}>{text1}</Text>
    </View>
  );
};

const toastConfig: ToastConfig = {
  success: ({ text1 }) => <CustomToast text1={text1} type="success" />,
  error: ({ text1 }) => <CustomToast text1={text1} type="error" />,
  info: ({ text1 }) => <CustomToast text1={text1} type="info" />,
};

const styles = StyleSheet.create({
  toastContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    color: '#ffffff',
    fontSize: 14,
  },
});

export default function RootLayout() {
  const theme = useTheme()

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaProvider>
        <AuthProvider>
          <BottomSheetModalProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.background },
                headerStyle: { backgroundColor: theme.background },
                headerTintColor: colors.foreground,
                animation: 'fade',
                animationDuration: 120,
              }}
            >
              <Stack.Screen name="login" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="lists/[id]"
                options={{
                  animation: 'slide_from_right',
                  animationDuration: 120,
                  headerShown: true,
                  headerTitle: '',
                  headerBackTitle: 'Retour',
                  headerTransparent: true,
                  headerStyle: { backgroundColor: 'transparent' },
                  headerShadowVisible: false,
                }}
              />
            </Stack>
            <Toast config={toastConfig} position="top" topOffset={60} />
          </BottomSheetModalProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
