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
import { UserCard } from '@/components/User/UserCard';
import { Section } from '@/components/layout/Section';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';
import { createPlaceholderItem, watchlists as watchlistsApi, tmdb as tmdbApi, type Watchlist, type WatchlistItem } from '@/api';
// import { getTMDBImageUrl } from '@/lib/utils';
import { getLocalWatchlistsWithOwnership } from '@/lib/localStorageHelpers';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useScrollToTopOnMount } from '@/hooks/useScrollToTopOnMount';
import { MoviePoster } from '@/components/Home/MoviePoster';
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
  poster_path?: string | null;
  backdrop_path?: string | null;
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
  const { user, isAuthenticated } = useAuth();
  const tmdbLanguage = getTMDBLanguage(language);

  const mounted = useIsMounted();
  const [userWatchlists, setUserWatchlists] = useState<Watchlist[]>([]);
  const [publicWatchlists, setPublicWatchlists] = useState<Watchlist[]>([]);
  const [recommendations, setRecommendations] = useState<DiscoverItem[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [creators, setCreators] = useState<Creator[]>([]);
  const [trending, setTrending] = useState<DiscoverItem[]>([]);
  const [selectedTrendingItem, setSelectedTrendingItem] = useState<{
    tmdbId: string;
    type: 'movie' | 'tv';
  } | null>(null);
  const [selectedTrendingIndex, setSelectedTrendingIndex] = useState<number>(-1);
  const [trendingModalOpen, setTrendingModalOpen] = useState(false);
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
      const publicData = await watchlistsApi.getPublicFeatured(50);
      const sorted = (publicData.watchlists || []).sort(
        (a, b) => (b.likedBy?.length || 0) - (a.likedBy?.length || 0)
      );
      setPublicWatchlists(sorted.slice(0, 12));
    } catch (error) {
      console.error('Failed to fetch public watchlists:', error);
    }
  }, []);

  const fetchCreators = useCallback(async () => {
    try {
      // Get public watchlists with higher limit to aggregate creators
      const publicData = await watchlistsApi.getPublicFeatured(100);
      const allPublicWatchlists = publicData.watchlists || [];

      // Aggregate by owner
      const creatorsMap = new Map<string, Creator>();

      for (const watchlist of allPublicWatchlists) {
        if (watchlist.owner) {
          const ownerId = watchlist.owner.id;
          const existing = creatorsMap.get(ownerId);

          if (existing) {
            existing.listCount += 1;
          } else {
            creatorsMap.set(ownerId, {
              id: ownerId,
              username: watchlist.owner.username || 'Utilisateur',
              avatarUrl: watchlist.owner.avatarUrl ?? undefined,
              listCount: 1,
            });
          }
        }
      }

      // Sort by list count (descending) and take top 12 (2 rows × 6 cols)
      const sortedCreators = Array.from(creatorsMap.values())
        .sort((a, b) => b.listCount - a.listCount)
        .slice(0, 12);

      setCreators(sortedCreators);
    } catch (error) {
      console.error('Failed to fetch creators:', error);
    }
  }, []);

  useScrollToTopOnMount();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch public watchlists and creators in parallel
        await Promise.allSettled([fetchPublicWatchlists(), fetchCreators()]);

        let userWatchlistsData: Watchlist[] = [];
        if (user) {
          const userData = await watchlistsApi.getMine();
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
          tmdbApi.discover('movie', {
            page: randomPage,
            language: tmdbLanguage,
            voteCountGte: 100,
            voteAverageGte: 5.0,
            releaseDateGte: '2015-01-01',
          }),
          tmdbApi.discover('tv', {
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

        // Fetch category counts — itère sur GENRE_CATEGORIES (source of truth)
        // pour rester en phase avec ce qui est rendu plus bas (slice 0..6)
        const counts: Record<string, number> = {};
        await Promise.all(
          GENRE_CATEGORIES.map(async genreId => {
            try {
              const data = await watchlistsApi.getByGenre(genreId);
              counts[genreId] = data.watchlists?.length || 0;
            } catch (error) {
              console.error(`Failed to fetch count for ${genreId}:`, error);
              counts[genreId] = 0;
            }
          })
        );
        setCategoryCounts(counts);

        // Fetch trending
        try {
          const trendingData = await tmdbApi.getTrending('day');
          setTrending(
            (trendingData.results || [])
              .filter((r: DiscoverItem) => r.poster_path)
              .slice(0, 6)
              .map((r: DiscoverItem) => ({ ...r, media_type: r.media_type || 'movie' }))
          );
        } catch {
          // Non-blocking
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, fetchPublicWatchlists, fetchCreators, language]);

  const handleOpenTrending = (item: DiscoverItem, index: number) => {
    setSelectedTrendingItem({
      tmdbId: item.id.toString(),
      type: item.media_type || 'movie',
    });
    setSelectedTrendingIndex(index);
    setTrendingModalOpen(true);
  };

  const handleAddToWatchlist = async (
    watchlistId: string,
    tmdbId: string,
    mediaType: 'movie' | 'tv'
  ) => {
    const idNum = Number(tmdbId);
    const placeholder = createPlaceholderItem({
      tmdbId: idNum,
      title: '',
      posterPath: null,
      mediaType,
    });
    setUserWatchlists(prev =>
      prev.map(wl =>
        wl.id === watchlistId && !wl.items.some(it => it.tmdbId === idNum)
          ? { ...wl, items: [...wl.items, placeholder] }
          : wl
      )
    );
    try {
      await watchlistsApi.addItem(watchlistId, {
        tmdbId,
        mediaType,
        language: tmdbLanguage,
      });
      toast.success('Ajouté à la liste');
    } catch {
      setUserWatchlists(prev =>
        prev.map(wl =>
          wl.id === watchlistId ? { ...wl, items: wl.items.filter(it => it.tmdbId !== idNum) } : wl
        )
      );
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleRemoveFromWatchlist = async (watchlistId: string, tmdbId: string) => {
    const idNum = Number(tmdbId);
    let removed: WatchlistItem | undefined;
    setUserWatchlists(prev =>
      prev.map(wl => {
        if (wl.id !== watchlistId) return wl;
        removed = wl.items.find(it => it.tmdbId === idNum);
        return { ...wl, items: wl.items.filter(it => it.tmdbId !== idNum) };
      })
    );
    try {
      await watchlistsApi.removeItem(watchlistId, tmdbId);
      toast.success('Retiré de la liste');
    } catch {
      if (removed) {
        const restored = removed;
        setUserWatchlists(prev =>
          prev.map(wl => (wl.id === watchlistId ? { ...wl, items: [...wl.items, restored] } : wl))
        );
      }
      toast.error('Erreur lors du retrait');
    }
  };

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

  // Featured categories — 6 first
  const categories: FeaturedCategory[] = GENRE_CATEGORIES.slice(0, 6).map(categoryId => {
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

  // Use /local/lists by default for SSR to avoid hydration mismatch
  const listsUrl = mounted && user ? '/account/lists' : '/local/lists';

  // Skeleton components with dark background matching card styles
  const ListCardSkeleton = () => (
    <div className="bg-muted/30 rounded-lg p-2">
      <div className="bg-muted/50 aspect-square w-full rounded-md" />
      <div className="mt-3 space-y-2">
        <div className="bg-muted/50 h-4 w-3/4 rounded" />
        <div className="bg-muted/50 h-3 w-1/2 rounded" />
      </div>
    </div>
  );

  const ListCardSmallSkeleton = () => (
    <div className="bg-muted/30 flex w-full items-center gap-3 overflow-hidden rounded-lg p-3">
      <div className="bg-muted/50 h-16 w-16 shrink-0 rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="bg-muted/50 h-4 w-3/4 rounded" />
        <div className="bg-muted/50 h-3 w-1/3 rounded" />
      </div>
    </div>
  );

  const UserCardSkeleton = () => (
    <div className="bg-muted/30 flex flex-col items-center gap-3 rounded-lg p-5">
      <div className="bg-muted/50 h-20 w-20 rounded-full" />
      <div className="bg-muted/50 h-4 w-24 rounded" />
      <div className="bg-muted/50 h-3 w-16 rounded" />
    </div>
  );

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* My Watchlists - Library Section */}
      {(loading || userWatchlists.length > 0) && (
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

          {loading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ListCardSmallSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {userWatchlists.slice(0, 4).map(watchlist => (
                <ListCardSmall
                  key={watchlist.id}
                  watchlist={watchlist}
                  onClick={() => {
                    window.location.href = user
                      ? `/lists/${watchlist.id}`
                      : `/local/list/${watchlist.id}`;
                  }}
                />
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Categories Section */}
      <Section className="">
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

        <div className="grid grid-cols-3 gap-[14px] md:grid-cols-4 lg:grid-cols-6">
          {categories.map((category, index) => {
            const placeholderTimestamp = '1970-01-01T00:00:00.000Z';
            const placeholderItems: WatchlistItem[] = Array.from(
              { length: category.itemCount },
              (_, idx) =>
                createPlaceholderItem({
                  tmdbId: idx,
                  title: category.name,
                  mediaType: 'movie',
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
                avatarUrl: null,
              },
              name: category.name,
              description: category.description,
              imageUrl: null,
              thumbnailUrl: null,
              dominantColor: null,
              isPublic: true,
              genres: [],
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
          <div className="grid grid-cols-3 gap-[8px] md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <ListCardSkeleton key={i} />
            ))}
          </div>
        ) : publicWatchlists.length > 0 ? (
          <div className="grid grid-cols-3 gap-[4px] md:grid-cols-4 lg:grid-cols-6">
            {publicWatchlists.slice(0, 12).map((watchlist, index) => {
              const userWatchlist = userWatchlists.find(uw => uw.id === watchlist.id);
              const isOwner = userWatchlist?.isOwner ?? false;
              const isCollaborator = userWatchlist?.isCollaborator ?? false;
              const isSaved = userWatchlist && !userWatchlist.isOwner && !isCollaborator;

              const showSavedBadge = !isOwner && !isCollaborator && isSaved;
              const showCollaborativeBadge = (watchlist.collaborators?.length ?? 0) > 0;

              return (
                <ListCard
                  key={watchlist.id}
                  watchlist={watchlist}
                  content={content}
                  href={`/lists/${watchlist.id}`}
                  showMenu={false}
                  showOwner={true}
                  showSavedBadge={showSavedBadge}
                  showCollaborativeBadge={showCollaborativeBadge}
                  priority={index < 5}
                />
              );
            })}
          </div>
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
          <div className="grid grid-cols-3 gap-[11px] md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <UserCardSkeleton key={i} />
            ))}
          </div>
        ) : creators.length > 0 ? (
          <div className="grid grid-cols-3 gap-[11px] md:grid-cols-4 lg:grid-cols-6">
            {creators.map(creator => (
              <UserCard
                key={creator.id}
                user={creator}
                listCount={creator.listCount}
                content={content}
              />
            ))}
          </div>
        ) : null}
      </Section>

      {/* Trending Section */}
      {!loading && trending.length > 0 && (
        <Section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">{content.home.trending.title}</h2>
              <p className="text-muted-foreground mt-1 text-sm">{content.home.trending.subtitle}</p>
            </div>
            <Link
              href="/explore"
              className="bg-muted/50 hover:bg-muted rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors"
            >
              {content.home.creators.seeMore}
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-[13px] sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {trending.map((item, index) => (
              <MoviePoster
                key={item.id}
                id={item.id}
                title={item.title}
                name={item.name}
                posterPath={item.poster_path ?? undefined}
                voteAverage={item.vote_average}
                onClick={() => handleOpenTrending(item, index)}
                watchlists={isAuthenticated ? userWatchlists : []}
                onAddToWatchlist={watchlistId =>
                  handleAddToWatchlist(
                    watchlistId,
                    item.id.toString(),
                    item.media_type || (item.title ? 'movie' : 'tv')
                  )
                }
                onRemoveFromWatchlist={watchlistId =>
                  handleRemoveFromWatchlist(watchlistId, item.id.toString())
                }
                addToWatchlistLabel={content.watchlists.addToWatchlist}
                noWatchlistLabel={content.watchlists.noWatchlist}
              />
            ))}
          </div>
        </Section>
      )}

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
          watchlists={userWatchlists.filter(w => w.isOwner || w.isCollaborator)}
          isAuthenticated={isAuthenticated}
          onAddToWatchlist={watchlistId =>
            handleAddToWatchlist(watchlistId, selectedItem.tmdbId, selectedItem.type)
          }
          onRemoveFromWatchlist={watchlistId =>
            handleRemoveFromWatchlist(watchlistId, selectedItem.tmdbId)
          }
        />
      )}

      {/* Trending Details Modal */}
      {selectedTrendingItem && (
        <ItemDetailsModal
          open={trendingModalOpen}
          onOpenChange={open => {
            setTrendingModalOpen(open);
            if (!open) {
              setSelectedTrendingItem(null);
              setSelectedTrendingIndex(-1);
            }
          }}
          tmdbId={selectedTrendingItem.tmdbId}
          type={selectedTrendingItem.type}
          onPrevious={
            selectedTrendingIndex > 0
              ? () => {
                  const prev = trending[selectedTrendingIndex - 1];
                  handleOpenTrending(prev, selectedTrendingIndex - 1);
                }
              : undefined
          }
          onNext={
            selectedTrendingIndex < trending.length - 1
              ? () => {
                  const next = trending[selectedTrendingIndex + 1];
                  handleOpenTrending(next, selectedTrendingIndex + 1);
                }
              : undefined
          }
          watchlists={userWatchlists.filter(w => w.isOwner || w.isCollaborator)}
          isAuthenticated={isAuthenticated}
          onAddToWatchlist={watchlistId =>
            handleAddToWatchlist(
              watchlistId,
              selectedTrendingItem.tmdbId,
              selectedTrendingItem.type
            )
          }
          onRemoveFromWatchlist={watchlistId =>
            handleRemoveFromWatchlist(watchlistId, selectedTrendingItem.tmdbId)
          }
        />
      )}
    </div>
  );
}

/**
 * HomeContent with instant page reveal animation.
 * Skeletons show during loading, then content fades in smoothly.
 */
export function HomeContent() {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <HomeContentInner />
      </m.div>
    </LazyMotion>
  );
}
