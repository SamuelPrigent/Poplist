'use client';

import { useQueries } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { domAnimation, LazyMotion, m } from 'motion/react';
import { PageFade } from '@/components/ui/PageFade';
import { useMemo } from 'react';
import { CATEGORY_VISUALS } from '@/components/List/ListCardGenre';
import { CategoryList, type CategoryTile } from '@/components/List/CategoryList';
import { categoryPosterPool, dispatchCategoryPosters } from '@/lib/categoryPosters';
import { PageHeader } from '@/components/layout/PageHeader';
import { useScrollToTopOnMount } from '@/hooks/useScrollToTopOnMount';
import type { Watchlist } from '@/api';
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
      select: (data: { watchlists: Watchlist[] }) => ({
        count: data.watchlists?.length ?? 0,
        // Même vivier que la home : les listes de la catégorie en tourniquet
        // (cf. lib/categoryPosters). La répartition se fait dans le memo.
        pool: categoryPosterPool(data.watchlists ?? []),
      }),
    })),
  });
  const loading = countQueries.some(q => q.isPending);
  const tiles = useMemo<CategoryTile[]>(() => {
    const pools: Record<string, string[] | undefined> = {};
    GENRE_CATEGORIES.forEach((genreId, i) => {
      pools[genreId] = countQueries[i]?.data?.pool;
    });
    const dispatched = dispatchCategoryPosters(GENRE_CATEGORIES, pools);

    return GENRE_CATEGORIES.map((categoryId, i) => {
      const info = getCategoryInfo(categoryId, content);
      const data = countQueries[i]?.data;
      const cutout = CATEGORY_VISUALS[categoryId]?.cutout ?? CATEGORY_VISUALS.movies.cutout;
      return {
        id: categoryId,
        name: info.name,
        nameMobile: info.nameMobile,
        href: `/categories/${categoryId}`,
        cutout: cutout.replace(/\.webp$/, ''),
        count: data?.count,
        posters: dispatched[categoryId] ?? [],
      };
    });
  }, [content, countQueries]);

  const countLabel = (n: number) =>
    `${n} ${n === 1 ? content.home.categories.list : content.home.categories.lists}`;

  const handleBackClick = () => {
    navigate({ to: '/home' as never });
  };

  // max-[749px]:min-h-0 : sans ça le min-h-screen étire la page au-delà du
  // contenu (8 cards < viewport) → gros vide au-dessus de la bottom nav.
  return (
    <div className="bg-background min-h-screen pb-20 max-[749px]:min-h-0 max-[749px]:pb-0">
      <div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-7 pt-6.5 pb-20 max-[749px]:px-4 max-[749px]:pt-3 max-[749px]:pb-10">
        <PageHeader
          title={content.categories.title}
          subtitle={content.categories.subtitle}
          backLabel={content.watchlists.back}
          onBack={handleBackClick}
          hideSubtitleOnMobile
        />

        {/* Même affichage que la section « Listes par catégorie » de la home :
            les deux endroits parlent le même langage. */}
        {loading ? null : (
          <LazyMotion features={domAnimation}>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <CategoryList tiles={tiles} countLabel={countLabel} />
            </m.div>
          </LazyMotion>
        )}
      </div>
    </div>
  );
}

export default function CategoriesContent() {
  return (
    <PageFade>
        <CategoriesPageInner />
    </PageFade>
  );
}
