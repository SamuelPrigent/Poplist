import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { watchlistAPI } from '../../../../lib/api-client';
import { useLanguageStore } from '../../../../store/language';
import { colors, spacing } from '../../../../constants/theme';
import { useTheme } from '../../../../hooks/useTheme';
import UserBubble from '../../../../components/UserBubble';
import EmptyState from '../../../../components/EmptyState';
import { toCreators, type Creator } from '../../../../lib/creators';

export default function AllCreatorsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { content } = useLanguageStore();

  // MÊME queryKey que l'écran Populaires : les deux dérivent du même appel,
  // react-query le mutualise donc au lieu de le jouer deux fois.
  const { data, isPending } = useQuery({
    queryKey: ['/watchlists/public/featured', 500],
    queryFn: async () => (await watchlistAPI.getPublicWatchlists(500)).watchlists,
    staleTime: 30_000,
  });

  const creators = useMemo(() => toCreators(data ?? []), [data]);

  const renderItem = useCallback(
    ({ item }: { item: Creator }) => (
      <UserBubble
        user={{ username: item.username, avatarUrl: item.avatarUrl }}
        listCount={item.listCount}
        onPress={() => router.push(`/user/${item.username}`)}
        layout="card"
      />
    ),
    [router],
  );

  if (isPending) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      data={creators}
      keyExtractor={item => item.username}
      renderItem={renderItem}
      ItemSeparatorComponent={Separator}
      ListEmptyComponent={<EmptyState title={content.home.creators.title} />}
      initialNumToRender={12}
      windowSize={7}
      removeClippedSubviews
    />
  );
}

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  separator: {
    height: spacing.md,
  },
});
