import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';
import { watchlistAPI } from '../../lib/api-client';
import { useLanguageStore } from '../../store/language';
import { usePreferencesStore } from '../../store/preferences';
import { useAuth } from '../../context/auth-context';
import { colors, fontSize, spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { GENRE_CATEGORIES, getCategoryInfo } from '../../types/categories';
import type { Watchlist } from '../../types';
import WatchlistCard from '../../components/WatchlistCard';
import GenreCard from '../../components/GenreCard';
import UserBubble from '../../components/UserBubble';
import SectionHeader from '../../components/SectionHeader';
import HorizontalList from '../../components/HorizontalList';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GENRE_ITEM_WIDTH = (SCREEN_WIDTH - spacing.lg * 2) / 2.5;
const CREATOR_CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2;

function getCardWidth(cols: number) {
  return (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * (cols - 1)) / cols;
}

export default function HomeScreen() {
  const { content } = useLanguageStore();
  const { columns } = usePreferencesStore();
  const { user } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const cardWidth = getCardWidth(columns);
  const [popularWatchlists, setPopularWatchlists] = useState<Watchlist[]>([]);
  const [creators, setCreators] = useState<
    { username: string; avatarUrl?: string; listCount: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [popularRes, creatorsRes] = await Promise.all([
        watchlistAPI.getPublicWatchlists(9),
        watchlistAPI.getPublicWatchlists(500),
      ]);

      setPopularWatchlists(popularRes.watchlists);

      const creatorsMap = new Map<
        string,
        { username: string; avatarUrl?: string; listCount: number }
      >();
      creatorsRes.watchlists.forEach((w: Watchlist) => {
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
      const sortedCreators = Array.from(creatorsMap.values())
        .sort((a, b) => b.listCount - a.listCount)
        .slice(0, 6);
      setCreators(sortedCreators);
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = GENRE_CATEGORIES.map(id => getCategoryInfo(id, content));

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>{content.header.appName}</Text>
          <View style={[styles.avatarButton, { backgroundColor: theme.secondary }]}>
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <User size={18} color={colors.mutedForeground} />
            )}
          </View>
        </View>

        {/* Popular Watchlists */}
        <View style={styles.sectionFirst}>
          <SectionHeader
            title={content.home.popularWatchlists.title}
            onSeeAll={() => router.push('/popular')}
          />
          {popularWatchlists.length > 0 ? (
            <View style={styles.grid}>
              {popularWatchlists.slice(0, columns * 3).map(watchlist => (
                <WatchlistCard
                  key={watchlist.id}
                  watchlist={watchlist}
                  showOwner
                  width={cardWidth}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>{content.home.popularWatchlists.noWatchlists}</Text>
          )}
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <SectionHeader
            title={content.home.categories.title}
            onSeeAll={() => router.push('/categories')}
          />
        </View>
        <HorizontalList
          data={categories}
          keyExtractor={item => item.id}
          itemWidth={GENRE_ITEM_WIDTH}
          gap={spacing.sm}
          renderItem={item => (
            <View style={{ width: GENRE_ITEM_WIDTH }}>
              <GenreCard
                categoryId={item.id}
                name={item.name}
                onPress={() => router.push(`/categories/${item.id}`)}
              />
            </View>
          )}
        />

        {/* Creators */}
        <View style={styles.sectionCreators}>
          <SectionHeader
            title={content.home.creators.title}
            onSeeAll={() => router.push('/users')}
          />
          {creators.length > 0 ? (
            <View style={styles.creatorsGrid}>
              {creators.map(creator => (
                <View key={creator.username} style={styles.creatorCard}>
                  <UserBubble
                    user={{ username: creator.username, avatarUrl: creator.avatarUrl }}
                    listCount={creator.listCount}
                    onPress={() => router.push(`/user/${creator.username}`)}
                  />
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  appTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.foreground,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  sectionFirst: {
    paddingHorizontal: spacing.lg,
    marginTop: 10,
    marginBottom: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: 43,
    marginBottom: spacing.md,
  },
  sectionCreators: {
    paddingHorizontal: spacing.lg,
    marginTop: 56,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.sm,
    rowGap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: spacing['3xl'],
  },
  creatorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  creatorCard: {
    width: CREATOR_CARD_WIDTH,
  },
});
