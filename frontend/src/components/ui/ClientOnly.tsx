'use client';

import type { ReactNode } from 'react';
import { useIsMounted } from '@/hooks/useIsMounted';

/**
 * Rend ses enfants UNIQUEMENT après le mount client.
 *
 * Équivalent du `dynamic(() => import(...), { ssr: false })` de Next.
 * Utile pour les composants lazy qui sinon, rendus côté SSR puis hydratés
 * client, font remonter une Suspense boundary à la page parente le temps
 * que le chunk lazy charge → "disparait → réapparait" visible.
 *
 * Pattern : `<ClientOnly><LazyModal ... /></ClientOnly>` au lieu de
 * `<Suspense fallback={null}><LazyModal ... /></Suspense>` qui charge tout
 * de même le chunk au SSR.
 */
export function ClientOnly({ children }: { children: ReactNode }) {
  const mounted = useIsMounted();
  return mounted ? <>{children}</> : null;
}
