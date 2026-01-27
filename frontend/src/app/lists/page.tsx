'use client';

import { Film } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ListCard } from '@/components/List/ListCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageReveal } from '@/components/ui/PageReveal';
import { Pagination } from '@/components/ui/pagination';
import { useAuth } from '@/context/auth-context';
import { useRegisterSection } from '@/hooks/usePageReady';
import { type Watchlist, watchlistAPI } from '@/lib/api-client';
import { useLanguageStore } from '@/store/language';

const ITEMS_PER_PAGE_DEFAULT = 30; // 6 rows of 5 cards

function CommunityListsPageInner() {
  const { content } = useLanguageStore();
  const { user } = useAuth();
  const router = useRouter();
  const { markReady } = useRegisterSection('community-lists');

  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [userWatchlists, setUserWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_DEFAULT);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Scroll to top when page changes
  useEffect(() => {
    if (currentPage > 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const handleBackClick = () => {
    router.push('/home');
    window.scrollTo(0, 0);
  };

  const fetchWatchlists = useCallback(async () => {
    try {
      // Fetch all public watchlists with higher limit for community page
      const data = await watchlistAPI.getPublicWatchlists(1000);
      setWatchlists(data.watchlists || []);
    } catch (error) {
      console.error('Failed to fetch community watchlists:', error);
    } finally {
      setLoading(false);
      markReady();
    }
  }, [markReady]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch public watchlists
      await fetchWatchlists();

      // Fetch user's watchlists if authenticated
      if (user) {
        try {
          const userData = await watchlistAPI.getMine();
          setUserWatchlists(userData.watchlists || []);
        } catch (error) {
          console.error('Failed to fetch user watchlists:', error);
        }
      }
    };

    fetchData();
  }, [user, fetchWatchlists]);

  // Paginated watchlists
  const paginatedWatchlists = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return watchlists.slice(startIndex, endIndex);
  }, [watchlists, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(watchlists.length / itemsPerPage);

  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 pt-6.5 pb-20">
        <PageHeader
          title={content.home.communityWatchlists.title}
          subtitle={content.home.communityWatchlists.subtitle}
          backLabel={content.watchlists.back}
          onBack={handleBackClick}
        />

        {/* Watchlists Grid */}
        {loading ? null : watchlists.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {paginatedWatchlists.map(watchlist => {
                // Calculate isOwner by comparing user email with watchlist owner email
                const ownerEmail = watchlist.owner?.email || null;
                const isOwner = user?.email === ownerEmail;

                // Find this watchlist in user's watchlists to check status
                const userWatchlist = userWatchlists.find(uw => uw.id === watchlist.id);
                const isCollaborator = userWatchlist?.isCollaborator === true;
                const isSaved = userWatchlist && !userWatchlist.isOwner && !isCollaborator;

                const showSavedBadge = !isOwner && isSaved;
                const showCollaborativeBadge = isCollaborator;

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

            {/* Pagination - only show if more than 30 items */}
            {watchlists.length > ITEMS_PER_PAGE_DEFAULT && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={watchlists.length}
                onItemsPerPageChange={newItemsPerPage => {
                  setItemsPerPage(newItemsPerPage);
                  setCurrentPage(1);
                }}
                itemsPerPageOptions={[30, 60]}
              />
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

export default function CommunityListsPage() {
  return (
    <PageReveal timeout={4000} minLoadingTime={200} revealDuration={0.5}>
      <CommunityListsPageInner />
    </PageReveal>
  );
}
