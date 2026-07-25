'use client';

// import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Film,
  // Plus
} from 'lucide-react';
import { useRouter } from '@tanstack/react-router';
import { PageFade } from '@/components/ui/PageFade';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@/components/ui/Link';
import { ListCard } from '@/components/List/ListCard';
import { ListCardGrid } from '@/components/List/ListCardGrid';
import { ListCardGenre } from '@/components/List/ListCardGenre';
import { ListCardSmall } from '@/components/List/ListCardSmall';
import { ItemDetailsModal } from '@/components/List/modal/ItemDetailsModal';
import { UserCard } from '@/components/User/UserCard';
import { Section } from '@/components/layout/Section';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';
import {
  createPlaceholderItem,
  watchlists as watchlistsApi,
  type Watchlist,
  type WatchlistItem,
} from '@/api';
import { tmdbQueries, watchlistsQueries } from '@/api/queries';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useScrollToTopOnMount } from '@/hooks/useScrollToTopOnMount';
import { MoviePoster } from '@/components/Home/MoviePoster';
import { TrendingCardMobile } from '@/components/Home/TrendingCardMobile';
import { AddToListDrawer } from '@/components/List/AddToListDrawer';
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
  nameMobile?: string;
  description: string;
  gradient?: string;
  /** undefined = count pas encore chargé (badge masqué sur la card). */
  itemCount: number | undefined;
  username: string;
}

/**
 * En-tête de section. Desktop : titre + description à gauche, bouton pill à droite.
 * Mobile (< 750px) : titre allégé + action en texte simple sur la même ligne,
 * description masquée.
 */
function SectionHeader({
  title,
  subtitle,
  to,
  action,
}: {
  title: string;
  subtitle: string;
  to: string;
  action: string;
}) {
  return (
    <div className="mb-6 max-[749px]:mb-[19px]">
      {/* Desktop : titre + description + bouton pill */}
      <div className="flex items-start justify-between gap-3 max-[749px]:hidden">
        <div className="min-w-0">
          <h2 className="text-3xl font-bold text-white">{title}</h2>
          <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
        </div>
        <Link
          to={to}
          className="bg-muted/50 hover:bg-muted shrink-0 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors"
        >
          {action}
        </Link>
      </div>
      {/* Mobile : titre allégé + action en texte simple, pas de description */}
      <div className="hidden items-center justify-between gap-3 max-[749px]:flex">
        <h2 className="min-w-0 truncate text-xl font-semibold text-white">{title}</h2>
        <Link to={to} className="text-muted-foreground shrink-0 text-sm whitespace-nowrap">
          {action}
        </Link>
      </div>
    </div>
  );
}

