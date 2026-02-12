import { View, FlatList, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { watchlistAPI } from '../../lib/api-client';
import { useLanguageStore } from '../../store/language';
import { colors, spacing } from '../../constants/theme';
import UserBubble from '../../components/UserBubble';
import EmptyState from '../../components/EmptyState';
import type { Watchlist } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2;

interface Creator {
  username: string;
  avatarUrl?: string;
  listCount: number;
}

export default function AllCreatorsScreen() {
  const router = useRouter();
  const { content } = useLanguageStore();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async () => {
    try {
      const response = await watchlistAPI.getPublicWatchlists(500);
      const creatorsMap = new Map<string, Creator>();

      response.watchlists.forEach((w: Watchlist) => {
        if (w.owner?.username) {
          const existing = creatorsMap.get(w.owner.username);
          if (existing) {
            existing.listCount++;
          } else {
            creatorsMap.set(w.owner.username, {
              username: w.owner.username,
              avatarUrl: w.owner.avatarUrl,
              listCount: 1,
            });
          }
        }
      });

      const sorted = Array.from(creatorsMap.values()).sort((a, b) => b.listCount - a.listCount);
      setCreators(sorted);
    } catch (error) {
      console.error('Failed to load creators:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={creators}
      keyExtractor={item => item.username}
      numColumns={2}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <View style={styles.cardWrapper}>
          <UserBubble
            user={{ username: item.username, avatarUrl: item.avatarUrl }}
            listCount={item.listCount}
            onPress={() => router.push(`/user/${item.username}`)}
          />
        </View>
      )}
      ListEmptyComponent={<EmptyState title={content.home.creators.title} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  row: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
});
