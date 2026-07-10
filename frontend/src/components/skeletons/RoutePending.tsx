'use client';

import { ListCardGrid } from '@/components/List/ListCardGrid';

/**
 * Skeletons de route (`pendingComponent`) affichés pendant qu'un loader tarde
 * en navigation client (réseau lent). Le router ne les montre qu'après
 * `defaultPendingMs` (100 ms) : sur une bonne connexion / cache hit, ils ne
 * flashent jamais ; sur 4G lente, l'écran bascule immédiatement au lieu de
 * rester figé sur l'ancienne page.
 */

function CardSkeleton() {
  return (
    <div className="bg-muted/30 rounded-lg p-2 max-[749px]:rounded-none max-[749px]:bg-transparent max-[749px]:p-0">
      <div className="bg-muted/50 aspect-square w-full animate-pulse rounded-md max-[749px]:rounded" />
      <div className="mt-3 space-y-2 max-[749px]:mt-2">
        <div className="bg-muted/50 h-4 w-3/4 animate-pulse rounded" />
        <div className="bg-muted/50 h-3 w-1/2 animate-pulse rounded max-[749px]:hidden" />
      </div>
    </div>
  );
}

function TitleSkeleton() {
  return <div className="bg-muted/50 mb-8 h-8 w-44 animate-pulse rounded max-[749px]:mb-5" />;
}

/**
 * Skeleton générique « titre + grille de cards » : convient à /lists,
 * /account/lists, /categories/$id, /user/$username… Utilisé comme
 * `defaultPendingComponent` du router.
 */
export function CardGridPending() {
  return (
    <div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 pt-11 pb-8 max-[749px]:pt-7">
      <TitleSkeleton />
      <ListCardGrid>
        {Array.from({ length: 12 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </ListCardGrid>
    </div>
  );
}

/** Skeleton /explore : titre + rangées de filtres + grille de posters 2:3. */
export function ExplorePending() {
  return (
    <div className="container mx-auto px-4 py-8 max-[749px]:py-4">
      <div className="bg-muted/50 mb-2 h-9 w-40 animate-pulse rounded" />
      <div className="bg-muted/40 mb-7 h-4 w-64 animate-pulse rounded max-[749px]:mb-4" />
      <div className="mb-3 flex gap-3 max-[749px]:gap-2">
        <div className="bg-muted/40 h-9 w-44 animate-pulse rounded-md max-[749px]:w-1/2" />
        <div className="bg-muted/40 h-9 w-44 animate-pulse rounded-md max-[749px]:w-1/2" />
      </div>
      <div className="mb-8 flex gap-2 min-[750px]:hidden">
        <div className="bg-muted/40 h-9 flex-1 animate-pulse rounded-lg" />
        <div className="bg-muted/40 h-9 flex-1 animate-pulse rounded-lg" />
      </div>
      <div className="mt-11 grid grid-cols-3 gap-1.75 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-muted/40 aspect-2/3 animate-pulse rounded-lg max-[749px]:rounded-md" />
        ))}
      </div>
    </div>
  );
}

/** Skeleton /home : en-têtes de sections + cards horizontales + grille. */
export function HomePending() {
  return (
    <div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 pt-11 pb-8 max-[749px]:pt-7">
      <div className="bg-muted/50 mb-[19px] h-7 w-40 animate-pulse rounded" />
      <div className="mb-10 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-muted/30 aspect-2/1 w-full animate-pulse rounded-xl min-[750px]:hidden" />
        ))}
        <div className="hidden gap-4 min-[750px]:grid min-[750px]:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted/30 aspect-2/3 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
      <div className="bg-muted/50 mb-[19px] h-7 w-52 animate-pulse rounded" />
      <ListCardGrid>
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </ListCardGrid>
    </div>
  );
}

/** Skeleton /lists/$id : cover (centrée sur mobile) + titre + rows d'items. */
export function ListDetailPending() {
  return (
    <div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 pt-8 max-[749px]:pt-[16px]">
      <div className="flex flex-col gap-6 md:flex-row md:items-end">
        <div className="bg-muted/40 h-48 w-48 shrink-0 animate-pulse rounded-xl max-[749px]:self-center" />
        <div className="flex flex-1 flex-col justify-end space-y-4">
          <div className="bg-muted/50 h-9 w-2/3 animate-pulse rounded max-[749px]:h-7" />
          <div className="bg-muted/40 h-4 w-40 animate-pulse rounded" />
        </div>
      </div>
      <div className="mt-10 space-y-0 max-[749px]:mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-border/60 flex items-center gap-3 border-t py-3 first:border-t-0">
            <div className="bg-muted/40 h-20 w-14 shrink-0 animate-pulse rounded" />
            <div className="flex-1 space-y-2">
              <div className="bg-muted/50 h-4 w-1/2 animate-pulse rounded" />
              <div className="bg-muted/40 h-3 w-1/3 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
