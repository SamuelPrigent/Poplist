'use client';

// import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Film,
  // Plus
} from 'lucide-react';
import { domAnimation, LazyMotion, m } from 'motion/react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ListCard } from '@/components/List/ListCard';
import { ListCardGenre } from '@/components/List/ListCardGenre';
import { ListCardSmall } from '@/components/List/ListCardSmall';
import { ItemDetailsModal } from '@/components/List/modal/ItemDetailsModal';
import { PageReveal } from '@/components/ui/PageReveal';
import { UserCard } from '@/components/User/UserCard';
import { Section } from '@/components/layout/Section';
import { useAuth } from '@/context/auth-context';
import { useRegisterSection } from '@/hooks/usePageReady';
import { tmdbAPI, type Watchlist, type WatchlistItem, watchlistAPI } from '@/lib/api-client';
import { getLocalWatchlistsWithOwnership } from '@/lib/localStorageHelpers';
// import { MoviePoster } from '@/components/Home/MoviePoster';
// import { deleteCachedThumbnail } from '@/lib/thumbnailGenerator';
import {
  getTMDBLanguage,
  // getTMDBRegion
} from '@/lib/utils';
import { useLanguageStore } from '@/store/language';
import { GENRE_CATEGORIES, getCategoryInfo } from '@/types/categories';

interface DiscoverItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  media_type?: 'movie' | 'tv';
  vote_average?: number;
  vote_count?: number;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
}

interface Creator {
  id: string;
  username: string;
  avatarUrl?: string;
  listCount: number;
}

interface FeaturedCategory {
  id: string;
  name: string;
  description: string;
  gradient?: string;
  itemCount: number;
  username: string;
}

