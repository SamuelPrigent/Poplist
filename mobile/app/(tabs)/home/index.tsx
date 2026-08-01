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
import { useRef, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { toCreators } from '../../../lib/creators';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';
import { watchlistAPI, tmdbAPI } from '../../../lib/api-client';
import { getTMDBImageUrl } from '../../../lib/utils';
import { useLanguageStore } from '../../../store/language';
import ItemDetailSheet from '../../../components/ItemDetailSheet';
import type { WatchlistItem } from '../../../types';
import { useAuth } from '../../../context/auth-context';
import UserMenuPopover, { type UserMenuPopoverRef } from '../../../components/UserMenuPopover';
import { colors, fontSize, spacing } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { GENRE_CATEGORIES, getCategoryInfo } from '../../../types/categories';
import type { Watchlist } from '../../../types';
import WatchlistCard from '../../../components/WatchlistCard';
import GenreCard from '../../../components/GenreCard';
import UserBubble from '../../../components/UserBubble';
import SectionHeader from '../../../components/SectionHeader';
import { GRID_COLUMNS } from '../../../constants/layout';
import ListCardSmall from '../../../components/ListCardSmall';
import TrendingCard from '../../../components/TrendingCard';
import HorizontalList from '../../../components/HorizontalList';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Cards de genre : base ~2,2 par écran, puis -10 % de largeur et +10 % de gap
// après revue sur device (trois passes : 0.85 trop petit, 2.05 trop grand).
const GENRE_GAP = spacing.sm * 1.1;
const GENRE_ITEM_WIDTH = ((SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2.2) * 0.9;
const CREATOR_CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2;
/** PWA mobile : items du carrousel « Nos créateurs » en 92px de large. */
const CREATOR_ITEM_WIDTH = 78;
const TRENDING_3COL_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 2) / 3;

interface TrendingItem {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
}

function getCardWidth(cols: number) {
  if (cols === 1) return SCREEN_WIDTH - spacing.lg * 2;
  return (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * (cols - 1)) / cols;
}

export default function HomeScreen() {
  const { content } = useLanguageStore();
  const { user } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const userMenuRef = useRef<UserMenuPopoverRef>(null)
  const avatarRef = useRef<View>(null);
  const gridCols = GRID_COLUMNS;
  const cardWidth = getCardWidth(GRID_COLUMNS);
  // Fiche « tendance » ouverte (index dans le carrousel).
  const [selectedTrendingIndex, setSelectedTrendingIndex] = useState<number | null>(null);

  // react-query plutôt que `useState` + `Promise.all` : les quatre appels sont
  // mutualisés avec les autres écrans (l'appel à 500 listes est le MÊME que
  // celui de Populaires et de Créateurs), et revenir sur l'accueil réaffiche le
  // cache au lieu de tout recharger derrière un spinner.
  const [popularQuery, allPublicQuery, trendingQuery, mineQuery] = useQueries({
    queries: [
      {
        queryKey: ['/watchlists/public/featured', 9],
        queryFn: async () => (await watchlistAPI.getPublicWatchlists(9)).watchlists,
        staleTime: 30_000,
      },
      {
        queryKey: ['/watchlists/public/featured', 500],
        queryFn: async () => (await watchlistAPI.getPublicWatchlists(500)).watchlists,
        staleTime: 30_000,
      },
      {
        queryKey: ['/tmdb/trending', 'day'],
        queryFn: async () => (await tmdbAPI.getTrending('day')).results,
        staleTime: 5 * 60_000,
      },
      {
        queryKey: ['/watchlists/mine'],
        queryFn: async () => (await watchlistAPI.getMine().catch(() => ({ watchlists: [] }))).watchlists ?? [],
        staleTime: 30_000,
      },
    ],
  });

  const popularWatchlists = popularQuery.data ?? [];
  const myWatchlists = mineQuery.data ?? [];
  const isLoading =
    popularQuery.isPending || allPublicQuery.isPending || trendingQuery.isPending;

  // 30 créateurs les plus actifs (le carrousel n'en montrait que 6).
  const creators = useMemo(
    () => toCreators(allPublicQuery.data ?? []).slice(0, 30),
    [allPublicQuery.data],
  );

  const trending = useMemo(
    () => (trendingQuery.data ?? []).filter((r: TrendingItem) => r.poster_path).slice(0, 6),
    [trendingQuery.data],
  );

  const categories = useMemo(
    () => GENRE_CATEGORIES.map(id => getCategoryInfo(id, content)),
    [content],
  );

  // Nombre de listes par catégorie (badge des cards) — mêmes queries que la
  // page Catégories, donc cache partagé : pas de requêtes en double.
  const categoryCountQueries = useQueries({
    queries: GENRE_CATEGORIES.map(genre => ({
      queryKey: [`/watchlists/by-genre/${genre}`],
      queryFn: () => watchlistAPI.getWatchlistsByGenre(genre),
      staleTime: 5 * 60_000,
      select: (data: { watchlists: unknown[] }) => data.watchlists?.length ?? 0,
    })),
  });
  const categoryCounts = GENRE_CATEGORIES.reduce<Record<string, number | undefined>>(
    (acc, genre, i) => {
      acc[genre] = categoryCountQueries[i]?.data;
      return acc;
    },
    {},
  );

  const trendingSheetItems: WatchlistItem[] = trending.map(t => ({
    // Item UI éphémère (pas encore en base) : les champs DB sont neutres.
    id: `tmdb-${t.id}`,
    watchlistId: null,
    tmdbId: t.id,
    title: t.title || t.name || '',
    posterPath: t.poster_path || null,
    backdropPath: null,
    overview: null,
    releaseDate: null,
    voteAverage: null,
    runtime: null,
    numberOfSeasons: null,
    numberOfEpisodes: null,
    position: null,
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
                recyclingKey="home-avatar"
                transition={0}
              />
            ) : (
              <User size={18} color={colors.mutedForeground} />
            )}
          </Pressable>
          <Text style={styles.appTitle}>{content.header.appName}</Text>
          <View style={{ flex: 1 }} />
        </View>

        {/* Bibliothèque — mes listes (PWA : 1re section de l'accueil, 4 max) */}
        {myWatchlists.length > 0 && (
          <View style={styles.sectionFirst}>
            <SectionHeader
              title="Bibliothèque"
              onSeeAll={() => router.push('/(tabs)/lists')}
            />
            <View style={styles.libraryGrid}>
              {myWatchlists.slice(0, 4).map(wl => (
                <View key={wl.id} style={styles.libraryCell}>
                  <ListCardSmall watchlist={wl} onPress={() => router.push(`/list/${wl.id}`)} />
                </View>
              ))}
            </View>
          </View>
        )}

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
          gap={GENRE_GAP}
          renderItem={item => (
            <View style={{ width: GENRE_ITEM_WIDTH }}>
              <GenreCard
                categoryId={item.id}
                name={item.name}
                listCount={categoryCounts[item.id]}
                onPress={() => router.push(`/categories/${item.id}`)}
              />
            </View>
          )}
        />

        {/* Popular Watchlists */}
        <View style={myWatchlists.length > 0 ? styles.section : styles.sectionFirst}>
          <SectionHeader
            title={content.home.popularWatchlists.title}
            onSeeAll={() => router.push('/popular')}
          />
          {popularWatchlists.length > 0 ? (
            <View style={styles.grid}>
              {popularWatchlists.slice(0, gridCols * 3).map(watchlist => (
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

        {/* Creators */}
        <View style={styles.sectionCreators}>
          <SectionHeader
            title={content.home.creators.title}
            onSeeAll={() => router.push('/users')}
          />
        </View>
        {/* Carrousel horizontal (PWA : items 92px, gap 8) — pas une grille */}
        {creators.length > 0 ? (
          <HorizontalList
            data={creators}
            keyExtractor={item => item.username}
            itemWidth={CREATOR_ITEM_WIDTH}
            gap={spacing.sm}
            renderItem={item => (
              <View style={{ width: CREATOR_ITEM_WIDTH }}>
                <UserBubble
                  user={{ username: item.username, avatarUrl: item.avatarUrl }}
                  listCount={item.listCount}
                  onPress={() => router.push(`/user/${item.username}`)}
                />
              </View>
            )}
          />
        ) : null}

        {/* Trending */}
        {trending.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title={content.home.trending.title}
              onSeeAll={() => router.push('/(tabs)/explore')}
            />
            {/* PWA : 4 cartes pleine largeur en format paysage (backdrop) */}
            <View style={styles.trendingList}>
              {trending.slice(0, 4).map((item, index) => (
                <TrendingCard
                  key={item.id}
                  title={item.title || item.name || ''}
                  backdropUrl={getTMDBImageUrl(item.backdrop_path ?? null, 'w780')}
                  typeLabel={
                    item.media_type === 'movie'
                      ? content.watchlists.contentTypes.movie
                      : content.watchlists.contentTypes.series
                  }
                  voteAverage={item.vote_average}
                  onPress={() => setSelectedTrendingIndex(index)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: spacing.sm }} />
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
    
      {/* Popover de la bulle d'avatar (PWA : MobileHeader) */}
      <UserMenuPopover ref={userMenuRef} />
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
    // La tab bar gère déjà son propre espace : 80 laissait un grand vide.
    paddingBottom: spacing.lg,
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
    marginTop: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing['4xl'],
  },
  sectionCreators: {
    paddingHorizontal: spacing.lg,
    marginTop: 28,
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
  trendingList: {
    gap: spacing.md,
  },
  /** PWA : grille 2 colonnes, gap-x 4 / gap-y 11 en mobile. */
  libraryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    rowGap: 11,
  },
  libraryCell: {
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
