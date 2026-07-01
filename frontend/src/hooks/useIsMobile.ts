'use client';

import { useEffect, useState } from 'react';

/**
 * Retourne true quand le viewport est < `breakpoint` (défaut 750px, le breakpoint
 * mobile de l'app). SSR-safe : renvoie `false` au premier rendu (serveur + première
 * peinture), puis se met à jour après montage via matchMedia.
 *
 * Usage principal : choisir modale (desktop) vs drawer (mobile). Comme le contenu
 * d'une modale/drawer ne se monte qu'à l'ouverture (interaction = 100% client, après
 * hydratation), la valeur est déjà correcte au moment où ça compte → aucun risque
 * de mismatch d'hydratation.
 */
export function useIsMobile(breakpoint = 750): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [breakpoint]);

  return isMobile;
}
