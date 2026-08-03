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
// Section « Bibliothèque » retirée de la home (cf. commentaire dans le rendu).
// import { ListCardSmall } from '@/components/List/ListCardSmall';
import { ItemDetailsModal } from '@/components/List/modal/ItemDetailsModal';
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
import { useScrollToTopOnMount } from '@/hooks/useScrollToTopOnMount';
import { TrendingCardMobile } from '@/components/Home/TrendingCardMobile';
import { TrendingRail } from '@/components/Home/TrendingRail';
import { CategoryShowcase, type CategoryTile } from '@/components/Home/CategoryShowcase';
import { CreatorShowcase } from '@/components/Home/CreatorShowcase';
import { CATEGORY_VISUALS } from '@/components/List/ListCardGenre';
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
  /** Affiches tirées de ses listes publiques : ce qu'il curate, pas juste son nom. */
  posters: string[];
}

/**
 * En-tête de section : titre au rôle `headline` (allégé en `title` sous 750px),
 * description optionnelle masquée en compact, action secondaire en ghost (pas
 * de pilule : une action bordée ou remplie serait une action primaire, et il
 * n'y en a qu'une par écran — cf. DESIGN.md § Buttons).
 *
 * `as` permet à la première section de la page de porter le `h1`.
 */
function SectionHeader({
  title,
  subtitle,
  to,
  action,
  as: Heading = 'h2',
}: {
  title: string;
  subtitle?: string;
  to: string;
  action: string;
  as?: 'h1' | 'h2';
}) {
  return (
    // `items-end` + la marge basse négative alignent la ligne de base de
    // l'action sur le bas de la description, au lieu de la laisser flotter en
    // haut du bloc ; le padding vertical garde la cible tactile à 44px.
    <div className="mb-6 flex items-end justify-between gap-3 max-[749px]:mb-[19px]">
      <div className="min-w-0">
        <Heading className="text-headline text-foreground max-[749px]:text-title max-[749px]:truncate max-[749px]:font-medium">
          {title}
        </Heading>
        {subtitle && (
          <p className="text-muted-foreground text-body mt-1 max-[749px]:hidden">{subtitle}</p>
        )}
      </div>
      <Link
        to={to}
        aria-label={`${action} — ${title}`}
        className="text-label text-muted-foreground hover:text-foreground -mb-3.5 shrink-0 py-3.5 whitespace-nowrap transition-colors"
      >
        {action}
      </Link>
    </div>
  );
}

