'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AuthDrawer } from '@/features/auth/AuthDrawer';
import { LibraryEmpty } from '@/components/List/LibraryEmpty';
import { useLanguageStore } from '@/store/language';

/**
 * Page « Mes listes » pour un visiteur non connecté. Plus de listes locales
 * (fonctionnalité offline supprimée) : un simple placeholder qui invite à
 * créer un compte pour créer des listes et les partager.
 */
export function ListsGuestContent() {
  const { content } = useLanguageStore();
  const [authDrawerOpen, setAuthDrawerOpen] = useState(false);

  return (
    <div className="container mx-auto mb-32 w-(--sectionWidth) max-w-(--maxWidth) px-4 pt-11 pb-8 max-[749px]:mb-10 max-[749px]:min-h-0 max-[749px]:pt-7">
      <h1 className="mb-1 text-3xl font-bold text-white max-[749px]:mb-5 max-[749px]:text-[28px]">
        {content.watchlists.title}
      </h1>

      <div className="flex flex-col items-center pt-16 max-[749px]:pt-10">
        <LibraryEmpty
          title={content.watchlists.signupCta.title}
          description={content.watchlists.signupCta.description}
        />
        <Button
          variant="secondary"
          className="corner-squircle focus-visible:ring-offset-background cursor-pointer rounded-2xl focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
          onClick={() => setAuthDrawerOpen(true)}
        >
          {content.watchlists.signupCta.button}
        </Button>
      </div>

      <AuthDrawer
        open={authDrawerOpen}
        onClose={() => setAuthDrawerOpen(false)}
        initialMode="signup"
      />
    </div>
  );
}
