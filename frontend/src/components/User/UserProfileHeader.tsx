'use client';

import { ArrowLeft, User } from 'lucide-react';
import { Img as Image } from '@/components/ui/Img';
import { useNavigate } from '@tanstack/react-router';
import { useLanguageStore } from '@/store/language';

interface UserProfileHeaderProps {
  user: {
    id: string;
    username: string | null;
    avatarUrl?: string | null;
  };
  totalPublicWatchlists: number;
  hasWatchlists: boolean;
}

export function UserProfileHeader({
  user,
  totalPublicWatchlists,
  hasWatchlists,
}: UserProfileHeaderProps) {
  const navigate = useNavigate();
  const { content } = useLanguageStore();

  const handleBack = () => {
    if (hasWatchlists) {
      window.history.back();
    } else {
      navigate({ to: '/home' as never });
    }
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Background Gradient */}
      <div
        className="absolute inset-0 "
        style={{
          background: 'linear-gradient(to bottom, #0c273775, transparent 60%)',
        }}
      />

      <div className="relative container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-12 pt-6 max-[749px]:px-4 max-[749px]:pt-4">
        {/* Back Button */}
        <div className="mb-3 max-[749px]:mb-1">
          <button
            type="button"
            onClick={handleBack}
            className="text-muted-foreground flex cursor-pointer items-center gap-2 rounded text-sm transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{content.watchlists.back}</span>
          </button>
        </div>

        {/* Sous 410px : avatar empilé au-dessus du pseudo (plus de place pour le titre) */}
        <div className="flex items-center gap-5 pt-3.5 pb-2 max-[749px]:gap-4 max-[409px]:flex-col max-[409px]:items-start max-[409px]:gap-3">
          {/* Avatar - Round */}
          <div className="shrink-0">
            <div className="relative h-28 w-28 overflow-hidden rounded-full shadow-xl max-[749px]:h-20 max-[749px]:w-20 max-[409px]:h-24 max-[409px]:w-24">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt=""
                  fill
                  sizes="112px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="bg-muted/50 flex h-full w-full items-center justify-center">
                  <User className="text-muted-foreground h-12 w-12 max-[749px]:h-9 max-[749px]:w-9 max-[409px]:h-11 max-[409px]:w-11" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex min-w-0 flex-1 flex-col gap-1 max-[409px]:w-full max-[409px]:flex-none">
            {/* Sous 410px l'avatar est déjà au-dessus : l'eyebrow « Profil » alourdit la colonne */}
            <span className="text-muted-foreground text-base max-[749px]:text-sm max-[409px]:hidden">
              {content.userProfile.profile}
            </span>

            {/* Mobile : taille réduite + césure pour les pseudos longs (pas de débordement) */}
            <h1 className="text-5xl leading-tight font-bold break-words text-white max-[749px]:text-[28px]">
              {user.username}
            </h1>

            <span className="text-muted-foreground text-sm">
              {totalPublicWatchlists}{' '}
              {totalPublicWatchlists === 1
                ? content.userProfile.publicWatchlist
                : content.userProfile.publicWatchlists}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