function HomeContentInner() {
  const { content, language } = useLanguageStore();
  const { user, isAuthenticated } = useAuth();
  const tmdbLanguage = getTMDBLanguage(language);
  const queryClient = useQueryClient();

  const [selectedTrendingItem, setSelectedTrendingItem] = useState<{
    tmdbId: string;
    type: 'movie' | 'tv';
  } | null>(null);
  const [selectedTrendingIndex, setSelectedTrendingIndex] = useState<number>(-1);
  const [trendingModalOpen, setTrendingModalOpen] = useState(false);
  // Item tendance dont on ouvre le drawer "Ajouter à une liste" (mobile)
  const [trendingAddItem, setTrendingAddItem] = useState<DiscoverItem | null>(null);

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
    const postersOf = (wl: Watchlist) =>
      (wl.items ?? [])
        .map((item) => item.posterPath)
        .filter((path): path is string => !!path)
        .slice(0, 4);

    for (const wl of allPublic) {
      if (!wl.owner) continue;
      const ownerId = wl.owner.id;
      const existing = creatorsMap.get(ownerId);
      if (existing) {
        existing.listCount += 1;
        existing.posters.push(...postersOf(wl));
      } else {
        creatorsMap.set(ownerId, {
          id: ownerId,
          username: wl.owner.username || 'Utilisateur',
          avatarUrl: wl.owner.avatarUrl ?? undefined,
          listCount: 1,
          posters: postersOf(wl),
        });
      }
    }
    return Array.from(creatorsMap.values())
      .sort((a, b) => b.listCount - a.listCount)
      .slice(0, 12)
      .map((creator) => ({ ...creator, posters: creator.posters.slice(0, 6) }));
  }, [allPublic]);

  // Mes watchlists côté auth (TQ) ; non connecté → aucune liste
  const myWatchlistsQuery = useQuery({
    ...watchlistsQueries.mine(),
    enabled: !!user,
  });
  const userWatchlists: Watchlist[] = user ? (myWatchlistsQuery.data?.watchlists ?? []) : [];

  // Comptage par catégorie : N queries en parallèle via useQueries. On en
  // profite pour remonter quelques affiches réelles des listes de chaque
  // catégorie — plusieurs traitements de tuile s'en servent pour représenter
  // une catégorie par son contenu plutôt que par une couleur abstraite.
  const categoryCountQueries = useQueries({
    queries: GENRE_CATEGORIES.map((genreId) => ({
      ...watchlistsQueries.byGenre(genreId),
      select: (data: { watchlists: Watchlist[] }) => ({
        count: data.watchlists?.length ?? 0,
        // Triées par ajout le plus récent : l'affiche d'une catégorie n'est
        // pas un choix arbitraire figé, c'est ce qui vient d'y entrer. Elle
        // change donc à mesure que la communauté ajoute des titres.
        posters: (data.watchlists ?? [])
          .flatMap((wl) => wl.items ?? [])
          .filter((item) => !!item.posterPath)
          .sort((a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? ''))
          .map((item) => item.posterPath as string)
          .slice(0, 6),
      }),
    })),
  });
  // `undefined` tant que la query n'a pas résolu → badge masqué sur la card
  // (au lieu d'un « 0 listes » mensonger pendant le chargement).
  const categoryData = useMemo<
    Record<string, { count: number; posters: string[] } | undefined>
  >(() => {
    return GENRE_CATEGORIES.reduce(
      (acc, genreId, i) => {
        acc[genreId] = categoryCountQueries[i]?.data;
        return acc;
      },
      {} as Record<string, { count: number; posters: string[] } | undefined>,
    );
  }, [categoryCountQueries]);

  // Trending (cache 1h, partagé avec Landing)
  const trendingQuery = useQuery(tmdbQueries.trending('day'));
  const trending = useMemo<DiscoverItem[]>(() => {
    // 8 titres : le rail desktop en montre 6 (tête + 5 vignettes) et garde les
    // suivants montés hors champ, de sorte qu'aucune vignette n'entre vide.
    return ((trendingQuery.data?.results ?? []) as DiscoverItem[])
      .filter((r) => r.poster_path && r.backdrop_path)
      .slice(0, 8)
      .map((r) => ({ ...r, media_type: r.media_type || 'movie' }));
  }, [trendingQuery.data]);

  // Chaque section porte son propre état de chargement : une requête lente ne
  // retient plus le rendu des autres (avant, un `loading` global gatait toute
  // la page sur la plus lente des requêtes).
  const publicLoading = publicQuery.isPending;
  const trendingLoading = trendingQuery.isPending;

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
      toast.success(content.watchlists.toasts!.itemAdded);
      queryClient.invalidateQueries({ queryKey: mineKey });
    } catch {
      optimisticRemove(watchlistId, idNum);
      toast.error(content.watchlists.toasts!.itemAddError);
    }
  };

  const handleRemoveFromWatchlist = async (watchlistId: string, tmdbId: string) => {
    const idNum = Number(tmdbId);
    const removed = optimisticRemove(watchlistId, idNum);
    try {
      await watchlistsApi.removeItem(watchlistId, tmdbId);
      toast.success(content.watchlists.toasts!.itemRemoved);
      queryClient.invalidateQueries({ queryKey: mineKey });
    } catch {
      if (removed) optimisticAdd(watchlistId, removed);
      toast.error(content.watchlists.toasts!.itemRemoveError);
    }
  };

  // Tuiles catégories transmises au banc d'essai des traitements.
  const categoryTiles = useMemo<CategoryTile[]>(
    () =>
      GENRE_CATEGORIES.map((categoryId) => {
        const info = getCategoryInfo(categoryId, content);
        const data = categoryData[categoryId];
        const cutout = CATEGORY_VISUALS[categoryId]?.cutout ?? CATEGORY_VISUALS.movies.cutout;
        return {
          id: categoryId,
          name: info.name,
          nameMobile: info.nameMobile,
          href: `/categories/${categoryId}`,
          cutout: cutout.replace(/\.webp$/, ''),
          count: data?.count,
          posters: data?.posters ?? [],
        };
      }),
    [content, categoryData],
  );

  const categoryCountLabel = (n: number) =>
    `${n} ${n === 1 ? content.home.categories.list : content.home.categories.lists}`;

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

  // Skeleton de la section « Bibliothèque », conservé avec elle en commentaire.
  // const ListCardSmallSkeleton = () => (
  //   <div className="bg-muted/30 flex w-full items-center gap-3 overflow-hidden rounded-lg p-3 max-[414px]:bg-transparent max-[414px]:p-0">
  //     <div className="bg-muted/50 h-16 w-16 shrink-0 rounded-md max-[414px]:h-14 max-[414px]:w-14" />
  //     <div className="flex min-w-0 flex-1 flex-col gap-2">
  //       <div className="bg-muted/50 h-4 w-3/4 rounded" />
  //       <div className="bg-muted/50 h-3 w-1/3 rounded" />
  //     </div>
  //   </div>
  // );

  const UserCardSkeleton = () => (
    <div className="flex flex-col items-center gap-3 max-[749px]:gap-2">
      <div className="bg-muted/50 h-20 w-20 rounded-full max-[749px]:h-[60px] max-[749px]:w-[60px]" />
      <div className="bg-muted/50 h-4 w-24 rounded max-[749px]:h-3.5 max-[749px]:w-16" />
      <div className="bg-muted/50 h-3 w-16 rounded max-[749px]:w-12" />
    </div>
  );

  return (
    <div className="bg-background min-h-screen pb-20 max-[749px]:pb-4">
      {/*
        Section « Bibliothèque » retirée de la home : les listes personnelles
        vivent uniquement dans « Mes listes ». La home est une page
        d'exploration (tendances + contenu de la communauté). Code conservé
        en commentaire tant que la frontière n'est pas définitivement actée.

        {(myWatchlistsQuery.isPending || userWatchlists.length > 0) && (
          <Section className="pb-5">
            <SectionHeader
              title={content.home.library.title}
              subtitle={content.home.library.subtitle}
              to={mounted && user ? '/account/lists' : '/local/lists'}
              action={content.home.library.seeAll}
            />
            <div className="grid grid-cols-1 gap-3 max-[749px]:grid-cols-2 max-[414px]:gap-x-[4px] max-[414px]:gap-y-[11px] md:grid-cols-2 lg:grid-cols-4">
              {myWatchlistsQuery.isPending
                ? Array.from({ length: 4 }).map((_, i) => <ListCardSmallSkeleton key={i} />)
                : userWatchlists
                    .slice(0, 4)
                    .map((watchlist) => (
                      <ListCardSmall
                        key={watchlist.id}
                        watchlist={watchlist}
                        to={`/lists/${watchlist.id}`}
                      />
                    ))}
            </div>
          </Section>
        )}
      */}

      {/* Trending Section — ouverture de page. C'est la seule section qui
          réponde à « on regarde quoi ce soir ? », elle passe donc en premier et
          porte le h1. Desktop : rail à focus tournant (cf. TrendingRail).
          Mobile : cards paysage pleine largeur, sans rotation. */}
      <Section>
        <SectionHeader
          as="h1"
          title={content.home.trending.title}
          subtitle={content.home.trending.subtitle}
          to="/explore"
          action={content.home.trending.seeMore}
        />

        {trendingLoading ? (
          <>
            <div className="grid grid-cols-7 gap-[13px] max-[749px]:hidden max-[1099px]:grid-cols-5 max-[1099px]:[&>*:nth-child(n+5)]:hidden">
              <div className="bg-muted/40 rounded-poster col-span-2" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-muted/40 rounded-poster aspect-2/3" />
              ))}
            </div>
            <div className="-mx-4 hidden gap-3 overflow-x-auto px-4 max-[749px]:flex">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-muted/40 rounded-card aspect-[2/1] w-[280px] shrink-0" />
              ))}
            </div>
          </>
        ) : trending.length > 0 ? (
          <>
            <TrendingRail
              items={trending}
              watchlists={isAuthenticated ? userWatchlists : []}
              onOpen={handleOpenTrending}
              onAddToWatchlist={(watchlistId, item) =>
                handleAddToWatchlist(
                  watchlistId,
                  item.id.toString(),
                  item.media_type || (item.title ? 'movie' : 'tv'),
                )
              }
              onRemoveFromWatchlist={(watchlistId, item) =>
                handleRemoveFromWatchlist(watchlistId, item.id.toString())
              }
              addToWatchlistLabel={content.watchlists.addToWatchlist}
              noWatchlistLabel={content.watchlists.noWatchlist}
            />

            {/* Mobile : rail horizontal de cards paysage (backdrop), une
                seule ligne qui se swipe, edge-to-edge grâce aux -mx/px. Le +
                ouvre directement le drawer d'ajout à une liste. */}
            <div className="-mx-4 hidden gap-3 overflow-x-auto px-4 pb-1 max-[749px]:flex max-[749px]:[&::-webkit-scrollbar]:hidden max-[749px]:[scrollbar-width:none] [&>*]:w-[280px] [&>*]:shrink-0">
              {trending.slice(0, 6).map((item, index) => (
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
          </>
        ) : null}
      </Section>

      {/* Popular Watchlists Section */}
      <Section>
        <SectionHeader
          title={content.home.popularWatchlists.title}
          subtitle={content.home.popularWatchlists.subtitle}
          to="/lists"
          action={content.home.popularWatchlists.seeMore}
        />

        {publicLoading ? (
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
          // Un échec de chargement n'est pas un vide : on ne prétend plus qu'il
          // n'existe aucune liste publique quand la requête a échoué.
          <div className="border-border bg-card rounded-card border p-12 text-center">
            <Film strokeWidth={1.4} className="text-muted-foreground mx-auto h-16 w-16" />
            <p className="text-muted-foreground text-body mt-4">
              {publicQuery.isError
                ? content.home.popularWatchlists.loadError
                : content.home.popularWatchlists.noWatchlists}
            </p>
            {publicQuery.isError && (
              <button
                type="button"
                onClick={() => publicQuery.refetch()}
                className="text-label text-foreground border-border rounded-control mt-4 h-11 cursor-pointer border px-4 transition-colors hover:bg-secondary"
              >
                {content.home.popularWatchlists.retry}
              </button>
            )}
          </div>
        )}
      </Section>

      {/* Categories Section — le rangement du catalogue passe après le contenu
          lui-même (tendances) et après ce que la communauté a fabriqué. */}
      <Section>
        <SectionHeader
          title={content.home.categories.title}
          subtitle={content.home.categories.subtitle}
          to="/categories"
          action={content.home.categories.seeMore}
        />

        {/* Banc d'essai : 10 traitements de la tuile catégorie, sélectionnables
            en haut à droite comme sur le hero de la landing. Les 5 premiers
            gardent la carte à l'identique, les 5 suivants remettent la forme
            en cause. Voir CategoryShowcase. */}
        <div ref={categoriesScrollRef}>
          <CategoryShowcase tiles={categoryTiles} countLabel={categoryCountLabel} />
        </div>
      </Section>

      {/* Creators Section */}
      <Section>
        <SectionHeader
          title={content.home.creators.title}
          subtitle={content.home.creators.subtitle}
          to="/users"
          action={content.home.creators.seeMore}
        />

        {publicLoading ? (
          <div className="flex flex-wrap justify-start gap-x-6 gap-y-4 min-[750px]:[&>*]:w-[104px] max-[749px]:-mx-4 max-[749px]:flex-nowrap max-[749px]:gap-2 max-[749px]:overflow-x-auto max-[749px]:px-4 max-[749px]:pb-1 max-[749px]:[&>*]:w-[92px] max-[749px]:[&>*]:shrink-0">
            {Array.from({ length: 12 }).map((_, i) => (
              <UserCardSkeleton key={i} />
            ))}
          </div>
        ) : creators.length > 0 ? (
          // Banc d'essai : 10 traitements de la carte créateur, sélectionnables
          // au-dessus de la section. Voir CreatorShowcase.
          <div ref={creatorsScrollRef}>
            <CreatorShowcase creators={creators} content={content} />
          </div>
        ) : null}
      </Section>

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
