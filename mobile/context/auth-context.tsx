import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { authAPI, setAuthErrorHandler } from '../lib/api-client'
import { saveTokens, clearTokens } from '../services/auth-storage'
import { type Language, useLanguageStore } from '../store/language'

export interface User {
  id: string
  email: string
  username: string
  language?: string
  avatarUrl?: string
  roles: string[]
  hasPassword?: boolean
}

export interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  loginWithGoogle: (code: string, redirectUri: string) => Promise<void>
  loginWithTokens: (accessToken: string, refreshToken: string) => Promise<void>
  logout: () => Promise<void>
  refetch: () => Promise<void>
  updateUsername: (username: string) => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  deleteAccount: (confirmation: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const AUTH_STORAGE_KEY = 'poplist_auth'

async function getStoredUser(): Promise<User | null> {
  try {
    const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.user ?? null
    }
  } catch {
    // Ignore
  }
  return null
}

async function setStoredUser(user: User | null) {
  try {
    if (user) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ isAuthenticated: true, user }))
    } else {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY)
    }
  } catch {
    // Ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { setLanguage } = useLanguageStore()

  const fetchUser = useCallback(async () => {
    try {
      const response = await authAPI.me()
      const fetchedUser = response.user
      setUser(fetchedUser)
      await setStoredUser(fetchedUser)

      if (fetchedUser.language) {
        setLanguage(fetchedUser.language as Language)
      }
    } catch {
      setUser(null)
      await setStoredUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [setLanguage])

  const handleAutoLogout = useCallback(async () => {
    try {
      await authAPI.logout()
    } catch {
      // Ignore
    }
    setUser(null)
    await setStoredUser(null)
  }, [])

  useEffect(() => {
    // Load cached user first for instant UI, then verify with API
    ;(async () => {
      const cachedUser = await getStoredUser()
      if (cachedUser) {
        setUser(cachedUser)
      }
      await fetchUser()
    })()

    setAuthErrorHandler(handleAutoLogout)
  }, [fetchUser, handleAutoLogout])

  const loginWithGoogle = async (code: string, redirectUri: string) => {
    const response = await authAPI.loginWithGoogle(code, redirectUri)
    await saveTokens(response.accessToken, response.refreshToken)
    setUser(response.user)
    await setStoredUser(response.user)
  }

  const loginWithTokens = async (accessToken: string, refreshToken: string) => {
    await saveTokens(accessToken, refreshToken)
    await fetchUser()
  }

  const logout = async () => {
    await authAPI.logout()
    setUser(null)
    await setStoredUser(null)
  }

  const refetch = async () => {
    await fetchUser()
  }

  const updateUsername = async (username: string) => {
    const response = await authAPI.updateUsername(username)
    setUser(response.user)
    await setStoredUser(response.user)
  }

  const changePassword = async (oldPassword: string, newPassword: string) => {
    await authAPI.changePassword(oldPassword, newPassword)
  }

  const deleteAccount = async (confirmation: string) => {
    await authAPI.deleteAccount(confirmation)
    await clearTokens()
    setUser(null)
    await setStoredUser(null)
  }

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    loginWithGoogle,
    loginWithTokens,
    logout,
    refetch,
    updateUsername,
    changePassword,
    deleteAccount,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
