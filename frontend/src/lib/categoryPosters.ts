import type { Watchlist } from '@/api';

/**
 * Choix des affiches qui représentent une catégorie dans « Listes par
 * catégorie ».
 *
 * Le problème résolu : en aplatissant tous les items d'une catégorie puis en
 * prenant les 3 plus récents, on tombait presque toujours sur trois affiches
 * de la MÊME liste (celle qui vient d'être alimentée), et le même titre
 * pouvait représenter deux catégories à la fois. Trois vignettes qui se
 * ressemblent ne disent rien de plus qu'une seule.
 *
 * La règle en deux temps :
 *
 * 1. **Dans une catégorie, une affiche par liste.** Les listes sont mises en
 *    tourniquet : on prend la plus récente de la liste A, puis celle de la
 *    liste B, puis celle de la liste C, et seulement ensuite la deuxième de A.
 *    Les 3 affiches montrées viennent donc de 3 listes différentes tant que la
 *    catégorie en compte au moins 3.
 * 2. **Entre catégories, premier arrivé premier servi.** Les catégories sont
 *    parcourues dans l'ordre fixe de `GENRE_CATEGORIES` et réservent leurs
 *    affiches ; la suivante saute ce qui est déjà pris. Un même film ne
 *    représente jamais deux catégories.
 *
 * Deux propriétés voulues :
 *
 * - **Déterministe.** Aucun tirage : l'ordre vient de `addedAt` (départage par
 *   `tmdbId` en cas d'égalité) et de l'ordre des catégories. À données
 *   identiques, le rendu est identique, rechargement après rechargement, et
 *   côté serveur comme côté client (contrainte SSR).
 * - **Pas strict.** Si la déduplication laisse une catégorie sans assez
 *   d'affiches, elle reprend dans son propre vivier plutôt que d'afficher un
 *   trou : mieux vaut une répétition rare qu'une vignette manquante.
 */

/** Profondeur du vivier : de quoi absorber la dédup entre catégories. */
const POOL_DEPTH = 12;

/**
 * Le vivier d'une catégorie, ses listes mises en tourniquet.
 *
 * Ordre des listes : la plus récemment alimentée d'abord (l'id départage, pour
 * que deux listes figées au même instant ne permutent pas d'un rendu à
 * l'autre). Ordre dans une liste : ajout le plus récent d'abord.
 */
export function categoryPosterPool(watchlists: Watchlist[]): string[] {
  const perList = (watchlists ?? [])
    .map((wl) => ({
      id: wl.id,
      items: (wl.items ?? [])
        .filter((item) => !!item.posterPath)
        .sort(
          (a, b) =>
            (b.addedAt ?? '').localeCompare(a.addedAt ?? '') || a.tmdbId - b.tmdbId,
        ),
    }))
    .filter((list) => list.items.length > 0)
    .sort(
      (a, b) =>
        (b.items[0].addedAt ?? '').localeCompare(a.items[0].addedAt ?? '') ||
        a.id.localeCompare(b.id),
    );

  const pool: string[] = [];
  const seen = new Set<number>();
  const deepest = perList.reduce((max, list) => Math.max(max, list.items.length), 0);

  // Tourniquet : rang 0 de chaque liste, puis rang 1, etc.
  for (let rank = 0; rank < deepest && pool.length < POOL_DEPTH; rank += 1) {
    for (const list of perList) {
      if (pool.length >= POOL_DEPTH) break;
      const item = list.items[rank];
      // Un même titre peut appartenir à plusieurs listes de la catégorie : il
      // ne compte qu'une fois, sinon le tourniquet perd son intérêt.
      if (!item || seen.has(item.tmdbId)) continue;
      seen.add(item.tmdbId);
      pool.push(item.posterPath as string);
    }
  }

  return pool;
}

/**
 * Répartit les affiches entre catégories : chacune sert dans l'ordre reçu et
 * réserve ce qu'elle prend. `perCategory` vignettes par catégorie.
 *
 * `pools` est indexé par id de catégorie ; une catégorie encore en chargement
 * (vivier absent) n'est pas servie et ne bloque pas les suivantes.
 */
export function dispatchCategoryPosters(
  order: readonly string[],
  pools: Record<string, string[] | undefined>,
  perCategory = 3,
): Record<string, string[]> {
  const claimed = new Set<string>();
  const out: Record<string, string[]> = {};

  for (const categoryId of order) {
    const pool = pools[categoryId];
    if (!pool?.length) {
      out[categoryId] = [];
      continue;
    }

    const picked = pool.filter((path) => !claimed.has(path)).slice(0, perCategory);
    // Repli non strict : plutôt une affiche déjà vue ailleurs qu'un trou.
    if (picked.length < perCategory) {
      for (const path of pool) {
        if (picked.length >= perCategory) break;
        if (!picked.includes(path)) picked.push(path);
      }
    }

    picked.forEach((path) => claimed.add(path));
    out[categoryId] = picked;
  }

  return out;
}