function HomeContentInner() {
  const { content, language } = useLanguageStore();
  const { user, isAuthenticated } = useAuth();
  const tmdbLanguage = getTMDBLanguage(language);
  const queryClient = useQueryClient();

  const mounted = useIsMounted();

  // Page TMDB stable durant la session (sinon chaque re-render = nouveau cache).
  const [randomPage] = useState(() => Math.floor(Math.random() * 5) + 1);

  // Local watchlists pour les utilisateurs non-auth (localStorage)

  const [selectedTrendingItem, setSelectedTrendingItem] = useState<{
    tmdbId: string;
    type: 'movie' | 'tv';
  } | null>(null);
  const [selectedTrendingIndex, setSelectedTrendingIndex] = useState<number>(-1);
  const [trendingModalOpen, setTrendingModalOpen] = useState(false);
  // Item tendance dont on ouvre le drawer "Ajouter à une liste" (mobile)
  const [trendingAddItem, setTrendingAddItem] = useState<DiscoverItem | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    tmdbId: string;
    type: 'movie' | 'tv';
  } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useScrollToTopOnMount();

  // Carrousel catégories (mobile) : le scrollRestoration de TanStack Router
  // snapshot la position de CHAQUE élément scrollé (sessionStorage) et la
  // restaure au `onRendered` du back — c'est lui qui "cache" la position, pas
  // le navigateur. Pas d'opt-out par élément → on s'abonne à `onRendered`
  // (notre subscriber tourne juste après le sien, dans le même tick, avant
  // tout paint) et on remet le carrousel à 0 : ni position restaurée, ni
  // flash visible, ni saut au clic.
  const router = useRouter();
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const creatorsScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const resetCarousels = () => {
      categoriesScrollRef.current?.scrollTo({ left: 0 });
      creatorsScrollRef.current?.scrollTo({ left: 0 });
    };
    // Cas où le `onRendered` de la navigation courante est déjà passé au
    // moment où l'effect s'exécute (1er load / hydration).
    resetCarousels();
    return router.subscribe('onRendered', resetCarousels);
  }, [router]);

  // Featured publics : on fetch 100 d'un coup (sert pour la grille + les creators),
  // évite 2 fetches identiques côté backend.
  const publicQuery = useQuery(watchlistsQueries.publicFeatured(100));
  const allPublic = useMemo(() => publicQuery.data?.watchlists ?? [], [publicQuery.data]);

  const publicWatchlists = useMemo(() => {
    return [...allPublic]
      .sort((a, b) => (b.likedBy?.length || 0) - (a.likedBy?.length || 0))
      .slice(0, 12);
  }, [allPublic]);

  const creators = useMemo<Creator[]>(() => {
    const creatorsMap = new Map<string, Creator>();
    for (const wl of allPublic) {
      if (!wl.owner) continue;
      const ownerId = wl.owner.id;
      const existing = creatorsMap.get(ownerId);
      if (existing) {
        existing.listCount += 1;
      } else {
        creatorsMap.set(ownerId, {
          id: ownerId,
          username: wl.owner.username || 'Utilisateur',
          avatarUrl: wl.owner.avatarUrl ?? undefined,
          listCount: 1,
        });
      }
    }
    return Array.from(creatorsMap.values())
      .sort((a, b) => b.listCount - a.listCount)
      .slice(0, 12);
  }, [allPublic]);

  // Mes watchlists côté auth (TQ) ; non connecté → aucune liste
  const myWatchlistsQuery = useQuery({
    ...watchlistsQueries.mine(),
    enabled: !!user,
  });
  const userWatchlists: Watchlist[] = user ? (myWatchlistsQuery.data?.watchlists ?? []) : [];

  // Discover movies + TV en parallèle (1h staleTime, partagé inter-pages)
  const movieDiscoverQuery = useQuery(
    tmdbQueries.discover('movie', {
      page: randomPage,
      language: tmdbLanguage,
      voteCountGte: 100,
      voteAverageGte: 5.0,
      releaseDateGte: '2015-01-01',
    }),
  );
  const tvDiscoverQuery = useQuery(
    tmdbQueries.discover('tv', {
      page: randomPage,
      language: tmdbLanguage,
      voteCountGte: 100,
      voteAverageGte: 5.0,
      releaseDateGte: '2015-01-01',
    }),
  );

  const recommendations = useMemo<DiscoverItem[]>(() => {
    const movieResults = (movieDiscoverQuery.data?.results ?? []).map((item) => ({
      ...item,
      media_type: 'movie' as const,
    }));
    const tvResults = (tvDiscoverQuery.data?.results ?? []).map((item) => ({
      ...item,
      media_type: 'tv' as const,
    }));
    const combined: DiscoverItem[] = [];
    const maxLen = Math.max(movieResults.length, tvResults.length);
    for (let i = 0; i < maxLen; i++) {
      if (movieResults[i]) combined.push(movieResults[i]);
      if (tvResults[i]) combined.push(tvResults[i]);
    }
    return combined.filter(
      (item) => item.poster_path && item.vote_average && item.vote_average >= 5,
    );
  }, [movieDiscoverQuery.data, tvDiscoverQuery.data]);

  // Comptage par catégorie : N queries en parallèle via useQueries
  const categoryCountQueries = useQueries({
    queries: GENRE_CATEGORIES.map((genreId) => ({
      ...watchlistsQueries.byGenre(genreId),
      select: (data: { watchlists: Watchlist[] }) => data.watchlists?.length ?? 0,
    })),
  });
  // `undefined` tant que la query n'a pas résolu → badge masqué sur la card
  // (au lieu d'un « 0 listes » mensonger pendant le chargement).
  const categoryCounts = useMemo<Record<string, number | undefined>>(() => {
    return GENRE_CATEGORIES.reduce(
      (acc, genreId, i) => {
        acc[genreId] = categoryCountQueries[i]?.data;
        return acc;
      },
      {} as Record<string, number | undefined>,
    );
  }, [categoryCountQueries]);

  // Trending (cache 1h, partagé avec Landing)
  const trendingQuery = useQuery(tmdbQueries.trending('day'));
  const trending = useMemo<DiscoverItem[]>(() => {
    return ((trendingQuery.data?.results ?? []) as DiscoverItem[])
      .filter((r) => r.poster_path)
      .slice(0, 6)
      .map((r) => ({ ...r, media_type: r.media_type || 'movie' }));
  }, [trendingQuery.data]);

  const loading =
    publicQuery.isPending ||
    movieDiscoverQuery.isPending ||
    tvDiscoverQuery.isPending ||
    (!!user && myWatchlistsQuery.isPending);

  const handleOpenTrending = (item: DiscoverItem, index: number) => {
    setSelectedTrendingItem({
      tmdbId: item.id.toString(),
      type: item.media_type || 'movie',
    });
    setSelectedTrendingIndex(index);
    setTrendingModalOpen(true);
  };

  const mineKey = watchlistsQueries.mine().queryKey;

  const optimisticAdd = (watchlistId: string, item: WatchlistItem) => {
    if (user) {
      queryClient.setQueryData(mineKey, (old: { watchlists: Watchlist[] } | undefined) => {
        if (!old) return old;
        return {
          watchlists: old.watchlists.map((wl) =>
            wl.id === watchlistId && !wl.items.some((it) => it.tmdbId === item.tmdbId)
              ? { ...wl, items: [...wl.items, item] }
              : wl,
          ),
        };
      });
    }
  };

  const optimisticRemove = (watchlistId: string, tmdbId: number): WatchlistItem | undefined => {
    let removed: WatchlistItem | undefined;
    if (user) {
      queryClient.setQueryData(mineKey, (old: { watchlists: Watchlist[] } | undefined) => {
        if (!old) return old;
        return {
          watchlists: old.watchlists.map((wl) => {
            if (wl.id !== watchlistId) return wl;
            removed = wl.items.find((it) => it.tmdbId === tmdbId);
            return { ...wl, items: wl.items.filter((it) => it.tmdbId !== tmdbId) };
          }),
        };
      });
    }
    return removed;
  };

  const handleAddToWatchlist = async (
    watchlistId: string,
    tmdbId: string,
    mediaType: 'movie' | 'tv',
  ) => {
    const idNum = Number(tmdbId);
    const placeholder = createPlaceholderItem({
      tmdbId: idNum,
      title: '',
      posterPath: null,
      mediaType,
    });
    optimisticAdd(watchlistId, placeholder);
    try {
      await watchlistsApi.addItem(watchlistId, {
        tmdbId,
        mediaType,
        language: tmdbLanguage,
      });
      toast.success('Ajouté à la liste');
      queryClient.invalidateQueries({ queryKey: mineKey });
    } catch {
      optimisticRemove(watchlistId, idNum);
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleRemoveFromWatchlist = async (watchlistId: string, tmdbId: string) => {
    const idNum = Number(tmdbId);
    const removed = optimisticRemove(watchlistId, idNum);
    try {
      await watchlistsApi.removeItem(watchlistId, tmdbId);
      toast.success('Retiré de la liste');
      queryClient.invalidateQueries({ queryKey: mineKey });
    } catch {
      if (removed) optimisticAdd(watchlistId, removed);
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
  const categories: FeaturedCategory[] = GENRE_CATEGORIES.slice(0, 6).map((categoryId) => {
    const categoryInfo = getCategoryInfo(categoryId, content);
    return {
      id: categoryId,
      name: categoryInfo.name,
      nameMobile: categoryInfo.nameMobile,
      description: categoryInfo.description,
      gradient: categoryInfo.cardGradient,
      itemCount: categoryCounts[categoryId],
      username: 'Poplist',
    };
  });

  const safeRecommendations = useMemo(() => recommendations.slice(0, 5), [recommendations]);

  // Use /local/lists by default for SSR to avoid hydration mismatch
  const listsUrl = mounted && user ? '/account/lists' : '/local/lists';

  // Skeleton components with dark background matching card styles
  const ListCardSkeleton = () => (
    <div className="bg-muted/30 rounded-lg p-2 max-[749px]:rounded-none max-[749px]:bg-transparent max-[749px]:p-0">
      <div className="bg-muted/50 aspect-square w-full rounded-md max-[749px]:rounded" />
      <div className="mt-3 space-y-2 max-[749px]:mt-2">
        <div className="bg-muted/50 h-4 w-3/4 rounded" />
        <div className="bg-muted/50 h-3 w-1/2 rounded max-[749px]:hidden" />
      </div>
    </div>
  );

  // Suit exactement le rendu de ListCardSmall : sous 415px, fond/padding
  // retirés et thumbnail 56px → le skeleton ne « saute » plus au chargement.
  const ListCardSmallSkeleton = () => (
    <div className="bg-muted/30 flex w-full items-center gap-3 overflow-hidden rounded-lg p-3 max-[414px]:bg-transparent max-[414px]:p-0">
      <div className="bg-muted/50 h-16 w-16 shrink-0 rounded-md max-[414px]:h-14 max-[414px]:w-14" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="bg-muted/50 h-4 w-3/4 rounded" />
        <div className="bg-muted/50 h-3 w-1/3 rounded" />
      </div>
    </div>
  );

  const UserCardSkeleton = () => (
    <div className="flex flex-col items-center gap-3 max-[749px]:gap-2">
      <div className="bg-muted/50 h-20 w-20 rounded-full max-[749px]:h-[60px] max-[749px]:w-[60px]" />
      <div className="bg-muted/50 h-4 w-24 rounded max-[749px]:h-3.5 max-[749px]:w-16" />
      <div className="bg-muted/50 h-3 w-16 rounded max-[749px]:w-12" />
    </div>
  );

  return (
    <div className="bg-background min-h-screen pb-20 max-[749px]:pb-4">
      {/* My Watchlists - Library Section */}
      {(loading || userWatchlists.length > 0) && (
        <Section className="pb-5">
          <SectionHeader
            title={content.home.library.title}
            subtitle={content.home.library.subtitle}
            to={listsUrl}
            action={content.home.library.seeAll}
          />

          {loading ? (
            <div className="grid grid-cols-1 gap-3 max-[749px]:grid-cols-2 max-[414px]:gap-x-[4px] max-[414px]:gap-y-[11px] md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ListCardSmallSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 max-[749px]:grid-cols-2 max-[414px]:gap-x-[4px] max-[414px]:gap-y-[11px] md:grid-cols-2 lg:grid-cols-4">
              {userWatchlists.slice(0, 4).map((watchlist) => (
                <ListCardSmall
                  key={watchlist.id}
                  watchlist={watchlist}
                  to={`/lists/${watchlist.id}`}
                />
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Categories Section */}
      <Section className="">
        <SectionHeader
          title={content.home.categories.title}
          subtitle={content.home.categories.subtitle}
          to="/categories"
          action={content.home.categories.seeMore}
        />

        {/* Mobile : carrousel horizontal (cards à largeur fixe qui débordent à
            droite, scroll edge-to-edge grâce aux -mx/px). Desktop : grille. */}
        <div
          ref={categoriesScrollRef}
          className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-[14px] max-[749px]:-mx-4 max-[749px]:flex max-[749px]:gap-3 max-[749px]:overflow-x-auto max-[749px]:px-4 max-[749px]:pb-3 max-[749px]:[&>*]:w-[128px] max-[749px]:[&>*]:shrink-0 md:grid-cols-4 lg:grid-cols-6"
        >
          {categories.map((category, index) => {
            const placeholderTimestamp = '1970-01-01T00:00:00.000Z';
            const placeholderItems: WatchlistItem[] = Array.from(
              { length: category.itemCount ?? 0 },
              (_, idx) =>
                createPlaceholderItem({
                  tmdbId: idx,
                  title: category.name,
                  mediaType: 'movie',
                  addedAt: placeholderTimestamp,
                }),
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
                titleMobile={category.nameMobile}
                desktopAspectOnMobile
                index={index}
                itemCount={category.itemCount ?? 'pending'}
              />
            );
          })}
        </div>
      </Section>

      {/* Popular Watchlists Section */}
      <Section>
        <SectionHeader
          title={content.home.popularWatchlists.title}
          subtitle={content.home.popularWatchlists.subtitle}
          to="/lists"
          action={content.home.popularWatchlists.seeMore}
        />

        {loading ? (
          // Aperçu accueil : max 6 items sur mobile (le reste via "Voir tout").
          <ListCardGrid className="max-[749px]:[&>*:nth-child(n+7)]:hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <ListCardSkeleton key={i} />
            ))}
          </ListCardGrid>
        ) : publicWatchlists.length > 0 ? (
          <ListCardGrid className="max-[749px]:[&>*:nth-child(n+7)]:hidden">
            {publicWatchlists.slice(0, 12).map((watchlist, index) => {
              const userWatchlist = userWatchlists.find((uw) => uw.id === watchlist.id);
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
          </ListCardGrid>
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
        <SectionHeader
          title={content.home.creators.title}
          subtitle={content.home.creators.subtitle}
          to="/users"
          action={content.home.creators.seeMore}
        />

        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fill,104px)] justify-start gap-x-2 gap-y-3 max-[749px]:-mx-4 max-[749px]:flex max-[749px]:gap-2 max-[749px]:overflow-x-auto max-[749px]:px-4 max-[749px]:pb-3 max-[749px]:[&>*]:w-[92px] max-[749px]:[&>*]:shrink-0">
            {Array.from({ length: 12 }).map((_, i) => (
              <UserCardSkeleton key={i} />
            ))}
          </div>
        ) : creators.length > 0 ? (
          // Mobile : carrousel horizontal (avatars ronds), reset de la position
          // en nav (cf. creatorsScrollRef). Desktop : grille inchangée.
          <div
            ref={creatorsScrollRef}
            className="grid grid-cols-[repeat(auto-fill,104px)] justify-start gap-x-9 gap-y-3 max-[749px]:-mx-4 max-[749px]:flex max-[749px]:gap-2 max-[749px]:overflow-x-auto max-[749px]:px-4 max-[749px]:pb-3 max-[749px]:[&>*]:w-[92px] max-[749px]:[&>*]:shrink-0"
          >
            {creators.map((creator) => (
              <UserCard
                key={creator.id}
                user={creator}
                listCount={creator.listCount}
                content={content}
                carousel
              />
            ))}
          </div>
        ) : null}
      </Section>

      {/* Trending Section */}
      {!loading && trending.length > 0 && (
        <Section>
          <SectionHeader
            title={content.home.trending.title}
            subtitle={content.home.trending.subtitle}
            to="/explore"
            action={content.home.creators.seeMore}
          />
          {/* Desktop : grille de posters (hover + dropdown) */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(124px,1fr))] gap-[13px] max-[749px]:hidden sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
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
                onAddToWatchlist={(watchlistId) =>
                  handleAddToWatchlist(
                    watchlistId,
                    item.id.toString(),
                    item.media_type || (item.title ? 'movie' : 'tv'),
                  )
                }
                onRemoveFromWatchlist={(watchlistId) =>
                  handleRemoveFromWatchlist(watchlistId, item.id.toString())
                }
                addToWatchlistLabel={content.watchlists.addToWatchlist}
                noWatchlistLabel={content.watchlists.noWatchlist}
              />
            ))}
          </div>

          {/* Mobile : cards paysage pleine largeur (backdrop), le + ouvre
              directement le drawer d'ajout à une liste */}
          <div className="hidden max-[749px]:flex max-[749px]:flex-col max-[749px]:gap-3">
            {trending.slice(0, 4).map((item, index) => (
              <TrendingCardMobile
                key={item.id}
                id={item.id}
                title={item.title}
                name={item.name}
                backdropPath={item.backdrop_path}
                mediaType={item.media_type || (item.title ? 'movie' : 'tv')}
                voteAverage={item.vote_average}
                onClick={() => handleOpenTrending(item, index)}
                onAddClick={isAuthenticated ? () => setTrendingAddItem(item) : undefined}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Item Details Modal */}
      {selectedItem && (
        <ItemDetailsModal
          open={detailsModalOpen}
          onOpenChange={(open) => {
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
          watchlists={userWatchlists.filter((w) => w.isOwner || w.isCollaborator)}
          isAuthenticated={isAuthenticated}
          onAddToWatchlist={(watchlistId) =>
            handleAddToWatchlist(watchlistId, selectedItem.tmdbId, selectedItem.type)
          }
          onRemoveFromWatchlist={(watchlistId) =>
            handleRemoveFromWatchlist(watchlistId, selectedItem.tmdbId)
          }
        />
      )}

      {/* Drawer "Ajouter à une liste" (mobile, + des cards tendances) */}
      {trendingAddItem && (
        <AddToListDrawer
          open={!!trendingAddItem}
          onOpenChange={(open) => {
            if (!open) setTrendingAddItem(null);
          }}
          watchlists={userWatchlists.filter((w) => w.isOwner || w.isCollaborator)}
          tmdbId={trendingAddItem.id}
          onAdd={(watchlistId) =>
            handleAddToWatchlist(
              watchlistId,
              trendingAddItem.id.toString(),
              trendingAddItem.media_type || (trendingAddItem.title ? 'movie' : 'tv'),
            )
          }
          onRemove={(watchlistId) =>
            handleRemoveFromWatchlist(watchlistId, trendingAddItem.id.toString())
          }
        />
      )}

      {/* Trending Details Modal */}
      {selectedTrendingItem && (
        <ItemDetailsModal
          open={trendingModalOpen}
          onOpenChange={(open) => {
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
          watchlists={userWatchlists.filter((w) => w.isOwner || w.isCollaborator)}
          isAuthenticated={isAuthenticated}
          onAddToWatchlist={(watchlistId) =>
            handleAddToWatchlist(
              watchlistId,
              selectedTrendingItem.tmdbId,
              selectedTrendingItem.type,
            )
          }
          onRemoveFromWatchlist={(watchlistId) =>
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
    <PageFade>
      <HomeContentInner />
    </PageFade>
  );
}
