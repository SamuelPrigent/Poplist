'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { PageFade } from '@/components/ui/PageFade';
import { useEffect, useMemo, useState } from 'react';
import { Section } from '@/components/layout/Section';
import { Pagination } from '@/components/ui/pagination';
import { CreatorTasteCard } from '@/components/User/CreatorTasteCard';
import { UserCard } from '@/components/User/UserCard';
import { useScrollToTopOnMount } from '@/hooks/useScrollToTopOnMount';
import { watchlistsQueries } from '@/api/queries';
import { useLanguageStore } from '@/store/language';

const ITEMS_PER_PAGE_DEFAULT = 40;

// Skeleton component
const UserCardSkeleton = () => (
  <div className="flex flex-col gap-3">
    <div className="bg-muted/40 rounded-poster h-24 w-28 max-[749px]:h-[60px] max-[749px]:w-[60px] max-[749px]:rounded-full" />
    <div className="flex items-center gap-2 max-[749px]:flex-col max-[749px]:gap-1">
      <div className="bg-muted/40 h-9 w-9 rounded-full max-[749px]:hidden" />
      <div className="flex flex-col gap-1 max-[749px]:items-center">
        <div className="bg-muted/40 h-3 w-16 rounded" />
        <div className="bg-muted/40 h-3 w-12 rounded" />
      </div>
    </div>
  </div>
);

interface Creator {
  id: string;
  username: string;
  avatarUrl?: string;
  listCount: number;
  /** Affiches de ses listes publiques — la carte les montre en éventail. */
  posters: string[];
}

function UsersContentInner() {
  const { content } = useLanguageStore();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_DEFAULT);

  useScrollToTopOnMount();

  // Cache 5 min, partagé avec /home et /landing (mêmes queryOptions).
  const publicQuery = useQuery(watchlistsQueries.publicFeatured(500));
  const loading = publicQuery.isPending;

  const creators = useMemo<Creator[]>(() => {
    const creatorsMap = new Map<string, Creator>();
    const postersOf = (wl: { items?: { posterPath?: string | null }[] }) =>
      (wl.items ?? [])
        .map((item) => item.posterPath)
        .filter((path): path is string => !!path)
        .slice(0, 3);

    for (const wl of publicQuery.data?.watchlists ?? []) {
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
      .map((creator) => ({ ...creator, posters: creator.posters.slice(0, 3) }));
  }, [publicQuery.data]);

  // Scroll to top when page changes
  useEffect(() => {
    if (currentPage > 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  // Paginated creators
  const paginatedCreators = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return creators.slice(startIndex, endIndex);
  }, [creators, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(creators.length / itemsPerPage);

  return (
    <div className="bg-background min-h-screen pb-20 max-[749px]:pb-4">
      <Section className="pt-6 max-[749px]:pt-3">
        {/* Back button */}
        <button
          type="button"
          onClick={() => window.history.back()}
          className="text-muted-foreground mb-6 flex cursor-pointer items-center gap-2 text-sm transition-colors hover:text-white max-[749px]:mb-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{content.watchlists.back}</span>
        </button>

        {/* Header — mêmes tailles que PageHeader (page /categories) */}
        <div className="mb-8 max-[749px]:mb-6">
          <h1 className="text-headline text-foreground mb-2">
            {content.home.creators.title}
          </h1>
          <p className="text-muted-foreground text-base max-[749px]:text-sm">
            {content.home.creators.subtitle}
          </p>
        </div>

        {/* Creators grid */}
        {loading ? (
          <div className="grid grid-cols-7 gap-x-6 gap-y-8 max-[1099px]:grid-cols-5 max-[749px]:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <UserCardSkeleton key={i} />
            ))}
          </div>
        ) : creators.length > 0 ? (
          <>
            {/* Desktop : la carte « Goût » en version large, sur la même
                densité qu'avant (7 par ligne). Ce sont les affiches et le nom
                qui ont grandi, pas la grille qui s'est desserrée. */}
            <div className="grid grid-cols-7 gap-x-6 gap-y-8 max-[1099px]:grid-cols-5 max-[749px]:hidden">
              {paginatedCreators.map(creator => (
                <CreatorTasteCard
                  key={creator.id}
                  creator={creator}
                  content={content}
                  size="md"
                  className="w-full"
                />
              ))}
            </div>

            {/* Mobile : grille de 3 avatars. L'éventail d'affiches ne tient
                pas dans une colonne de cette largeur. */}
            <div className="hidden grid-cols-3 gap-x-4 gap-y-6 max-[749px]:grid">
              {paginatedCreators.map(creator => (
                <UserCard
                  key={creator.id}
                  user={creator}
                  listCount={creator.listCount}
                  content={content}
                  carousel
                />
              ))}
            </div>

            {/* Pagination - only show if more than 40 items */}
            {creators.length > ITEMS_PER_PAGE_DEFAULT && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={creators.length}
                onItemsPerPageChange={newItemsPerPage => {
                  setItemsPerPage(newItemsPerPage);
                  setCurrentPage(1);
                }}
                itemsPerPageOptions={[40, 80]}
              />
            )}
          </>
        ) : (
          <div className="text-muted-foreground py-12 text-center">Aucun créateur trouvé</div>
        )}
      </Section>
    </div>
  );
}

export function UsersContent() {
  return (
    <PageFade>
        <UsersContentInner />
    </PageFade>
  );
}
