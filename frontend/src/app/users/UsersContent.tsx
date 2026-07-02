'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { domAnimation, LazyMotion, m } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Section } from '@/components/layout/Section';
import { Pagination } from '@/components/ui/pagination';
import { UserCard } from '@/components/User/UserCard';
import { useScrollToTopOnMount } from '@/hooks/useScrollToTopOnMount';
import { watchlistsQueries } from '@/api/queries';
import { useLanguageStore } from '@/store/language';

const ITEMS_PER_PAGE_DEFAULT = 40;

// Skeleton component
const UserCardSkeleton = () => (
  <div className="bg-muted/30 flex flex-col items-center gap-3 rounded-lg p-5">
    <div className="bg-muted/50 h-20 w-20 rounded-full" />
    <div className="bg-muted/50 h-4 w-24 rounded" />
    <div className="bg-muted/50 h-3 w-16 rounded" />
  </div>
);

interface Creator {
  id: string;
  username: string;
  avatarUrl?: string;
  listCount: number;
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
    for (const wl of publicQuery.data?.watchlists ?? []) {
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
    return Array.from(creatorsMap.values()).sort((a, b) => b.listCount - a.listCount);
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
    <div className="bg-background min-h-screen pb-20">
      <Section className="pt-6">
        {/* Back button */}
        <button
          type="button"
          onClick={() => window.history.back()}
          className="text-muted-foreground mb-6 flex cursor-pointer items-center gap-2 text-sm transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{content.watchlists.back}</span>
        </button>

        {/* Header — mêmes tailles que PageHeader (page /categories) */}
        <div className="mb-8 max-[749px]:mb-6">
          <h1 className="mb-2 text-4xl font-bold text-white max-[749px]:text-3xl">
            {content.home.creators.title}
          </h1>
          <p className="text-muted-foreground text-base max-[749px]:text-sm">
            {content.home.creators.subtitle}
          </p>
        </div>

        {/* Creators grid */}
        {loading ? (
          <div className="grid grid-cols-3 gap-3 max-[749px]:grid-cols-2 max-[749px]:gap-2 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <UserCardSkeleton key={i} />
            ))}
          </div>
        ) : creators.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-[11px] max-[749px]:grid-cols-2 max-[749px]:gap-2 md:grid-cols-4 lg:grid-cols-6">
              {paginatedCreators.map(creator => (
                <UserCard
                  key={creator.id}
                  user={creator}
                  listCount={creator.listCount}
                  content={content}
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
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <UsersContentInner />
      </m.div>
    </LazyMotion>
  );
}
