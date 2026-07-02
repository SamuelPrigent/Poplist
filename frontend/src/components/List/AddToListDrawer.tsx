'use client';

import { CirclePlus, Film } from 'lucide-react';
import { Img as Image } from '@/components/ui/Img';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
import { PosterGrid } from '@/components/List/PosterGrid';
import type { Watchlist } from '@/api';
import { useLanguageStore } from '@/store/language';

interface AddToListDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  watchlists: Watchlist[];
  tmdbId: number;
  onAdd: (watchlistId: string) => void;
  onRemove: (watchlistId: string) => void;
}

/**
 * Drawer mobile "Ajouter à une liste" — même UI que la sous-vue "pick" de la
 * fiche média (ItemDetailsModal), mais déclenchable directement depuis un
 * bouton "+" (cards tendances, items d'une liste d'un autre utilisateur…).
 * Remplace le dropdown desktop (WatchlistPickerMenu), trop petit sur mobile.
 */
export function AddToListDrawer({
  open,
  onOpenChange,
  watchlists,
  tmdbId,
  onAdd,
  onRemove,
}: AddToListDrawerProps) {
  const { content } = useLanguageStore();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {/* Hauteur calculée pour afficher exactement 6 lignes complètes (jamais
          de ligne coupée) et garder une distance de swipe courte pour fermer :
          grip 22px (mt-3 + h-1.5 + mb-1) + titre 36px (24 + pb-3) + border 1px
          + padding haut liste 8px + 6 rows × 64px (h-12 + p-2) = 451px. */}
      <DrawerContent className="max-h-[458px]">
        <div className="border-border/60 flex items-center justify-center border-b px-4 pb-3">
          <DrawerTitle className="text-base font-semibold">
            {content.watchlists.addToWatchlist}
          </DrawerTitle>
        </div>
        <DrawerDescription className="sr-only">
          {content.watchlists.addToWatchlist}
        </DrawerDescription>
        {/* flex-1 + min-h-0 : la liste scrolle dans la hauteur du drawer, avec
            un padding bas généreux pour que le dernier élément ne soit jamais
            coupé par l'interface */}
        <div className="min-h-0 flex-1 overflow-y-auto p-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {watchlists.length === 0 ? (
            <div className="text-muted-foreground px-2 py-6 text-center text-sm">
              {content.watchlists.noWatchlist}
            </div>
          ) : (
            watchlists.map((wl) => {
              const isIn = wl.items.some((it) => it.tmdbId === tmdbId);
              return (
                <button
                  key={wl.id}
                  type="button"
                  onClick={() => (isIn ? onRemove(wl.id) : onAdd(wl.id))}
                  className="hover:bg-muted/50 flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors"
                >
                  <div className="bg-muted relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                    {wl.imageUrl ? (
                      <Image
                        src={wl.imageUrl}
                        alt={wl.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : wl.items.length > 0 ? (
                      <PosterGrid items={wl.items} alt={wl.name} imageSize="w92" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Film strokeWidth={1} className="text-muted-foreground h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{wl.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {wl.items.length} {content.watchlists.items}
                    </div>
                  </div>
                  {isIn ? (
                    <Image
                      src="/checkGreenFull.svg"
                      alt=""
                      width={24}
                      height={24}
                      className="h-6 w-6 shrink-0"
                    />
                  ) : (
                    <CirclePlus
                      className="text-muted-foreground h-6 w-6 shrink-0"
                      strokeWidth={1.6}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
