"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Film, Plus } from "lucide-react";
import { Img as Image } from "@/components/ui/Img";
import { useState } from "react";
import type { Watchlist } from "@/api";
import { WatchlistPickerMenu } from "@/components/List/WatchlistPickerMenu";
import { getTMDBImageUrl, tmdbPosterSrcSet } from "@/lib/utils";

interface MoviePosterProps {
   id: number;
   title?: string;
   name?: string;
   posterPath?: string;
   releaseDate?: string;
   overview?: string;
   onClick?: () => void;
   watchlists?: Watchlist[];
   onAddToWatchlist?: (watchlistId: string) => void;
   onRemoveFromWatchlist?: (watchlistId: string) => void;
   addToWatchlistLabel?: string;
   noWatchlistLabel?: string;
   /** Affiche au-dessus de la ligne de flottaison : chargement non différé. */
   priority?: boolean;
}

export function MoviePoster({
   id,
   title,
   name,
   posterPath,
   onClick,
   watchlists,
   onAddToWatchlist,
   onRemoveFromWatchlist,
   addToWatchlistLabel = "Ajouter à une liste",
   noWatchlistLabel = "Aucune liste",
   priority = false,
}: MoviePosterProps) {
   const displayTitle = title || name;
   const [imageError, setImageError] = useState(false);
   const ownedWatchlists = watchlists?.filter(w => w.isOwner || w.isCollaborator) ?? [];
   const showAddButton = onAddToWatchlist && onRemoveFromWatchlist;

   const posterContent = (
      <>
         <div className="bg-muted shadow-poster rounded-poster relative h-full w-full overflow-hidden">
            {/* Image with zoom on hover/focus */}
            {posterPath && !imageError ? (
               <Image
                  src={getTMDBImageUrl(posterPath, 'w342') ?? ''}
                  srcSet={tmdbPosterSrcSet(posterPath)}
                  alt={displayTitle || "Movie poster"}
                  fill
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                  className="object-cover"
                  priority={priority}
                  onError={() => setImageError(true)}
                  unoptimized
               />
            ) : (
               <div className="flex h-full items-center justify-center">
                  <Film strokeWidth={1} className="text-muted-foreground h-16 w-16" />
               </div>
            )}

            {/* Le titre ne monte qu'au survol, dans le même traitement que la
                tête de rail (voile bas + rôle `title`) : la ligne reste
                homogène, et une affiche au repos n'a rien qui la surcharge. */}
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
               <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/85 via-black/35 to-transparent" />
               <h3 className="text-title text-foreground absolute inset-x-0 bottom-0 line-clamp-2 px-3 pb-3">
                  {displayTitle}
               </h3>
            </div>

            {/* Add to watchlist dropdown - top right.
                Masqué sur mobile : opacity-0 restait tapable par inadvertance
                (pas de hover) — on passe par le drawer détail pour ajouter */}
            {showAddButton && (
               <div className="absolute top-2.5 right-2.5 z-10 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-[749px]:hidden">
                  <WatchlistPickerMenu
                     watchlists={ownedWatchlists}
                     tmdbId={id}
                     onAdd={onAddToWatchlist!}
                     onRemove={onRemoveFromWatchlist!}
                     addToLabel={addToWatchlistLabel}
                     noWatchlistLabel={noWatchlistLabel}
                     side="right"
                     align="start"
                  >
                     <DropdownMenu.Trigger asChild>
                        <button
                           type="button"
                           aria-label={addToWatchlistLabel}
                           className="cursor-pointer rounded-full bg-black/70 p-2.5 text-white transition-colors hover:bg-black outline-none focus-visible:ring-2 focus-visible:ring-white"
                           onClick={e => e.stopPropagation()}
                           onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                 e.stopPropagation();
                              }
                           }}
                           onMouseDown={e => e.preventDefault()}
                        >
                           <Plus className="h-4 w-4" />
                        </button>
                     </DropdownMenu.Trigger>
                  </WatchlistPickerMenu>
               </div>
            )}
         </div>
      </>
   );

   if (onClick) {
      return (
         <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
            className="group aspect-2/3 w-full cursor-pointer text-left outline-none"
         >
            {posterContent}
         </div>
      );
   }

   return <div className="group aspect-2/3">{posterContent}</div>;
}
