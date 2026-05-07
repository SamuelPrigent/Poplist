/**
 * LocalStorage Versioning — wipe brutal sur mismatch.
 *
 * Stratégie simple :
 * - Une version unique en dur (`CURRENT_STORAGE_VERSION`)
 * - Au boot, si la version stockée diffère (absente OU différente) → on wipe
 *   tout le localStorage et on pose la version courante
 * - Pas de migrations incrémentales : les données localStorage sont des prefs
 *   UI + cache, pas des données critiques. Le wipe est acceptable.
 *
 * Règle de bump :
 * - Ajout d'une nouvelle clé           → pas de bump nécessaire (default Zustand kick-in)
 * - Retrait / rename / breaking change → bumper la version (`'1.1'` → `'1.2'`, etc.)
 */

export const CURRENT_STORAGE_VERSION = '1.1';

const VERSION_KEY = 'poplist_storage_version';

/**
 * Si la version localStorage ne matche pas `CURRENT_STORAGE_VERSION`,
 * wipe complet du localStorage et pose la nouvelle version.
 * Retourne `true` si un wipe a eu lieu, `false` sinon.
 *
 * À appeler au boot client AVANT que les composants lisent localStorage.
 * Si `true`, le caller doit reload la page (les stores Zustand sont déjà
 * hydratés en mémoire avec les anciennes données).
 */
export function cleanLocalStorageIfVersionMismatch(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(VERSION_KEY);
    if (stored === CURRENT_STORAGE_VERSION) return false;

    localStorage.clear();
    localStorage.setItem(VERSION_KEY, CURRENT_STORAGE_VERSION);
    console.log(
      `[Storage] Cleaned localStorage (was ${stored ?? 'absent'}, now ${CURRENT_STORAGE_VERSION})`
    );
    return true;
  } catch {
    // localStorage inaccessible (private browsing, quota plein) — ignore
    return false;
  }
}
