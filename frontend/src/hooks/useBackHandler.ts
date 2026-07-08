'use client';

import { useEffect, useRef } from 'react';

/**
 * Bouton retour (Android / navigateur) → ferme le drawer ou la sous-vue au
 * lieu de naviguer.
 *
 * Fonctionnement : quand `active` passe à true, on pousse une entrée
 * d'historique « fantôme » (`history.pushState`) et on empile `onBack`. Un
 * back utilisateur consomme l'entrée fantôme et émet un `popstate` : le
 * listener dépile le handler le plus récent (LIFO — la sous-vue se ferme
 * avant le drawer, le drawer avant la vraie navigation) et l'appelle. L'URL
 * de la page ne change jamais.
 *
 * Si l'élément se ferme autrement (croix, swipe, succès), le cleanup consomme
 * l'entrée fantôme par un `history.go` programmatique, ignoré par le listener
 * — sinon le back suivant « ne ferait rien » une fois.
 *
 * NB : les entrées fantômes gardent la même URL et un state sans `__TSR_key`
 * → TanStack Router ne navigue pas sur ces popstate (même location) ; au back
 * final on retombe sur l'entrée du router avec son state intact.
 */

type Entry = { onBack: () => void };

const stack: Entry[] = [];
let listenerInstalled = false;
let ignorePops = 0;
let pendingConsume = 0;
let consumeScheduled = false;

function ensureListener() {
  if (listenerInstalled) return;
  listenerInstalled = true;
  window.addEventListener('popstate', () => {
    if (ignorePops > 0) {
      ignorePops -= 1;
      return;
    }
    const entry = stack.pop();
    if (entry) entry.onBack();
  });
}

// Consommation groupée des entrées fantômes : un seul `history.go(-n)` même
// si plusieurs niveaux se ferment dans le même tick (ex. swipe-close d'un
// drawer avec une sous-vue ouverte) — des `history.back()` successifs seraient
// avalés par les navigateurs.
function scheduleConsume() {
  pendingConsume += 1;
  if (consumeScheduled) return;
  consumeScheduled = true;
  window.setTimeout(() => {
    const n = pendingConsume;
    pendingConsume = 0;
    consumeScheduled = false;
    // Garde-fou : on ne consomme que si le sommet de l'historique est bien
    // une entrée fantôme. Si une navigation (pushState du router) a eu lieu
    // pendant que l'élément était ouvert, go(-n) annulerait cette navigation
    // — on préfère laisser une entrée fantôme orpheline (un back « à vide »)
    // que de reverter l'URL de l'utilisateur.
    if (n > 0 && window.history.state?.__backHandler === true) {
      ignorePops += 1; // go(-n) n'émet qu'un seul popstate
      window.history.go(-n);
    }
  }, 0);
}

/**
 * @param active true tant que l'élément (drawer, sous-vue…) est ouvert
 * @param onBack appelé quand l'utilisateur fait « précédent » pendant que
 *   l'élément est le plus récent ouvert — doit le fermer
 */
export function useBackHandler(active: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack);
  useEffect(() => {
    onBackRef.current = onBack;
  });

  useEffect(() => {
    if (!active) return;
    ensureListener();
    const entry: Entry = { onBack: () => onBackRef.current() };
    stack.push(entry);
    window.history.pushState({ __backHandler: true }, '');
    return () => {
      const idx = stack.indexOf(entry);
      if (idx !== -1) {
        // Fermeture programmatique (croix, swipe, succès…) : on retire le
        // handler et on consomme l'entrée fantôme sans déclencher onBack.
        stack.splice(idx, 1);
        scheduleConsume();
      }
      // Sinon : déjà dépilé par un back utilisateur — rien à consommer.
    };
  }, [active]);
}
