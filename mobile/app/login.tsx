import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { useAuth } from '../context/auth-context'
import { API_BASE_URL } from '../constants/api'
import { colors, fontSize, spacing, borderRadius } from '../constants/theme'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLanguageStore } from '../store/language'

export default function LoginScreen() {
  const { isAuthenticated, isLoading, loginWithTokens } = useAuth()
  const { content } = useLanguageStore()
  const router = useRouter()
  const [isSigningIn, setIsSigningIn] = useState(false)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)')
    }
  }, [isAuthenticated, isLoading, router])

  const handleGoogleLogin = async () => {
    setIsSigningIn(true)
    try {
      // Build the return URL (works in both Expo Go and standalone builds)
      const returnUrl = Linking.createURL('auth')
      // Open browser to backend's Google auth with mobile flag + returnUrl
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_BASE_URL}/auth/google?mobile=true&returnUrl=${encodeURIComponent(returnUrl)}`,
        returnUrl,
      )

      if (result.type === 'success' && result.url) {
        // Parse tokens from the redirect URL
        const url = Linking.parse(result.url)
        const accessToken = url.queryParams?.accessToken as string
        const refreshToken = url.queryParams?.refreshToken as string

        if (accessToken && refreshToken) {
          await loginWithTokens(accessToken, refreshToken)
          router.replace('/(tabs)')
        }
      }
    } catch (error) {
      console.error('Google login failed:', error)
    } finally {
      setIsSigningIn(false)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo / Title */}
        <View style={styles.brandSection}>
          <Text style={styles.title}>{content.header.appName}</Text>
          <Text style={styles.subtitle}>
            {content.landing.hero.title}
          </Text>
        </View>

        {/* Google sign-in button */}
        <View style={styles.buttonSection}>
          <Pressable
            style={[styles.googleButton, isSigningIn && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={isSigningIn}
          >
            {isSigningIn ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Text style={styles.googleButtonText}>
                {content.auth.continueWithGoogle}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonSection: {
    width: '100%',
  },
  googleButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['3xl'],
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  googleButtonText: {
    color: colors.primaryForeground,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
})
