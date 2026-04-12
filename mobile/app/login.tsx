import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Image } from 'expo-image'
import { Eye, EyeOff } from 'lucide-react-native'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { useAuth } from '../context/auth-context'
import { API_BASE_URL } from '../constants/api'
import { colors, fontSize, spacing, borderRadius } from '../constants/theme'
import { useTheme } from '../hooks/useTheme'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLanguageStore } from '../store/language'

export default function LoginScreen() {
  const theme = useTheme()
  const { isAuthenticated, isLoading, login, signup, loginWithTokens } = useAuth()
  const { content } = useLanguageStore()
  const router = useRouter()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/home')
    }
  }, [isAuthenticated, isLoading, router])

  const handleSubmit = async () => {
    setError('')

    if (!email.trim() || !password) {
      setError(mode === 'login' ? 'Veuillez remplir tous les champs.' : 'Veuillez remplir tous les champs.')
      return
    }

    if (mode === 'signup' && password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email.trim(), password)
      } else {
        await signup(email.trim(), password)
      }
      router.replace('/home')
    } catch (err: any) {
      const message = err?.message || ''
      if (message.includes('already exists') || message.includes('409')) {
        setError('Un compte existe déjà avec cet email.')
      } else if (message.includes('Invalid credentials') || message.includes('401')) {
        setError('Email ou mot de passe incorrect.')
      } else if (message.includes('Validation failed')) {
        setError('Vérifiez votre email et mot de passe.')
      } else {
        setError(message || 'Une erreur est survenue.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setError('')
    try {
      const returnUrl = Linking.createURL('auth')
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_BASE_URL}/auth/google?mobile=true&returnUrl=${encodeURIComponent(returnUrl)}`,
        returnUrl,
      )

      if (result.type === 'success' && result.url) {
        const url = Linking.parse(result.url)
        const accessToken = url.queryParams?.accessToken as string
        const refreshToken = url.queryParams?.refreshToken as string

        if (accessToken && refreshToken) {
          await loginWithTokens(accessToken, refreshToken)
          router.replace('/home')
        }
      }
    } catch (err) {
      console.error('Google login failed:', err)
      setError('La connexion Google a échoué.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const isDisabled = isSubmitting || isGoogleLoading

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo + App name */}
          <View style={styles.brandSection}>
            <Image
              source={require('../assets/play.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={styles.appName}>{content.header.appName}</Text>
          </View>

          {/* Title + Description */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>
              {mode === 'login' ? content.auth.loginTitle : content.auth.signupTitle}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'login' ? content.auth.loginDescription : content.auth.signupDescription}
            </Text>
          </View>

          {/* Inputs */}
          <View style={styles.formSection}>
            <View style={[styles.inputContainer, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder={content.auth.emailPlaceholder}
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                editable={!isDisabled}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground, flex: 1 }]}
                placeholder={content.auth.passwordPlaceholder}
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={password.length > 0 && !showPassword}
                textContentType="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                editable={!isDisabled}
              />
              {password.length > 0 && (
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  {showPassword ? (
                    <Eye size={18} color={colors.mutedForeground} />
                  ) : (
                    <EyeOff size={18} color={colors.mutedForeground} />
                  )}
                </Pressable>
              )}
            </View>

            {/* Error */}
            {error !== '' && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Submit button */}
            <Pressable
              style={[styles.submitButton, isDisabled && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isDisabled}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'login' ? content.auth.loginTitle : content.auth.signupTitle}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Separator */}
          <View style={styles.separatorContainer}>
            <View style={[styles.separatorLine, { backgroundColor: theme.border }]} />
            <Text style={styles.separatorText}>{content.auth.or}</Text>
            <View style={[styles.separatorLine, { backgroundColor: theme.border }]} />
          </View>

          {/* Google button */}
          <Pressable
            style={[styles.googleButton, { borderColor: theme.border }, isDisabled && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={isDisabled}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color={colors.foreground} />
            ) : (
              <>
                <GoogleIcon />
                <Text style={styles.googleButtonText}>{content.auth.continueWithGoogle}</Text>
              </>
            )}
          </Pressable>

          {/* Toggle mode */}
          <View style={styles.toggleSection}>
            <Text style={styles.toggleText}>
              {mode === 'login' ? content.auth.dontHaveAccount : content.auth.alreadyHaveAccount}{' '}
            </Text>
            <Pressable
              onPress={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError('')
              }}
            >
              <Text style={styles.toggleLink}>
                {mode === 'login' ? content.auth.signupTitle : content.auth.loginTitle}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function GoogleIcon() {
  return (
    <View style={{ width: 20, height: 20 }}>
      <Image
        source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
        style={{ width: 20, height: 20 }}
        contentFit="contain"
      />
    </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['4xl'],
    paddingBottom: spacing['2xl'],
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing['4xl'],
  },
  logo: {
    width: 36,
    height: 36,
  },
  appName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.foreground,
  },
  titleSection: {
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    lineHeight: 20,
  },
  formSection: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    height: '100%',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  errorText: {
    color: '#ef4444',
    fontSize: fontSize.sm,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.primaryForeground,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  separatorLine: {
    flex: 1,
    height: 1,
  },
  separatorText: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing['2xl'],
  },
  googleButtonText: {
    color: colors.foreground,
    fontSize: fontSize.base,
    fontWeight: '500',
  },
  toggleSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
  },
  toggleLink: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
})
