import { Tabs } from 'expo-router'
import { Home, ListPlus, Compass, User } from 'lucide-react-native'
import { useAuth } from '../../context/auth-context'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { colors } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const theme = useTheme()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, router])

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: 'rgba(10, 10, 10, 0.72)',
          borderTopWidth: 0,
          position: 'absolute',
          paddingBottom: 8,
        },
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: colors.foreground,
        headerShown: false,
        tabBarLabelStyle: {
          marginTop: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Home size={26} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: 'Mes listes',
          tabBarIcon: ({ color }) => <ListPlus size={26} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ color }) => <Compass size={26} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Compte',
          tabBarIcon: ({ color }) => <User size={26} color={color} strokeWidth={1.8} />,
        }}
      />
    </Tabs>
  )
}
