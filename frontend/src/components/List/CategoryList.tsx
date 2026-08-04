'use client';

import { Link } from '@/components/ui/Link';
import { cn } from '@/lib/cn';
import { getTMDBImageUrl } from '@/lib/utils';

export interface CategoryTile {
  id: string;
  name: string;
  nameMobile?: string;
  href: string;
  /** Chemin de l'illustration sans extension (`/categories/avatar`). */
  cutout: string;
  /** Nombre de listes ; `undefined` tant que la donnée n'a pas résolu. */
  count: number | undefined;
  /**
   * Affiches réelles de la catégorie, déjà réparties par
   * `lib/categoryPosters` : une par liste, et jamais le même titre que la
   * catégorie voisine. Le choix est déterministe, pas tiré au sort.
   */
  posters: string[];
}

export function CategoryPoster({ path, className }: { path: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getTMDBImageUrl(path, 'w185') ?? ''}
      alt=""
      loading="lazy"
      decoding="async"
      className={cn('h-full w-full object-cover', className)}
    />
  );
}

/**
 * Affichage retenu pour « Listes par catégorie » : de la signalétique, pas des
 * cartes. Deux colonnes de lignes séparées par un filet, le nom à gauche, les
 * dernières affiches ajoutées au milieu, le comptage aligné à droite.
 *
 * Partagé entre la home et la page /categories, pour que les deux endroits
 * parlent le même langage.
 */
export function CategoryList({
  tiles,
  countLabel,
  className,
}: {
  tiles: CategoryTile[];
  /** « 3 listes » / « 1 liste » — accordé par l'appelant. */
  countLabel: (count: number) => string;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        'border-border grid grid-cols-2 gap-x-10 border-t max-[749px]:grid-cols-1',
        className,
      )}
    >
      {tiles.map((tile) => (
        <li key={tile.id} className="border-border border-b">
          <Link to={tile.href} className="group flex items-center gap-4 py-4">
            <span className="text-title text-foreground min-w-0 flex-1 truncate">{tile.name}</span>
            <span className="flex shrink-0 gap-1">
              {tile.posters.slice(0, 3).map((path, i) => (
                <span
                  key={`${path}-${i}`}
                  className="rounded-poster block h-10 w-7 overflow-hidden opacity-60 transition-opacity duration-200 group-hover:opacity-100"
                >
                  <CategoryPoster path={path} />
                </span>
              ))}
            </span>
            {tile.count !== undefined && (
              <span className="text-label text-muted-foreground w-16 shrink-0 text-right tabular-nums">
                {countLabel(tile.count)}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