function HomeContentInner() {
  const { content, language } = useLanguageStore();
  const { user } = useAuth();
  //   const tmdbLanguage = getTMDBLanguage(language);
  //   const tmdbRegion = getTMDBRegion(language);

  // Register sections for coordinated loading
  const { markReady: markPublicReady } = useRegisterSection('public-watchlists');
  const { markReady: markCreatorsReady } = useRegisterSection('creators');
  const { markReady: markCategoriesReady } = useRegisterSection('categories');

  const [userWatchlists, setUserWatchlists] = useState<Watchlist[]>([]);
  const [publicWatchlists, setPublicWatchlists] = useState<Watchlist[]>([]);
  const [recommendations, setRecommendations] = useState<DiscoverItem[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  //   const [addingTo, setAddingTo] = useState<number | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    tmdbId: string;
    type: 'movie' | 'tv';
  } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const fetchPublicWatchlists = useCallback(async () => {
    try {
      const publicData = await watchlistAPI.getPublicWatchlists(10);
      setPublicWatchlists(publicData.watchlists || []);
    } catch (error) {
      console.error('Failed to fetch public watchlists:', error);
    }
  }, []);

  const fetchCreators = useCallback(async () => {
    try {
      // Get public watchlists with higher limit to aggregate creators
      const publicData = await watchlistAPI.getPublicWatchlists(100);
      const watchlists = publicData.watchlists || [];

      // Aggregate by owner
      const creatorsMap = new Map<string, Creator>();

      for (const watchlist of watchlists) {
        if (watchlist.owner) {
          const ownerId = watchlist.owner.id || watchlist.ownerId;
          const existing = creatorsMap.get(ownerId);

          if (existing) {
            existing.listCount += 1;
          } else {
            creatorsMap.set(ownerId, {
              id: ownerId,
              username: watchlist.owner.username || 'Utilisateur',
              avatarUrl: watchlist.owner.avatarUrl,
              listCount: 1,
            });
          }
        }
      }

      // Sort by list count (descending) and take top 10
      const sortedCreators = Array.from(creatorsMap.values())
        .sort((a, b) => b.listCount - a.listCount)
        .slice(0, 10);

      setCreators(sortedCreators);
    } catch (error) {
      console.error('Failed to fetch creators:', error);
    }
  }, []);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch public watchlists and creators in parallel
        const [publicResult, creatorsResult] = await Promise.allSettled([
          fetchPublicWatchlists(),
          fetchCreators(),
        ]);

        // Mark sections ready as they complete
        if (publicResult.status === 'fulfilled') markPublicReady();
        if (creatorsResult.status === 'fulfilled') markCreatorsReady();

        let userWatchlistsData: Watchlist[] = [];
        if (user) {
          const userData = await watchlistAPI.getMine();
          userWatchlistsData = userData.watchlists || [];
          setUserWatchlists(userWatchlistsData);
        } else {
          userWatchlistsData = getLocalWatchlistsWithOwnership();
          setUserWatchlists(userWatchlistsData);
        }

        // Use Discover API instead of Trending for better quality results
        const tmdbLanguage = getTMDBLanguage(language);
        const randomPage = Math.floor(Math.random() * 5) + 1;

        const [movieData, tvData] = await Promise.all([
          tmdbAPI.getDiscover('movie', {
            page: randomPage,
            language: tmdbLanguage,
            voteCountGte: 100,
            voteAverageGte: 5.0,
            releaseDateGte: '2015-01-01',
          }),
          tmdbAPI.getDiscover('tv', {
            page: randomPage,
            language: tmdbLanguage,
            voteCountGte: 100,
            voteAverageGte: 5.0,
            releaseDateGte: '2015-01-01',
          }),
        ]);

        // Combine and alternate between movies and TV shows
        const movieResults = (movieData.results || []).map(item => ({
          ...item,
          media_type: 'movie' as const,
        }));
        const tvResults = (tvData.results || []).map(item => ({
          ...item,
          media_type: 'tv' as const,
        }));

        const combined: DiscoverItem[] = [];
        const maxLen = Math.max(movieResults.length, tvResults.length);
        for (let i = 0; i < maxLen; i++) {
          if (movieResults[i]) combined.push(movieResults[i]);
          if (tvResults[i]) combined.push(tvResults[i]);
        }

        // Filter and select random 5 items
        const filtered = combined.filter(
          item => item.poster_path && item.vote_average && item.vote_average >= 5
        );

        const maxOffset = Math.max(0, filtered.length - 5);
        const randomOffset = Math.floor(Math.random() * (maxOffset + 1));
        const selectedRecommendations = filtered.slice(randomOffset, randomOffset + 5);
        setRecommendations(selectedRecommendations);

        // Fetch category counts
        const genreIds = [
          'movies',
          'series',
          'anime',
          'action',
          'enfant',
          'documentaries',
          'jeunesse',
        ];

        const counts: Record<string, number> = {};
        await Promise.all(
          genreIds.map(async genreId => {
            try {
              const data = await watchlistAPI.getWatchlistsByGenre(genreId);
              counts[genreId] = data.watchlists?.length || 0;
            } catch (error) {
              console.error(`Failed to fetch count for ${genreId}:`, error);
              counts[genreId] = 0;
            }
          })
        );
        setCategoryCounts(counts);
        markCategoriesReady();
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // Mark all sections ready even on error to prevent infinite loading
        markPublicReady();
        markCreatorsReady();
        markCategoriesReady();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    user,
    fetchPublicWatchlists,
    fetchCreators,
    language,
    markPublicReady,
    markCreatorsReady,
    markCategoriesReady,
  ]);

  const handleOpenDetails = (item: DiscoverItem, index: number) => {
    setSelectedItem({
      tmdbId: item.id.toString(),
      type: item.media_type || 'movie',
    });
    setSelectedIndex(index);
    setDetailsModalOpen(true);
  };

  const handleNavigatePrevious = () => {
    if (selectedIndex > 0) {
      const prevItem = safeRecommendations[selectedIndex - 1];
      handleOpenDetails(prevItem, selectedIndex - 1);
    }
  };

  const handleNavigateNext = () => {
    if (selectedIndex < safeRecommendations.length - 1) {
      const nextItem = safeRecommendations[selectedIndex + 1];
      handleOpenDetails(nextItem, selectedIndex + 1);
    }
  };

  // Featured categories
  const categories: FeaturedCategory[] = GENRE_CATEGORIES.slice(0, 5).map(categoryId => {
    const categoryInfo = getCategoryInfo(categoryId, content);
    return {
      id: categoryId,
      name: categoryInfo.name,
      description: categoryInfo.description,
      gradient: categoryInfo.cardGradient,
      itemCount: categoryCounts[categoryId] || 0,
      username: 'Poplist',
    };
  });

  const safeRecommendations = useMemo(() => recommendations.slice(0, 5), [recommendations]);

  const listsUrl = user ? '/account/lists' : '/local/lists';

  // Skeleton components with dark background matching card styles
  const ListCardSkeleton = () => (
    <div className="bg-muted/30 animate-pulse rounded-lg p-2">
      <div className="bg-muted/50 aspect-square w-full rounded-md" />
      <div className="mt-3 space-y-2">
        <div className="bg-muted/50 h-4 w-3/4 rounded" />
        <div className="bg-muted/50 h-3 w-1/2 rounded" />
      </div>
    </div>
  );

  const UserCardSkeleton = () => (
    <div className="bg-muted/30 flex animate-pulse flex-col items-center gap-3 rounded-lg p-5">
      <div className="bg-muted/50 h-20 w-20 rounded-full" />
      <div className="bg-muted/50 h-4 w-24 rounded" />
      <div className="bg-muted/50 h-3 w-16 rounded" />
    </div>
  );

  // Animation variants - ultra léger
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.0005,
        delayChildren: 0,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.15 },
    },
  };

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* My Watchlists - Library Section */}
      {userWatchlists.length > 0 && (
        <Section className="pb-5">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">{content.home.library.title}</h2>
              <p className="text-muted-foreground mt-1 text-sm">{content.home.library.subtitle}</p>
            </div>
            <Link
              href={listsUrl}
              className="bg-muted/50 hover:bg-muted rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
            >
              {content.home.library.seeAll}
            </Link>
          </div>

          <LazyMotion features={domAnimation}>
            <m.div
              key={userWatchlists
                .slice(0, 4)
                .map(w => w.id)
                .join('-')}
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4"
            >
              {userWatchlists.slice(0, 4).map(watchlist => (
                <m.div key={watchlist.id} variants={itemVariants}>
                  <ListCardSmall
                    watchlist={watchlist}
                    onClick={() => {
                      window.location.href = user
                        ? `/lists/${watchlist.id}`
                        : `/local/list/${watchlist.id}`;
                    }}
                  />
                </m.div>
              ))}
            </m.div>
          </LazyMotion>
        </Section>
      )}

      {/* Categories Section */}
      <Section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">{content.home.categories.title}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{content.home.categories.subtitle}</p>
          </div>
          <Link
            href="/categories"
            className="bg-muted/50 hover:bg-muted rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors"
          >
            {content.home.categories.seeMore}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((category, index) => {
            const placeholderTimestamp = '1970-01-01T00:00:00.000Z';
            const placeholderItems: WatchlistItem[] = Array.from(
              { length: category.itemCount },
              (_, idx) => ({
                tmdbId: idx,
                title: category.name,
                posterPath: null,
                mediaType: 'movie' as const,
                platformList: [],
                addedAt: placeholderTimestamp,
              })
            );

            const mockWatchlist: Watchlist = {
              id: category.id,
              ownerId: 'featured',
              owner: {
                id: 'featured',
                email: 'featured@poplist.app',
                username: category.username,
              },
              name: category.name,
              description: category.description,
              imageUrl: '',
              isPublic: true,
              collaborators: [],
              items: placeholderItems,
              createdAt: placeholderTimestamp,
              updatedAt: placeholderTimestamp,
              likedBy: [],
            };

            return (
              <ListCardGenre
                key={category.id}
                watchlist={mockWatchlist}
                content={content}
                href={`/categories/${category.id}`}
                genreId={category.id}
                index={index}
              />
            );
          })}
        </div>
      </Section>

      {/* Popular Watchlists Section */}
      <Section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">
              {content.home.popularWatchlists.title}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {content.home.popularWatchlists.subtitle}
            </p>
          </div>
          <Link
            href="/lists"
            className="bg-muted/50 hover:bg-muted rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors"
          >
            {content.home.popularWatchlists.seeMore}
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <ListCardSkeleton key={i} />
            ))}
          </div>
        ) : publicWatchlists.length > 0 ? (
          <LazyMotion features={domAnimation}>
            <m.div
              key={publicWatchlists
                .slice(0, 10)
                .map(w => w.id)
                .join('-')}
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
            >
              {publicWatchlists.slice(0, 10).map((watchlist, index) => {
                const userWatchlist = userWatchlists.find(uw => uw.id === watchlist.id);
                const isOwner = userWatchlist?.isOwner ?? false;
                const isCollaborator = userWatchlist?.isCollaborator ?? false;
                const isSaved = userWatchlist && !userWatchlist.isOwner && !isCollaborator;

                const showSavedBadge = !isOwner && !isCollaborator && isSaved;
                const showCollaborativeBadge = isCollaborator;

                return (
                  <m.div key={watchlist.id} variants={itemVariants}>
                    <ListCard
                      watchlist={watchlist}
                      content={content}
                      href={`/lists/${watchlist.id}`}
                      showMenu={false}
                      showOwner={true}
                      showSavedBadge={showSavedBadge}
                      showCollaborativeBadge={showCollaborativeBadge}
                      priority={index < 5}
                    />
                  </m.div>
                );
              })}
            </m.div>
          </LazyMotion>
        ) : (
          <div className="border-border bg-card rounded-lg border p-12 text-center">
            <Film strokeWidth={1.4} className="text-muted-foreground mx-auto h-16 w-16" />
            <p className="text-muted-foreground mt-4">
              {content.home.popularWatchlists.noWatchlists}
            </p>
          </div>
        )}
      </Section>

      {/* Creators Section */}
      <Section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">{content.home.creators.title}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{content.home.creators.subtitle}</p>
          </div>
          <Link
            href="/users"
            className="bg-muted/50 hover:bg-muted rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors"
          >
            {content.home.creators.seeMore}
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <UserCardSkeleton key={i} />
            ))}
          </div>
        ) : creators.length > 0 ? (
          <LazyMotion features={domAnimation}>
            <m.div
              key={creators.map(c => c.id).join('-')}
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
            >
              {creators.map(creator => (
                <m.div key={creator.id} variants={itemVariants}>
                  <UserCard user={creator} listCount={creator.listCount} content={content} />
                </m.div>
              ))}
            </m.div>
          </LazyMotion>
        ) : null}
      </Section>

      {/* Item Details Modal */}
      {selectedItem && (
        <ItemDetailsModal
          open={detailsModalOpen}
          onOpenChange={open => {
            setDetailsModalOpen(open);
            if (!open) {
              setSelectedItem(null);
              setSelectedIndex(-1);
            }
          }}
          tmdbId={selectedItem.tmdbId}
          type={selectedItem.type}
          onPrevious={selectedIndex > 0 ? handleNavigatePrevious : undefined}
          onNext={selectedIndex < safeRecommendations.length - 1 ? handleNavigateNext : undefined}
        />
      )}
    </div>
  );
}

/**
 * HomeContent with coordinated page reveal animation.
 * All sections load in the background, then the page reveals with a smooth animation.
 */
export function HomeContent() {
  return (
    <PageReveal timeout={4000} minLoadingTime={200} revealDuration={0.5}>
      <HomeContentInner />
    </PageReveal>
  );
}
