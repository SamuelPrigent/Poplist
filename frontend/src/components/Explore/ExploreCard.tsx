'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Plus } from 'lucide-react';
import { Img as Image } from '@/components/ui/Img';
import { WatchlistPickerMenu } from '@/components/List/WatchlistPickerMenu';
import type { Watchlist } from '@/api';
import { cn } from '@/lib/cn';
import { tmdbPosterSrcSet } from '@/lib/utils';

export interface ExploreItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  media_type?: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
}

/**
 * Où poser le titre :
 * - `mask` : sur l'affiche, dans le voile bas.
 * - `under` : sous l'affiche, qui garde alors toute sa hauteur intacte.
 */
export type TitlePosition = 'mask' | 'under';

interface ExploreCardBodyProps {
  item: ExploreItem;
  index: number;
  gridCols: number;
  titlePosition?: TitlePosition;
  isAuthenticated: boolean;
  watchlists: Watchlist[];
  onAdd: (watchlistId: string) => void;
  onRemove: (watchlistId: string) => void;
  addToLabel: string;
  noWatchlistLabel: string;
}

/**
 * Carte de la grille Explore, alignée sur le traitement de la home :
 * l'affiche n'est jamais animée (c'est le conteneur qui porte le retour du
 * survol), pas d'icône œil, pas de pastille étoile jaune.
 *
 * Le titre et la ligne de méta « année · note » sont posés en permanence : sur
 * une page de recherche, savoir ce qu'on regarde et si ça vaut le détour fait
 * partie du travail de la page, pas d'un état de survol. Seul le bouton
 * d'ajout monte au survol.
 *
 * L'année plutôt que la durée : la durée n'existe pas dans la réponse
 * discover/search et aurait coûté un appel de détail par carte, soit 60 par
 * page. L'année est déjà là, gratuitement.
 *
 * Le type (Film / Série) n'est pas répété : il est déjà arbitré par le filtre
 * en haut de page.
 */
export function ExploreCardBody({
  item,
  index,
  gridCols,
  titlePosition = 'mask',
  isAuthenticated,
  watchlists,
  onAdd,
  onRemove,
  addToLabel,
  noWatchlistLabel,
}: ExploreCardBodyProps) {
  const title = item.title || item.name || '';
  // L'année est déjà dans la réponse discover/search : aucune requête
  // supplémentaire, là où la durée aurait coûté un appel de détail par carte.
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const note = item.vote_average > 0 ? item.vote_average.toFixed(1) : null;
  const overlay = titlePosition === 'mask';

  const caption = (
    <>
      {/* Une seule ligne, jamais de retour : le `pr-6` réserve la zone où le
          masque efface la fin du texte, de sorte que le fondu tombe sur les
          points de suspension et pas au milieu d'un mot. */}
      {/* En compact, le titre seul et un cran plus petit : la ligne de méta
          surchargeait des cartes déjà étroites. */}
      <h3
        className={cn(
          'text-title truncate pr-6 font-medium mask-[linear-gradient(to_right,black,black_88%,transparent)] max-[749px]:text-sm',
          overlay ? 'text-white' : 'text-foreground',
        )}
      >
        {title}
      </h3>
      {(year || note) && (
        <div
          className={cn(
            'text-label mt-0.5 flex items-center gap-1.5 max-[749px]:hidden',
            overlay ? 'text-white/75' : 'text-muted-foreground',
          )}
        >
          {year && <span>{year}</span>}
          {year && note && <span aria-hidden="true">·</span>}
          {note && <span className={overlay ? 'text-white' : 'text-foreground'}>{note}</span>}
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col">
      <div className="bg-muted shadow-poster rounded-poster relative aspect-2/3 overflow-hidden">
        {item.poster_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
            srcSet={tmdbPosterSrcSet(item.poster_path)}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
            className="object-cover"
            unoptimized
            {...(index < 6 ? { priority: true } : {})}
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center">?</div>
        )}

        {/* Retour de survol porté par le conteneur, jamais par l'affiche. */}
        <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/20 group-focus-within:bg-black/20" />

        {/* Position « mask » : voile de lisibilité et texte posés sur l'affiche. */}
        {overlay && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 max-[749px]:hidden">
            <div className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-black via-black/85 to-transparent" />
            <div className="relative px-2.5 pb-2.5">{caption}</div>
          </div>
        )}

        {isAuthenticated && (
          <div className="absolute top-2.5 right-2.5 z-10 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-[749px]:hidden">
            <WatchlistPickerMenu
              watchlists={watchlists.filter((w) => w.isOwner || w.isCollaborator)}
              tmdbId={item.id}
              onAdd={onAdd}
              onRemove={onRemove}
              addToLabel={addToLabel}
              noWatchlistLabel={noWatchlistLabel}
              side={index % gridCols === gridCols - 1 ? 'left' : 'right'}
              align="start"
            >
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  aria-label={addToLabel}
                  className="cursor-pointer rounded-full bg-black/70 p-2.5 text-white transition-colors outline-none hover:bg-black focus-visible:ring-2 focus-visible:ring-white"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </DropdownMenu.Trigger>
            </WatchlistPickerMenu>
          </div>
        )}
      </div>

      {/* Position « under » : l'affiche garde toute sa hauteur, le texte se
          pose dessous, sur le fond de page. Masqué en compact : à cette
          largeur le titre n'était presque jamais complet, l'affiche parle
          mieux toute seule. */}
      {!overlay && <div className="pt-2 max-[749px]:hidden">{caption}</div>}
    </div>
  );
}
