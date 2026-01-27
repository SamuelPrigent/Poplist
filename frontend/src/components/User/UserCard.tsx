'use client';

import { User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface UserCardProps {
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  listCount: number;
  content: {
    userProfile: {
      publicWatchlist: string;
      publicWatchlists: string;
    };
  };
}

export function UserCard({ user, listCount, content }: UserCardProps) {
  return (
    <Link
      href={`/user/${user.username}`}
      className="group flex flex-col items-center gap-3 rounded-lg bg-muted/30 p-5 transition-colors hover:bg-[#36363780]"
    >
      {/* Avatar */}
      <div className="relative h-20 w-20 overflow-hidden rounded-full">
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
            <User className="text-muted-foreground h-8 w-8" />
          </div>
        )}
      </div>

      {/* Username */}
      <h3 className="text-base font-semibold text-white">{user.username}</h3>

      {/* List count */}
      <span className="text-muted-foreground text-sm">
        {listCount}{' '}
        {listCount === 1
          ? content.userProfile.publicWatchlist
          : content.userProfile.publicWatchlists}
      </span>
    </Link>
  );
}
