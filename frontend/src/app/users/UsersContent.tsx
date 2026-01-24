'use client';

import { ArrowLeft } from 'lucide-react';
import { domAnimation, LazyMotion, m } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Section } from '@/components/layout/Section';
import { UserCard } from '@/components/User/UserCard';
import { watchlistAPI, type Watchlist } from '@/lib/api-client';
import { useLanguageStore } from '@/store/language';

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
          <LazyMotion features={domAnimation}>
            <m.div
              key={creators.map(c => c.id).join('-')}
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
            >
              {creators.map(creator => (
                <m.div key={creator.id} variants={itemVariants}>
                  <UserCard user={creator} listCount={creator.listCount} content={content} />
                </m.div>
              ))}
            </m.div>
          </LazyMotion>
        ) : (
          <div className="text-muted-foreground py-12 text-center">
            Aucun créateur trouvé
          </div>
        )}
      </Section>
    </div>
  );
}
