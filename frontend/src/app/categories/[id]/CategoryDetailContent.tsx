'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { ArrowLeft, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { domAnimation, LazyMotion, m } from 'motion/react';
import { useMemo } from 'react';
import { ListCard } from '@/components/List/ListCard';
import { ListCardGrid } from '@/components/List/ListCardGrid';
import { useAuth } from '@/context/auth-context';
import { useScrollToTopOnMount } from '@/hooks/useScrollToTopOnMount';
import { watchlistsQueries } from '@/api/queries';
import { useLanguageStore } from '@/store/language';
import { type GenreCategory, getCategoryInfo } from '@/types/categories';

// Unified header color - blue for all categories
const CATEGORY_HEADER_COLOR = '#11314475';

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

function CategoryDetailPageInner() {
  const params = useParams({ strict: false }) as { id: string };
  const id = params.id as string;
  const { content } = useLanguageStore();
  const { user } = useAuth();

  const categoryInfo = id ? getCategoryInfo(id as GenreCategory, content) : null;

  useScrollToTopOnMount();

  // Watchlists par genre. Cache 5 min, partagé avec /home et /categories.
  const genreQuery = useQuery({
    ...watchlistsQueries.byGenre(id),
    enabled: !!id,
  });
  const loading = genreQuery.isPending;
  const watchlists = useMemo(() => {
    return [...(genreQuery.data?.watchlists ?? [])].sort(
      (a, b) => (b.likedBy?.length || 0) - (a.likedBy?.length || 0),
    );
  }, [genreQuery.data]);

  // Mes watchlists pour les badges saved/collab. Cache partagé.
  const myQuery = useQuery({
    ...watchlistsQueries.mine(),
    enabled: !!user,
  });
  const userWatchlists = myQuery.data?.watchlists ?? [];

  if (!categoryInfo) {
    return (
      <div className="bg-background min-h-screen pb-20 max-[749px]:pb-4">
        <div className="container mx-auto max-w-(--maxWidth) px-4 py-12">
          <div className="border-border bg-card rounded-lg border p-12 text-center">
            <p className="text-muted-foreground">Catégorie non trouvée</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-20 max-[749px]:pb-4">
      {/* Header with subtle gradient */}
      <div className="relative w-full">
        <div
          className="relative h-[165px] w-full overflow-hidden max-[749px]:h-[80px]"
          style={{
            background: `linear-gradient(to bottom, ${CATEGORY_HEADER_COLOR}, transparent 60%)`,
          }}
        >
          {/* Content */}
          <div className="relative container mx-auto flex h-full w-(--sectionWidth) max-w-(--maxWidth) flex-col justify-start px-10 pt-[1.7rem] max-[749px]:px-4 max-[749px]:pt-[16px] max-[749px]:mb-3">
            {/* Back Button — même variant que le PageHeader (/categories) pour
                une couleur identique */}
            <div className="mb-4 max-[749px]:mb-1">
              <Button variant="nav-link" size="auto" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span>{content.watchlists.back}</span>
              </Button>
            </div>

            {/* Title and Description */}
            <div>
              <h1 className="mb-2 text-5xl font-bold text-white drop-shadow-lg max-[749px]:text-3xl">
                {categoryInfo.name}
              </h1>
              <p className="text-muted-foreground max-w-2xl text-base max-[749px]:hidden">
                {categoryInfo.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Watchlists section without gradient */}
      <div className="relative w-full">
        <div className="container mx-auto min-h-[75vh] w-(--sectionWidth) max-w-(--maxWidth) px-10 py-4 max-[749px]:min-h-0 max-[749px]:px-4">
          {/* Watchlists Grid */}
          {loading ? (
            <ListCardGrid>
              {Array.from({ length: 10 }).map((_, i) => (
                <ListCardSkeleton key={i} />
              ))}
            </ListCardGrid>
          ) : watchlists.length > 0 ? (
            <ListCardGrid>
              {watchlists.map((watchlist) => {
                // Calculate isOwner by comparing user email with watchlist owner email
                const ownerEmail = watchlist.owner?.email || null;
                const isOwner = user?.email === ownerEmail;

                // Check if this watchlist is in user's watchlists
                const userWatchlist = userWatchlists.find((uw) => uw.id === watchlist.id);
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
            </ListCardGrid>
          ) : (
            <div className="border-border bg-card rounded-lg border p-12 text-center">
              <Film strokeWidth={1.4} className="text-muted-foreground mx-auto h-16 w-16" />
              <p className="text-muted-foreground mt-4">
                Aucune watchlist dans cette catégorie pour le moment
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CategoryDetailContent() {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <CategoryDetailPageInner />
      </m.div>
    </LazyMotion>
  );
}
