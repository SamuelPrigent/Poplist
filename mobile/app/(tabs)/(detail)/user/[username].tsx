import { View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useLayoutEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { User as UserIcon } from 'lucide-react-native'
import { userAPI } from '../../../../lib/api-client'
import { useLanguageStore } from '../../../../store/language'
import { colors, fontSize, spacing } from '../../../../constants/theme'
import { useTheme } from '../../../../hooks/useTheme'
import WatchlistGrid from '../../../../components/WatchlistGrid'
import EmptyState from '../../../../components/EmptyState'

/** Profil public : en-tête auteur + grille de ses listes (grille mutualisée). */
export default function UserProfileScreen() {
  const theme = useTheme()
  const { username } = useLocalSearchParams<{ username: string }>()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { content } = useLanguageStore()

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: '' })
  }, [navigation])

  const { data, isPending } = useQuery({
    queryKey: ['/users/profile', username],
    queryFn: () => userAPI.getUserProfileByUsername(username!),
    enabled: !!username,
    staleTime: 30_000,
  })

  const profile = data?.user
  const watchlists = data?.watchlists ?? []

  if (!isPending && !profile) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <EmptyState title={content.userProfile.notFound} />
      </View>
    )
  }

  const listLabel =
    watchlists.length === 1
      ? content.userProfile.publicWatchlist
      : content.userProfile.publicWatchlists

  return (
    <WatchlistGrid
      watchlists={watchlists}
      isPending={isPending}
      showOwner={false}
      emptyTitle={content.userProfile.noPublicWatchlists}
      contentContainerStyle={{ paddingTop: insets.top + 32 }}
      ListHeaderComponent={
        profile ? (
          <View style={styles.profileHeader}>
            {profile.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
                recyclingKey={`profile-${profile.username}`}
                transition={0}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <UserIcon size={40} color={colors.mutedForeground} />
              </View>
            )}
            <Text style={styles.profileName}>{profile.username}</Text>
            <Text style={styles.profileMeta}>
              {watchlists.length} {listLabel}
            </Text>
          </View>
        ) : null
      }
    />
  )
}

const styles = StyleSheet.create({
  centered: {
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
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
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
})
