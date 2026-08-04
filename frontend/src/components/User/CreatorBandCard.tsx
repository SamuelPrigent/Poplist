'use client';

import { Link } from '@/components/ui/Link';
import { cn } from '@/lib/cn';
import {
  CreatorAvatar,
  creatorCountLabel,
  creatorHref,
  type CreatorContent,
  type CreatorTile,
} from '@/components/User/CreatorTasteCard';

/** Nombre de couvertures affichées : au-delà, les colonnes deviennent illisibles. */
const MAX_COVERS = 4;

/**
 * Carte créateur de la section « Nos créateurs » (desktop).
 *
 * Le fond est composé des couvertures de ses listes, **une colonne par
 * liste** : le nombre de colonnes dit littéralement combien la personne en
 * tient. L'avatar est posé à cheval sur l'arête basse, au centre, et le nom
 * suit dessous. C'est le vocabulaire de l'en-tête de profil, ramené à
 * l'échelle d'une vignette de grille.
 *
 * Les couvertures sont atténuées à 50 % et remontent à 75 % au survol. À
 * pleine intensité, sept cartes côte à côte redonnent exactement la surcharge
 * que cette carte cherche à supprimer, et l'avatar cesse de se détacher.
 *
 * Les couvertures viennent de `CreatorTile.listCovers`, résolues en amont :
 * image uploadée de la liste si elle existe, sinon sa première affiche.
 */
export function CreatorBandCard({
  creator,
  content,
  className,
}: {
  creator: CreatorTile;
  content: CreatorContent;
  className?: string;
}) {
  const covers = (creator.listCovers ?? []).slice(0, MAX_COVERS);

  return (
    <Link
      to={creatorHref(creator)}
      className={cn('group flex min-w-0 flex-col gap-3', className)}
    >
      {/* pb-6 = la moitié de l'avatar : c'est ce qui dépasse sous le bandeau. */}
      <span className="relative block pb-6">
        <span className="bg-card border-border rounded-card flex h-20 overflow-hidden border">
          {covers.map((url, i) => (
            <span key={`${url}-${i}`} className="block h-full flex-1 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover opacity-50 transition-opacity duration-300 group-hover:opacity-75"
              />
            </span>
          ))}
        </span>
        <span className="absolute inset-x-0 bottom-0 flex justify-center">
          <CreatorAvatar creator={creator} className="border-background h-12 w-12 border-2" />
        </span>
      </span>

      <span className="flex min-w-0 flex-col items-center text-center">
        <span className="text-title text-foreground w-full truncate">{creator.username}</span>
        <span className="text-label text-muted-foreground w-full truncate">
          {creatorCountLabel(creator, content)}
        </span>
      </span>
    </Link>
  );
}
