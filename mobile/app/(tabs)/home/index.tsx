import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';
import { watchlistAPI, tmdbAPI } from '../../../lib/api-client';
import { getTMDBImageUrl } from '../../../lib/utils';
import { useLanguageStore } from '../../../store/language';
import ItemDetailSheet from '../../../components/ItemDetailSheet';
import type { WatchlistItem } from '../../../types';
import { usePreferencesStore } from '../../../store/preferences';
import { useAuth } from '../../../context/auth-context';
import { colors, fontSize, spacing } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { GENRE_CATEGORIES, getCategoryInfo } from '../../../types/categories';
import type { Watchlist } from '../../../types';
import WatchlistCard from '../../../components/WatchlistCard';
import GenreCard from '../../../components/GenreCard';
import UserBubble from '../../../components/UserBubble';
import SectionHeader from '../../../components/SectionHeader';
import HorizontalList from '../../../components/HorizontalList';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GENRE_ITEM_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 3.2;
const CREATOR_CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2;
const TRENDING_3COL_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 2) / 3;

interface TrendingItem {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  poster_path?: string;
}

function getCardWidth(cols: number) {
  if (cols === 1) return SCREEN_WIDTH - spacing.lg * 2;
  return (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * (cols - 1)) / cols;
}

export default function HomeScreen() {
  const { content } = useLanguageStore();
  const { columns } = usePreferencesStore();
  const { user } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const isListMode = columns === 1;
  const gridCols = isListMode ? 1 : columns;
  const cardWidth = getCardWidth(isListMode ? 2 : columns);
  const [popularWatchlists, setPopularWatchlists] = useState<Watchlist[]>([]);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [selectedTrendingIndex, setSelectedTrendingIndex] = useState<number | null>(null);
  const [creators, setCreators] = useState<
    { username: string; avatarUrl?: string; listCount: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [popularRes, creatorsRes, trendingRes] = await Promise.all([
        watchlistAPI.getPublicWatchlists(9),
        watchlistAPI.getPublicWatchlists(500),
        tmdbAPI.getTrending('day'),
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
      setTrending(trendingRes.results.filter((r: TrendingItem) => r.poster_path).slice(0, 6));
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = GENRE_CATEGORIES.map(id => getCategoryInfo(id, content));

  const trendingSheetItems: WatchlistItem[] = trending.map(t => ({
    tmdbId: t.id,
    title: t.title || t.name || '',
    posterPath: t.poster_path || null,
    mediaType: t.media_type,
    platformList: [],
    addedAt: new Date().toISOString(),
  }));

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
          <View style={[styles.avatarButton, { backgroundColor: theme.secondary }]}>
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatarImage}
                contentFit="cover"
                recyclingKey="home-avatar"
                transition={0}
              />
            ) : (
              <User size={18} color={colors.mutedForeground} />
            )}
          </View>
          <Text style={styles.appTitle}>{content.header.appName}</Text>
          <View style={{ flex: 1 }} />
        </View>

        {/* Popular Watchlists */}
        <View style={styles.sectionFirst}>
          <SectionHeader
            title={content.home.popularWatchlists.title}
            onSeeAll={() => router.push('/home/popular')}
          />
          {popularWatchlists.length > 0 ? (
            <View style={isListMode ? styles.list : styles.grid}>
              {popularWatchlists.slice(0, isListMode ? 6 : gridCols * 3).map(watchlist => (
                <WatchlistCard
                  key={watchlist.id}
                  watchlist={watchlist}
                  showOwner
                  width={isListMode ? undefined : cardWidth}
                  layout={isListMode ? 'list' : 'grid'}
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
            onSeeAll={() => router.push('/home/categories')}
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
                onPress={() => router.push(`/home/categories/${item.id}`)}
              />
            </View>
          )}
        />

        {/* Creators */}
        <View style={styles.sectionCreators}>
          <SectionHeader
            title={content.home.creators.title}
            onSeeAll={() => router.push('/home/users')}
          />
          {creators.length > 0 ? (
            <View style={styles.creatorsGrid}>
              {creators.map(creator => (
                <View key={creator.username} style={styles.creatorCard}>
                  <UserBubble
                    user={{ username: creator.username, avatarUrl: creator.avatarUrl }}
                    listCount={creator.listCount}
                    onPress={() => router.push(`/home/user/${creator.username}`)}
                  />
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Trending */}
        {trending.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title={content.home.trending.title}
              onSeeAll={() => router.push('/(tabs)/explore')}
            />
            <View style={styles.trending3ColGrid}>
              {trending.slice(0, 6).map((item, index) => {
                const posterUrl = getTMDBImageUrl(item.poster_path, 'w342');
                return (
                  <Pressable key={item.id} style={{ width: TRENDING_3COL_WIDTH }} onPress={() => setSelectedTrendingIndex(index)}>
                    {posterUrl && (
                      <Image
                        source={{ uri: posterUrl }}
                        style={[styles.trending3ColPoster, { backgroundColor: theme.secondary }]}
                        contentFit="cover"
                        transition={0}
                      />
                    )}
                    <Text style={styles.trendingTitle} numberOfLines={1}>
                      {item.title || item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>

      {/* Trending detail sheet */}
      <ItemDetailSheet
        item={selectedTrendingIndex !== null ? trendingSheetItems[selectedTrendingIndex] : null}
        visible={selectedTrendingIndex !== null}
        onClose={() => setSelectedTrendingIndex(null)}
        items={trendingSheetItems}
        currentIndex={selectedTrendingIndex ?? 0}
        onNavigate={setSelectedTrendingIndex}
      />
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
    paddingBottom: 80,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: spacing.sm,
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
    width: 33,
    height: 33,
    borderRadius: 17,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 33,
    height: 33,
    borderRadius: 17,
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
  list: {
    flexDirection: 'column',
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
  trending3ColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  trending3ColPoster: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 8,
  },
  trendingTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: spacing.xs,
  },
});
