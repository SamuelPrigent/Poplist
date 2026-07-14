'use client';

import { domAnimation, LazyMotion, m } from 'motion/react';
import { useEffect, type ReactNode } from 'react';

// Au premier chargement (SSR + hydratation), ce flag est false : la page est
// rendue directement visible. Un `initial={{ opacity: 0 }}` inconditionnel
// gardait tout le HTML SSR invisible jusqu'à l'hydratation → LCP mobile
// mesuré à 8,2s en prod (cf. private/lighthouse.md). Après le premier montage,
// le flag passe à true : les navigations client retrouvent le fade-in.
let hasHydrated = false;

/**
 * Wrapper de page : fade-in UNIQUEMENT en navigation client.
 * Fournit aussi le contexte LazyMotion aux `m.*` descendants.
 */
export function PageFade({ children }: { children: ReactNode }) {
  const animateEntry = hasHydrated;

  useEffect(() => {
    hasHydrated = true;
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={animateEntry ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
