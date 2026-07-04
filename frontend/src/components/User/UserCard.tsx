'use client';

import { User } from 'lucide-react';
import { Img as Image } from '@/components/ui/Img';
import { Link } from '@/components/ui/Link';
import { cn } from '@/lib/cn';

interface UserCardProps {
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  listCount: number;
  content: {
    userProfile: {
      watchlist: string;
      watchlists: string;
    };
  };
  /** Mobile (< 750px) : rendu carrousel — vertical, sans fond, gros avatar
      rond + nom/compteur dessous (au lieu de la card horizontale de /users). */
  carousel?: boolean;
}

export function UserCard({ user, listCount, content, carousel = false }: UserCardProps) {
  return (
    <Link
      to={`/user/${user.username}`}
      className={cn(
        'group flex w-full min-w-0 flex-col items-center gap-3 rounded-lg transition-colors',
        carousel
          ? 'p-0 max-[749px]:gap-2'
          : 'bg-muted/30 p-5 hover:bg-muted/50 max-[749px]:flex-row max-[749px]:gap-3 max-[749px]:p-3',
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-full',
          carousel
            ? 'h-18 w-18 ring-white/0 transition group-hover:ring-4 group-hover:ring-white/10 max-[749px]:h-[60px] max-[749px]:w-[60px]'
            : 'h-20 w-20 max-[749px]:h-11 max-[749px]:w-11',
        )}
      >
        {user.avatarUrl ? (
          <Image src={user.avatarUrl} alt="" fill sizes="96px" className="object-cover" />
        ) : (
          <div className="bg-muted/50 flex h-full w-full items-center justify-center">
            <User
              className={cn(
                'text-muted-foreground h-8 w-8',
                carousel ? 'max-[749px]:h-7 max-[749px]:w-7' : 'max-[749px]:h-5 max-[749px]:w-5',
              )}
            />
          </div>
        )}
      </div>

      {/* Username + nb de listes — colonne centrée (bare + desktop), ou alignée
          à gauche de l'avatar sur la card horizontale de /users. */}
      <div
        className={cn(
          'flex min-w-0 flex-col items-center gap-1.5',
          carousel ? 'gap-1 max-[749px]:gap-0.5' : 'max-[749px]:items-start max-[749px]:gap-0.5',
        )}
      >
        <h3 className="max-w-full truncate text-base font-semibold text-white max-[749px]:text-sm">
          {user.username}
        </h3>
        <span className="text-muted-foreground text-sm max-[749px]:text-xs">
          {listCount}{' '}
          {listCount === 1 ? content.userProfile.watchlist : content.userProfile.watchlists}
        </span>
      </div>
    </Link>
  );
}
