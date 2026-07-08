'use client';

import { Bookmark, Home, LayoutGrid, Search } from 'lucide-react';
import { useLocation } from '@tanstack/react-router';
import { Link } from '@/components/ui/Link';
import { useAuth } from '@/context/auth-context';
import { useLanguageStore } from '@/store/language';
import { cn } from '@/lib/utils';

/**
 * Barre de navigation basse mobile (< 750px), inspirée d'OLSC. Toujours visible
 * (jamais masquée selon la page). 3 items : Accueil / Explorer / Mes listes.
 * Item actif : barre blanche arrondie en haut (le haut est clippé par
 * `overflow-hidden` → effet onglet) + label/icône en blanc. Safe-area iOS (PWA).
 */
export function MobileBottomNav() {
  const pathname = useLocation({ select: (l) => l.pathname });
  const { isAuthenticated } = useAuth();
  const { content } = useLanguageStore();

  // `preload: 'render'` : pas de hover sur mobile, on précharge les loaders
  // des onglets dès le rendu de la barre (équivalent du preload intent
  // desktop). Exception « Mes listes » : sa cible bascule avec l'auth et les
  // deux routes redirigent dans leur beforeLoad → un préload en vol pendant
  // un login/logout déclenche une race dans router-core (getMatch undefined
  // → crash `_nonReactive`). Il reste donc en preload intent par défaut.
  const items = [
    {
      to: '/home',
      label: content.header.home,
      icon: Home,
      active: pathname === '/home',
      preload: 'render' as const,
    },
    {
      to: '/categories',
      label: content.header.categories,
      icon: LayoutGrid,
      active: pathname === '/categories' || pathname.startsWith('/categories/'),
      preload: 'render' as const,
    },
    {
      to: '/explore',
      label: content.header.explore,
      icon: Search,
      active: pathname === '/explore',
      preload: 'render' as const,
    },
    {
      to: isAuthenticated ? '/account/lists' : '/local/lists',
      label: content.header.myLists,
      icon: Bookmark,
      active: pathname === '/account/lists' || pathname === '/local/lists',
      preload: undefined,
    },
  ];

  return (
    <nav className="border-border bg-background fixed inset-x-0 bottom-0 z-2000 border-t pb-[env(safe-area-inset-bottom)] min-[750px]:hidden">
      <div className="flex items-stretch overflow-hidden">
        {items.map(({ to, label, icon: Icon, active, preload }) => (
          <Link
            key={to}
            to={to}
            preload={preload}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-1.25 pt-3 pb-2.75 text-[11px] font-semibold transition-colors',
              active ? 'text-white' : 'text-muted-foreground',
            )}
          >
            {active && (
              <span className="absolute top-[1px] left-1/2 h-[4px] w-[44px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
            )}
            <Icon
              className={cn('h-[20px] w-[20px] shrink-0', active && 'fill-white/10')}
              strokeWidth={active ? 2.2 : 1.8}
            />
            <span className="font-normal">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
