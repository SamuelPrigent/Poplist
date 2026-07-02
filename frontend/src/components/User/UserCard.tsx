'use client';

import { User } from 'lucide-react';
import { Img as Image } from '@/components/ui/Img';
import { Link } from '@/components/ui/Link';

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
}

export function UserCard({ user, listCount, content }: UserCardProps) {
  return (
    <Link
      to={`/user/${user.username}`}
      className="group flex w-full min-w-0 flex-col items-center gap-3 rounded-lg bg-muted/30 p-5 transition-colors hover:bg-muted/50 max-[749px]:flex-row max-[749px]:gap-3 max-[749px]:p-3"
    >
      {/* Avatar */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full max-[749px]:h-11 max-[749px]:w-11">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="bg-muted/50 flex h-full w-full items-center justify-center">
            <User className="text-muted-foreground h-8 w-8 max-[749px]:h-5 max-[749px]:w-5" />
          </div>
        )}
      </div>

      {/* Username + nb de listes — colonne centrée sur desktop, alignée à
          gauche de l'avatar sur mobile (card horizontale) */}
      <div className="flex min-w-0 flex-col items-center gap-1.5 max-[749px]:items-start max-[749px]:gap-0.5">
        <h3 className="max-w-full truncate text-base font-semibold text-white max-[749px]:text-sm">
          {user.username}
        </h3>
        <span className="text-muted-foreground text-sm max-[749px]:text-xs">
          {listCount}{' '}
          {listCount === 1
            ? content.userProfile.watchlist
            : content.userProfile.watchlists}
        </span>
      </div>
    </Link>
  );
}
