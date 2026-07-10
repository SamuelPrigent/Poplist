'use client';

import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { domAnimation, LazyMotion, m } from 'motion/react';
import { ListCard } from '@/components/List/ListCard';
import { ListCardGrid } from '@/components/List/ListCardGrid';
import { UserProfileHeader } from '@/components/User/UserProfileHeader';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { usersQueries } from '@/api/queries';
import { useLanguageStore } from '@/store/language';

// Skeleton components
const ListCardSkeleton = () => (
  <div className="bg-muted/30 rounded-lg p-2 max-[749px]:rounded-none max-[749px]:bg-transparent max-[749px]:p-0">
    <div className="bg-muted/50 aspect-square w-full rounded-md max-[749px]:rounded" />
    <div className="mt-3 space-y-2 max-[749px]:mt-2">
      <div className="bg-muted/50 h-4 w-3/4 rounded" />
      <div className="bg-muted/50 h-3 w-1/2 rounded max-[749px]:hidden" />
    </div>
  </div>
);

const ProfileHeaderSkeleton = () => (
  <div className="relative h-[200px] w-full overflow-hidden bg-muted/20">
    <div className="container mx-auto flex h-full w-(--sectionWidth) max-w-(--maxWidth) items-end px-12 pb-6 max-[749px]:px-4">
      <div className="flex items-center gap-4">
        <div className="bg-muted/50 h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <div className="bg-muted/50 h-6 w-32 rounded" />
          <div className="bg-muted/50 h-4 w-24 rounded" />
        </div>
      </div>
    </div>
  </div>
);

function UserProfilePageInner() {
  const params = useParams({ strict: false }) as { username: string };
  const navigate = useNavigate();
  const { content } = useLanguageStore();

  const username = params.username as string;

  // Query hydratée depuis le cache TQ par le loader SSR (setQueryData) puis
  // sérialisée via le dehydrate/hydrate du router → zéro flicker.
  const { data, isPending, isError } = useQuery({
    ...usersQueries.byUsername(username),
    enabled: !!username,
    retry: false,
  });

  const user = data?.user ?? null;
  const watchlists = data?.watchlists ?? [];
  const totalPublicWatchlists = data?.totalPublicWatchlists ?? 0;

  if (isPending) {
    return (
      <div className="bg-background min-h-screen pb-24 w-(--sectionWidth) max-w-(--maxWidth) px-12 max-[749px]:px-4">
        <ProfileHeaderSkeleton />
        <div className="container mx-auto min-h-[75vh] w-(--sectionWidth) max-w-(--maxWidth) px-12 py-8 pt-10 pb-16 max-[749px]:min-h-0 max-[749px]:px-4 max-[749px]:pb-6">
          <div className="bg-muted/50 mb-7 h-7 w-40 rounded" />
          <ListCardGrid>
            {Array.from({ length: 12 }).map((_, i) => (
              <ListCardSkeleton key={i} />
            ))}
          </ListCardGrid>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-12 py-8 max-[749px]:px-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia />
            <EmptyTitle>{content.userProfile?.notFound || 'Utilisateur introuvable'}</EmptyTitle>
            <EmptyDescription>
              {content.userProfile?.notFoundDescription ||
                "Cet utilisateur n'existe pas ou a été supprimé."}
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => navigate({ to: '/home' as never })}>
            {content.userProfile?.backToHome || "Retour à l'accueil"}
          </Button>
        </Empty>
      </div>
    );
  }

  // User exists but has no public watchlists
  if (totalPublicWatchlists === 0) {
    return (
      <div className="bg-background min-h-screen pb-12">
        <UserProfileHeader
          user={user}
          totalPublicWatchlists={totalPublicWatchlists}
          hasWatchlists={false}
        />

        <div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-12 py-12 max-[749px]:px-4">
          <Empty>
            <EmptyHeader>
              <EmptyMedia />
              <EmptyTitle>
                {content.userProfile?.noPublicWatchlists || 'Aucune liste publique'}
              </EmptyTitle>
              <EmptyDescription>
                {content.userProfile?.noPublicWatchlistsDescription ||
                  "Cet utilisateur n'a pas encore de liste publique."}
              </EmptyDescription>
            </EmptyHeader>
            <Button onClick={() => navigate({ to: '/home' as never })}>
              {content.userProfile?.backToHome || "Retour à l'accueil"}
            </Button>
          </Empty>
        </div>
      </div>
    );
  }

  // User has public watchlists
  return (
    <div className="bg-background min-h-screen pb-24 max-[749px]:pb-4">
      <UserProfileHeader
        user={user}
        totalPublicWatchlists={totalPublicWatchlists}
        hasWatchlists={true}
      />

      <div className="container mx-auto min-h-[75vh] w-(--sectionWidth) max-w-(--maxWidth) px-12 py-8 pt-10 pb-16 max-[749px]:min-h-0 max-[749px]:px-4 max-[749px]:pb-6">
        <h2 className="mb-7 text-2xl font-semibold text-white">
          {content.userProfile?.publicWatchlists || 'Listes publiques'}
        </h2>

        <ListCardGrid>
          {watchlists.map((watchlist) => (
            <ListCard
              key={watchlist.id}
              watchlist={watchlist}
              content={content}
              href={`/lists/${watchlist.id}`}
              showSavedBadge={false}
              showCollaborativeBadge={false}
              showMenu={false}
            />
          ))}
        </ListCardGrid>
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <UserProfilePageInner />
      </m.div>
    </LazyMotion>
  );
}
