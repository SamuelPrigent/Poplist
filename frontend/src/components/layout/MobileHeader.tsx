'use client';

import { ChevronDown, Coffee, Globe, LogOut, Shield, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { Img as Image } from '@/components/ui/Img';
import { Link } from '@/components/ui/Link';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { auth } from '@/api';
import { useAuth } from '@/context/auth-context';
import { AuthDrawer } from '@/features/auth/AuthDrawer';
import { useIsMounted } from '@/hooks/useIsMounted';
import { type Language, useLanguageStore } from '@/store/language';
import 'flag-icons/css/flag-icons.min.css';

const languages: { code: Language; flagCode: string; name: string }[] = [
  { code: 'fr', flagCode: 'fr', name: 'Français' },
  { code: 'en', flagCode: 'gb', name: 'English' },
  { code: 'de', flagCode: 'de', name: 'Deutsch' },
  { code: 'es', flagCode: 'es', name: 'Español' },
  { code: 'it', flagCode: 'it', name: 'Italiano' },
  { code: 'pt', flagCode: 'pt', name: 'Português' },
];

const itemClass =
  'hover:bg-accent flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors';

/**
 * En-tête mobile (< 750px), inspiré d'OLSC. Navigation principale via la
 * BottomNav. Ici : logo à gauche ; à droite un sélecteur de langue discret
 * (globe → liste) + la bulle avatar (compte / privacy / coffee / déconnexion).
 * Guest : langue + bouton Connexion.
 */
export function MobileHeader() {
  const { isAuthenticated, user, logout } = useAuth();
  const { language, content, setLanguage } = useLanguageStore();
  const mounted = useIsMounted();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [authDrawerOpen, setAuthDrawerOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleLogout = async () => {
    setMenuOpen(false);
    // Redirection post-logout gérée par useAuthRedirect (Providers).
    await logout();
  };

  const handleLanguageChange = async (lang: Language) => {
    setLanguage(lang);
    setLangOpen(false);
    if (isAuthenticated) {
      try {
        await auth.updateLanguage(lang);
      } catch (error) {
        console.error('Failed to update language:', error);
      }
    }
  };

  const LanguageSelector = (
    <Popover open={langOpen} onOpenChange={setLangOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Langue"
          className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 rounded-full px-1.5 py-1.5 transition-colors"
        >
          <Globe className="h-[18px] w-[18px]" strokeWidth={1.8} />
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-44 p-1.5">
        {languages.map(lang => (
          <button
            type="button"
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`${itemClass} ${lang.code === language ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            <span className={`fi fi-${lang.flagCode} h-[14px] shrink-0`} aria-hidden="true" />
            {lang.name}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );

  return (
    <>
      <header className="border-border bg-background sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 min-[750px]:hidden">
        {/* Gauche : logo + nom */}
        <Link to="/" className="flex items-center gap-2" aria-label={content.header.appName}>
          <Image src="/play.png" width={20} height={20} alt="" className="h-5 w-5" />
          <span className="text-lg font-bold text-white">{content.header.appName}</span>
        </Link>

        {/* Droite : langue + compte/connexion */}
        <div className="flex items-center gap-1">
          {LanguageSelector}

          {mounted &&
            (isAuthenticated ? (
              <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label={content.profile.title}
                    className="bg-muted hover:bg-muted/80 flex h-[33px] w-[33px] shrink-0 items-center justify-center overflow-hidden rounded-full transition-colors"
                  >
                    {user?.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt=""
                        width={33}
                        height={33}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" sideOffset={8} className="w-52 p-1.5">
                  <Link to="/account" onClick={() => setMenuOpen(false)} className={itemClass}>
                    <UserIcon className="h-4 w-4 shrink-0" />
                    {content.profile.title}
                  </Link>
                  <Link to="/privacy" onClick={() => setMenuOpen(false)} className={itemClass}>
                    <Shield className="h-4 w-4 shrink-0" />
                    Privacy
                  </Link>
                  <a
                    href="https://buymeacoffee.com/samuelprigl"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className={itemClass}
                  >
                    <Coffee className="h-4 w-4 shrink-0" />
                    Buy me a coffee
                  </a>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`${itemClass} text-red-400`}
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {content.header.logout}
                  </button>
                </PopoverContent>
              </Popover>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full cursor-pointer"
                onClick={() => {
                  setAuthMode('login');
                  setAuthDrawerOpen(true);
                }}
              >
                {content.header.login}
              </Button>
            ))}
        </div>
      </header>

      <AuthDrawer
        open={authDrawerOpen}
        onClose={() => setAuthDrawerOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
