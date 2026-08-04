import { getTMDBImageUrl } from '@/lib/utils';

/** Ce dont on a besoin d'une liste pour en tirer une couverture. */
interface CoverSource {
  imageUrl?: string | null;
  items?: { posterPath?: string | null }[] | null;
}

/**
 * L'image qui représente **une** liste : sa couverture uploadée si elle en a
 * une, sinon la première affiche qu'elle contient. `null` si la liste n'a ni
 * l'une ni l'autre.
 *
 * C'est ce qui permet de représenter un créateur par SES LISTES (une colonne
 * par liste dans `CreatorBandCard`) plutôt que par des affiches en vrac.
 * Partagé entre la home et /users pour que les deux pages montrent la même
 * chose du même créateur.
 */
export function listCover(wl: CoverSource): string | null {
  if (wl.imageUrl) return wl.imageUrl;
  const first = (wl.items ?? []).map((item) => item.posterPath).find((path) => !!path);
  return first ? (getTMDBImageUrl(first, 'w342') ?? null) : null;
}
