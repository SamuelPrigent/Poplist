import { View, FlatList, StyleSheet, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { useLanguageStore } from '../../store/language'
import { GENRE_CATEGORIES } from '../../types/categories'
import { colors, spacing } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'
import GenreCard from '../../components/GenreCard'

const screenWidth = Dimensions.get('window').width
const cardWidth = (screenWidth - spacing.lg * 2 - spacing.md) / 2

export default function CategoriesScreen() {
  const theme = useTheme()
  const { content } = useLanguageStore()
  const router = useRouter()

  return (
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
              onPress={() => router.push(`/categories/${categoryId}`)}
            />
          </View>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  row: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cardWrapper: {
    width: cardWidth,
  },
})
