import { View, Text, FlatList, StyleSheet, ActivityIndicator, Dimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect, useState, useLayoutEffect } from 'react'
import { Image } from 'expo-image'
import { User as UserIcon } from 'lucide-react-native'
import { userAPI } from '../../lib/api-client'
import { useLanguageStore } from '../../store/language'
import { usePreferencesStore } from '../../store/preferences'
import { colors, fontSize, spacing, borderRadius } from '../../constants/theme'
import WatchlistCard from '../../components/WatchlistCard'
import EmptyState from '../../components/EmptyState'
import type { Watchlist, UserProfilePublic } from '../../types'

const screenWidth = Dimensions.get('window').width
function getCardWidth(cols: number) {
  return (screenWidth - spacing.lg * 2 - spacing.sm * (cols - 1)) / cols
}

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { content } = useLanguageStore()
  const { columns } = usePreferencesStore()
  const cardWidth = getCardWidth(columns)
  const [profile, setProfile] = useState<UserProfilePublic | null>(null)
  const [watchlists, setWatchlists] = useState<Watchlist[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: '' })
  }, [navigation])

  useEffect(() => {
    if (username) loadProfile()
  }, [username])

  const loadProfile = async () => {
    try {
      const response = await userAPI.getUserProfileByUsername(username!)
      setProfile(response.user)
      setWatchlists(response.watchlists)
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!profile) {
    return (
      <View style={styles.loading}>
        <EmptyState title={content.userProfile.notFound} />
      </View>
    )
  }

  const listLabel = watchlists.length === 1
    ? content.userProfile.publicWatchlist
    : content.userProfile.publicWatchlists

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 32 }]}
      data={watchlists}
      keyExtractor={(item) => item.id}
      key={columns}
      numColumns={columns}
      columnWrapperStyle={styles.row}
      ListHeaderComponent={
        <View style={styles.profileHeader}>
          {profile.avatarUrl ? (
            <Image
              source={{ uri: profile.avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <UserIcon size={40} color={colors.mutedForeground} />
            </View>
          )}
          <Text style={styles.profileName}>{profile.username}</Text>
          <Text style={styles.profileMeta}>
            {watchlists.length} {listLabel}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <WatchlistCard watchlist={item} showOwner={false} width={cardWidth} />
      )}
      ListEmptyComponent={
        <EmptyState title={content.userProfile.noPublicWatchlists} />
      }
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profileName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  profileMeta: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
  },
  row: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
})
