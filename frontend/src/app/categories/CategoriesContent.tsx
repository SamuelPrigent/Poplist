'use client';

import { useQueries } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { domAnimation, LazyMotion, m } from 'motion/react';
import { useMemo } from 'react';
import { ListCardGenre } from '@/components/List/ListCardGenre';
import { PageHeader } from '@/components/layout/PageHeader';
import { useScrollToTopOnMount } from '@/hooks/useScrollToTopOnMount';
import {
  createPlaceholderItem,
  type Watchlist,
  type WatchlistItem,
} from '@/api';
import { watchlistsQueries } from '@/api/queries';
import { useLanguageStore } from '@/store/language';
import { GENRE_CATEGORIES, getCategoryInfo } from '@/types/categories';

function CategoriesPageInner() {
  const { content } = useLanguageStore();
  const navigate = useNavigate();

  useScrollToTopOnMount();

  // N queries en parallèle via useQueries. Cache 5 min, partagé avec /home
  // (mêmes queryOptions byGenre).
  const countQueries = useQueries({
    queries: GENRE_CATEGORIES.map(genreId => ({
      ...watchlistsQueries.byGenre(genreId),
      select: (data: { watchlists: Watchlist[] }) => data.watchlists?.length ?? 0,
    })),
  });
  const loading = countQueries.some(q => q.isPending);
  const categoryCounts = useMemo<Record<string, number>>(() => {
    return GENRE_CATEGORIES.reduce(
      (acc, genreId, i) => {
        acc[genreId] = countQueries[i]?.data ?? 0;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [countQueries]);

  const handleBackClick = () => {
    navigate({ to: '/home' as never });
  };

  // max-[749px]:min-h-0 : sans ça le min-h-screen étire la page au-delà du
  // contenu (8 cards < viewport) → gros vide au-dessus de la bottom nav.
  return (
    <div className="bg-background min-h-screen pb-20 max-[749px]:min-h-0 max-[749px]:pb-0">
      <div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-7 pt-6.5 pb-20 max-[749px]:px-4 max-[749px]:pb-10">
        <PageHeader
          title={content.categories.title}
          subtitle={content.categories.subtitle}
          backLabel={content.watchlists.back}
          onBack={handleBackClick}
        />

        {/* Categories Grid */}
        {loading ? null : (
          <LazyMotion features={domAnimation}>
            <m.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0,
                    delayChildren: 0,
                  },
                },
              }}
              className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-4 max-[749px]:grid-cols-2 max-[749px]:gap-3 md:grid-cols-4 lg:grid-cols-6"
            >
              {GENRE_CATEGORIES.map((categoryId, index) => {
                const category = getCategoryInfo(categoryId, content);
                const itemCount = categoryCounts[categoryId] || 0;
                const placeholderTimestamp = '1970-01-01T00:00:00.000Z';
                const placeholderItems: WatchlistItem[] = Array.from(
                  { length: itemCount },
                  (_, idx) =>
                    createPlaceholderItem({
                      tmdbId: idx,
                      title: category.name,
                      mediaType: 'movie',
                      addedAt: placeholderTimestamp,
                    })
                );

                const mockWatchlist: Watchlist = {
                  id: categoryId,
                  ownerId: 'featured',
                  thumbnailUrl: null,
                  dominantColor: null,
                  genres: [],
                  imageUrl: null,
                  owner: {
                    id: 'featured',
                    email: 'featured@poplist.app',
                    username: 'Poplist',
                    avatarUrl: null,
                  },
                  name: category.name,
                  description: category.description,
                  isPublic: true,
                  collaborators: [],
                  items: placeholderItems,
                  createdAt: placeholderTimestamp,
                  updatedAt: placeholderTimestamp,
                  likedBy: [],
                };

                return (
                  <m.div
                    key={categoryId}
                    variants={{
                      hidden: { opacity: 0, scale: 0.95 },
                      visible: {
                        opacity: 1,
                        scale: 1,
                        transition: { duration: 0.2 },
                      },
                    }}
                  >
                    <ListCardGenre
                      watchlist={mockWatchlist}
                      content={content}
                      href={`/categories/${categoryId}`}
                      genreId={categoryId}
                      titleMobile={category.nameMobile}
                      showOwner={false}
                      index={index}
                    />
                  </m.div>
                );
              })}
            </m.div>
          </LazyMotion>
        )}
      </div>
    </div>
  );
}

export default function CategoriesContent() {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <CategoriesPageInner />
      </m.div>
    </LazyMotion>
  );
}
