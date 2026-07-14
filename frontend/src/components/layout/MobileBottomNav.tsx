'use client';

import { Bookmark, Home, LayoutGrid, Search } from 'lucide-react';
import { useLocation } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Link } from '@/components/ui/Link';
import { useAuth } from '@/context/auth-context';
import { useLanguageStore } from '@/store/language';
import { cn } from '@/lib/utils';

/**
 * Arme le préchargement des onglets APRÈS le premier idle du navigateur.
 * Avec `preload: 'render'` dès le montage, les loaders des 3 onglets
 * partaient pendant la fenêtre critique du chargement (~230 kB d'API
 * mesurés qui concurrencent le LCP de la page courante, et 2× à cause du
 * re-render au changement d'état auth — cf. private/lighthouse.md §7).
 * Personne ne tape sur un onglet dans les 2 premières secondes : différer
 * garde l'UX d'onglets instantanés sans pénaliser le LCP.
 */
function useIdleWarmup() {
  const [warm, setWarm] = useState(false);

  useEffect(() => {
    // Safari iOS n'a pas requestIdleCallback → fallback setTimeout.
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(() => setWarm(true), { timeout: 3000 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(() => setWarm(true), 2500);
    return () => clearTimeout(t);
  }, []);

  return warm;
}

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
  const warm = useIdleWarmup();

  // `preload: 'render'` : pas de hover sur mobile, on précharge les loaders
  // des onglets (équivalent du preload intent desktop) — mais seulement une
  // fois `warm` (premier idle), cf. useIdleWarmup ci-dessus. Exception
  // « Mes listes » : sa cible bascule avec l'auth et les deux routes
  // redirigent dans leur beforeLoad → un préload en vol pendant un
  // login/logout déclenche une race dans router-core (getMatch undefined
  // → crash `_nonReactive`). Il reste donc en preload intent par défaut.
  const tabPreload = warm ? ('render' as const) : undefined;
  const items = [
    {
      to: '/home',
      label: content.header.home,
      icon: Home,
      active: pathname === '/home',
      preload: tabPreload,
    },
    {
      to: '/categories',
      label: content.header.categories,
      icon: LayoutGrid,
      active: pathname === '/categories' || pathname.startsWith('/categories/'),
      preload: tabPreload,
    },
    {
      to: '/explore',
      label: content.header.explore,
      icon: Search,
      active: pathname === '/explore',
      preload: tabPreload,
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
