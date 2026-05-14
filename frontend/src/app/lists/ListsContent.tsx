'use client';

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Film } from 'lucide-react';
import { domAnimation, LazyMotion, m } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { ListCard } from '@/components/List/ListCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Pagination } from '@/components/ui/pagination';
import { useAuth } from '@/context/auth-context';
import { useScrollToTopOnMount } from '@/hooks/useScrollToTopOnMount';
import { watchlistsQueries } from '@/api/queries';
import { useLanguageStore } from '@/store/language';
import { useListPaginationStore } from '@/store/listPagination';

const PAGINATION_OPTIONS = [50, 100];
const SHOW_PAGINATION_THRESHOLD = PAGINATION_OPTIONS[0]; // pas de selecteur si <= 50

// Skeleton component
const ListCardSkeleton = () => (
  <div className="bg-muted/30 rounded-lg p-2">
    <div className="bg-muted/50 aspect-square w-full rounded-md" />
    <div className="mt-3 space-y-2">
      <div className="bg-muted/50 h-4 w-3/4 rounded" />
      <div className="bg-muted/50 h-3 w-1/2 rounded" />
    </div>
  </div>
);

function CommunityListsPageInner() {
  const { content } = useLanguageStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Pagination — préférence persistée globalement (50, 100, ou 'all')
  const [currentPage, setCurrentPage] = useState(1);
  const { watchlistsPerPage: watchlistsPerPagePref, setWatchlistsPerPage: setWatchlistsPerPagePref } =
    useListPaginationStore();

  useScrollToTopOnMount();

  // Scroll to top when page changes
  useEffect(() => {
    if (currentPage > 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const handleBackClick = () => {
    navigate({ to: '/home' as never });
  };

  // Featured public (cache 5 min)
  const publicQuery = useQuery(watchlistsQueries.publicFeatured(1000));
  const watchlists = publicQuery.data?.watchlists ?? [];
  const loading = publicQuery.isPending;

  // Mes watchlists si auth (mêmes queryKey que /home, /account/lists → cache partagé)
  const myWatchlistsQuery = useQuery({
    ...watchlistsQueries.mine(),
    enabled: !!user,
  });
  const userWatchlists = myWatchlistsQuery.data?.watchlists ?? [];

  // Convertit la pref ('all' | number) en valeur exploitable, bornée au total.
  // Bornage au total → "Tout" highlighté quand pref >= total.
  const effectiveWatchlistsPerPage = useMemo(() => {
    const prefAsNumber =
      watchlistsPerPagePref === 'all' ? Number.POSITIVE_INFINITY : watchlistsPerPagePref;
    return Math.min(prefAsNumber, watchlists.length);
  }, [watchlistsPerPagePref, watchlists.length]);

  // Paginated watchlists
  const paginatedWatchlists = useMemo(() => {
    const startIndex = (currentPage - 1) * effectiveWatchlistsPerPage;
    const endIndex = startIndex + effectiveWatchlistsPerPage;
    return watchlists.slice(startIndex, endIndex);
  }, [watchlists, currentPage, effectiveWatchlistsPerPage]);

  const totalPages = Math.ceil(watchlists.length / effectiveWatchlistsPerPage);

  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-7 pt-6.5 pb-20">
        <PageHeader
          title={content.home.communityWatchlists.title}
          subtitle={content.home.communityWatchlists.subtitle}
          backLabel={content.watchlists.back}
          onBack={handleBackClick}
        />

        {/* Watchlists Grid */}
        {loading ? (
          <div className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <ListCardSkeleton key={i} />
            ))}
          </div>
        ) : watchlists.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-6">
              {paginatedWatchlists.map(watchlist => {
                // Calculate isOwner by comparing user email with watchlist owner email
                const ownerEmail = watchlist.owner?.email || null;
                const isOwner = user?.email === ownerEmail;

                // Find this watchlist in user's watchlists to check status
                const userWatchlist = userWatchlists.find(uw => uw.id === watchlist.id);
                const isCollaborator = userWatchlist?.isCollaborator === true;
                const isSaved = userWatchlist && !userWatchlist.isOwner && !isCollaborator;

                const showSavedBadge = !isOwner && isSaved;
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
                  />
                );
              })}
            </div>

            {/* Pagination - only show if more than threshold items */}
            {watchlists.length > SHOW_PAGINATION_THRESHOLD && (
              <div className="mt-[30px]">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={effectiveWatchlistsPerPage}
                  totalItems={watchlists.length}
                  onItemsPerPageChange={newItemsPerPage => {
                    // Click sur "Tout" → on stocke 'all' pour préserver la sémantique
                    setWatchlistsPerPagePref(
                      newItemsPerPage === watchlists.length ? 'all' : newItemsPerPage
                    );
                    setCurrentPage(1);
                  }}
                  itemsPerPageOptions={PAGINATION_OPTIONS}
                />
              </div>
            )}
          </>
        ) : (
          <div className="border-border bg-card rounded-lg border p-12 text-center">
            <Film strokeWidth={1.4} className="text-muted-foreground mx-auto h-16 w-16" />
            <p className="text-muted-foreground mt-4">Aucune watchlist publique pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ListsContent() {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <CommunityListsPageInner />
      </m.div>
    </LazyMotion>
  );
}
