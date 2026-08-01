import { View, Text, Pressable, FlatList, StyleSheet, Dimensions } from 'react-native'
import { useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { User as UserIcon } from 'lucide-react-native'
import { useAuth } from '../../../context/auth-context'
import UserMenuPopover, { type UserMenuPopoverRef } from '../../../components/UserMenuPopover'
import { useQueries } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { watchlistAPI } from '../../../lib/api-client'
import { useLanguageStore } from '../../../store/language'
import { GENRE_CATEGORIES } from '../../../types/categories'
import { colors, spacing, fontSize } from '../../../constants/theme'
import { useTheme } from '../../../hooks/useTheme'
import GenreCard from '../../../components/GenreCard'

const screenWidth = Dimensions.get('window').width
const cardWidth = (screenWidth - spacing.lg * 2 - spacing.md) / 2

export default function CategoriesScreen() {
  const theme = useTheme()
  const { user } = useAuth()
  const userMenuRef = useRef<UserMenuPopoverRef>(null)
  const avatarRef = useRef<View>(null)
  const { content } = useLanguageStore()
  const router = useRouter()

  // Comptes par catégorie (badge « N listes » de la PWA). Une query par genre,
  // mises en cache 5 min : le badge reste masqué tant que la donnée n'est pas là.
  const countQueries = useQueries({
    queries: GENRE_CATEGORIES.map((genre) => ({
      queryKey: [`/watchlists/by-genre/${genre}`],
      queryFn: () => watchlistAPI.getWatchlistsByGenre(genre),
      staleTime: 5 * 60_000,
      select: (data: { watchlists: unknown[] }) => data.watchlists?.length ?? 0,
    })),
  })
  const counts = GENRE_CATEGORIES.reduce<Record<string, number | undefined>>(
    (acc, genre, i) => {
      acc[genre] = countQueries[i]?.data
      return acc
    },
    {},
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          ref={avatarRef}
            style={[styles.avatarButton, { backgroundColor: theme.secondary }]}
          onPress={() =>
              avatarRef.current?.measureInWindow((x, y, width, height) =>
                userMenuRef.current?.present({ x, y, width, height }),
              )
            }
        >
          {user?.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.avatarImage}
              contentFit="cover"
              transition={0}
            />
          ) : (
            <UserIcon size={16} color={colors.mutedForeground} />
          )}
        </Pressable>
        <Text style={styles.title}>Catégories</Text>
      </View>

      <FlatList
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      data={[...GENRE_CATEGORIES]}
      keyExtractor={(item) => item}
      numColumns={2}
      columnWrapperStyle={styles.row}
      renderItem={({ item: categoryId }) => {
        const cat = content.categories.list[categoryId]
        if (!cat) return null
        return (
          <View style={styles.cardWrapper}>
            <GenreCard
              categoryId={categoryId}
              name={cat.name}
              listCount={counts[categoryId]}
              onPress={() => router.push(`/categories/${categoryId}`)}
            />
          </View>
        )
      }}
      />

      <UserMenuPopover ref={userMenuRef} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  avatarButton: {
    width: 33,
    height: 33,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 33,
    height: 33,
    borderRadius: 999,
  },
  title: {
    fontSize: fontSize.pageTitle,
    fontWeight: '700',
    color: colors.foreground,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  row: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cardWrapper: {
    width: cardWidth,
  },
})
