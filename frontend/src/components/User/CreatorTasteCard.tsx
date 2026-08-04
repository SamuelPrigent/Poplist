'use client';

import { User } from 'lucide-react';
import { Img as Image } from '@/components/ui/Img';
import { Link } from '@/components/ui/Link';
import { cn } from '@/lib/cn';
import { getTMDBImageUrl } from '@/lib/utils';

export interface CreatorTile {
  id: string;
  username: string;
  avatarUrl?: string;
  listCount: number;
  /** Affiches tirées de ses listes publiques : ce qu'il curate, pas juste son nom. */
  posters: string[];
  /**
   * Une couverture par liste publique, URL déjà résolue (image uploadée si
   * elle existe, sinon la première affiche de la liste). Sert aux cartes qui
   * représentent le créateur par ses listes et non par des affiches en vrac.
   */
  listCovers?: string[];
}

export type CreatorContent = { userProfile: { watchlist: string; watchlists: string } };

export const creatorCountLabel = (creator: CreatorTile, content: CreatorContent) =>
  `${creator.listCount} ${
    creator.listCount === 1 ? content.userProfile.watchlist : content.userProfile.watchlists
  }`;

export const creatorHref = (creator: CreatorTile) => `/user/${creator.username}`;

export function CreatorAvatar({
  creator,
  className,
}: {
  creator: CreatorTile;
  className?: string;
}) {
  return (
    <div className={cn('bg-secondary relative shrink-0 overflow-hidden rounded-full', className)}>
      {creator.avatarUrl ? (
        <Image src={creator.avatarUrl} alt="" fill sizes="96px" className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <User className="text-muted-foreground h-1/2 w-1/2" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}

export function CreatorPoster({ path, className }: { path: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getTMDBImageUrl(path, 'w185') ?? ''}
      alt=""
      loading="lazy"
      decoding="async"
      className={cn('h-full w-full object-cover', className)}
    />
  );
}

/** Largeur de cellule commune à la home et à /users. */
export const CREATOR_CELL = 'w-[132px] max-[749px]:w-[120px]';

/**
 * Carte créateur retenue (« Goût ») : l'éventail de ses affiches en haut, puis
 * l'avatar, le nom et le nombre de listes. Un curateur se montre par ce qu'il
 * curate, pas seulement par un nom suivi d'un nombre.
 *
 * Partagée entre la section « Nos créateurs » de la home et la page /users,
 * pour que les deux endroits parlent le même langage.
 */
export function CreatorTasteCard({
  creator,
  content,
  className,
  size = 'sm',
}: {
  creator: CreatorTile;
  content: CreatorContent;
  className?: string;
  /** `sm` : la trame dense de la home. `md` : la page /users, moins de
      colonnes donc des cartes qui respirent. */
  size?: 'sm' | 'md';
}) {
  const md = size === 'md';
  return (
    <Link
      to={creatorHref(creator)}
      className={cn('group flex min-w-0 flex-col', md ? 'gap-3' : 'gap-2.5', className)}
    >
      <span className={cn('flex items-start', md ? 'h-23' : 'h-16')}>
        <span
          className={cn(
            'flex h-full [&>*]:transition-[margin] [&>*]:duration-300',
            md
              ? '[&>*:not(:first-child)]:-ml-9.75 group-hover:[&>*:not(:first-child)]:-ml-6.75'
              : '[&>*:not(:first-child)]:-ml-7 group-hover:[&>*:not(:first-child)]:-ml-5',
          )}
        >
          {creator.posters.slice(0, 3).map((path, i) => (
            <span
              key={`${path}-${i}`}
              className={cn(
                'rounded-poster border-border block h-full shrink-0 overflow-hidden border',
                md ? 'w-15.25' : 'w-10',
              )}
            >
              <CreatorPoster path={path} />
            </span>
          ))}
        </span>
      </span>
      <span className="flex min-w-0 items-center gap-2">
        <CreatorAvatar creator={creator} className={md ? 'h-8.75 w-8.75' : 'h-7 w-7'} />
        <span className="flex min-w-0 flex-col">
          <span className={cn('text-foreground truncate', md ? 'text-title' : 'text-label')}>
            {creator.username}
          </span>
          <span className="text-label text-muted-foreground truncate">
            {creatorCountLabel(creator, content)}
          </span>
        </span>
      </span>
    </Link>
  );
}
