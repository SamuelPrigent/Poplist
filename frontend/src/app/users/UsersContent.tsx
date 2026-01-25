'use client';

import { ArrowLeft } from 'lucide-react';
import { domAnimation, LazyMotion, m } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Section } from '@/components/layout/Section';
import { Pagination } from '@/components/ui/pagination';
import { UserCard } from '@/components/User/UserCard';
import { watchlistAPI, type Watchlist } from '@/lib/api-client';
import { useLanguageStore } from '@/store/language';

const ITEMS_PER_PAGE_DEFAULT = 40;

interface Creator {
  id: string;
  username: string;
  avatarUrl?: string;
  listCount: number;
}

export function UsersContent() {
  const { content } = useLanguageStore();
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_DEFAULT);

  const fetchCreators = useCallback(async () => {
    try {
      // Get public watchlists with higher limit to aggregate creators
      const publicData = await watchlistAPI.getPublicWatchlists(500);
      const watchlists: Watchlist[] = publicData.watchlists || [];

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

      // Sort by list count (descending)
      const sortedCreators = Array.from(creatorsMap.values()).sort(
        (a, b) => b.listCount - a.listCount
      );

      setCreators(sortedCreators);
    } catch (error) {
      console.error('Failed to fetch creators:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02,
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
      <Section className="pt-6">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="text-muted-foreground mb-6 flex cursor-pointer items-center gap-2 text-sm transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{content.watchlists.back}</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">{content.home.creators.title}</h1>
          <p className="text-muted-foreground mt-2 text-lg">{content.home.creators.subtitle}</p>
        </div>

        {/* Creators grid */}
        {loading ? (
          <div className="text-muted-foreground">{content.watchlists.loading}</div>
        ) : creators.length > 0 ? (
          <>
            <LazyMotion features={domAnimation}>
              <m.div
                key={`page-${currentPage}`}
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
              >
                {paginatedCreators.map(creator => (
                  <m.div key={creator.id} variants={itemVariants}>
                    <UserCard user={creator} listCount={creator.listCount} content={content} />
                  </m.div>
                ))}
              </m.div>
            </LazyMotion>

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
          <div className="text-muted-foreground py-12 text-center">
            Aucun créateur trouvé
          </div>
        )}
      </Section>
    </div>
  );
}
