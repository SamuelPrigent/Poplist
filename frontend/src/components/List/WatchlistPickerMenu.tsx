'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Film } from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { PosterGrid } from '@/components/List/PosterGrid';
import type { Watchlist } from '@/api';

interface WatchlistPickerMenuProps {
  watchlists: Watchlist[];
  tmdbId: number;
  onAdd: (watchlistId: string) => void;
  onRemove: (watchlistId: string) => void;
  children: ReactNode;
  addToLabel?: string;
  noWatchlistLabel?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

export function WatchlistPickerMenu({
  watchlists,
  tmdbId,
  onAdd,
  onRemove,
  children,
  addToLabel,
  noWatchlistLabel,
  side = 'bottom',
  align = 'start',
  sideOffset = 5,
}: WatchlistPickerMenuProps) {
  return (
    <DropdownMenu.Root
      onOpenChange={open => {
        if (!open) {
          setTimeout(() => {
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
          }, 0);
        }
      }}
    >
      {children}

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="border-border bg-popover z-50 overflow-hidden rounded-xl border shadow-md"
          side={side}
          align={align}
          sideOffset={sideOffset}
          onClick={e => e.stopPropagation()}
          onCloseAutoFocus={e => e.preventDefault()}
        >
          <div className="max-h-[335px] min-w-[270px] overflow-y-auto p-1 pr-3">
            {addToLabel && (
              <DropdownMenu.Label className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
                {addToLabel}
              </DropdownMenu.Label>
            )}
            {watchlists.length === 0 ? (
              <div className="text-muted-foreground px-2 py-1.5 text-sm">{noWatchlistLabel}</div>
            ) : (
              watchlists.map(watchlist => {
                const isIn = watchlist.items.some(it => it.tmdbId === tmdbId);
                return (
                  <DropdownMenu.Item
                    key={watchlist.id}
                    className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex cursor-pointer items-center gap-3 rounded-lg p-2 text-sm transition-colors outline-none select-none"
                    onSelect={e => {
                      e.preventDefault();
                      if (isIn) {
                        onRemove(watchlist.id);
                      } else {
                        onAdd(watchlist.id);
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                      }
                    }}
                  >
                    <div className="bg-muted relative h-10 w-10 shrink-0 overflow-hidden rounded-md">
                      {watchlist.imageUrl ? (
                        <Image
                          src={watchlist.imageUrl}
                          alt={watchlist.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : watchlist.items.length > 0 ? (
                        <PosterGrid items={watchlist.items} alt={watchlist.name} imageSize="w92" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Film strokeWidth={1} className="text-muted-foreground h-5 w-5" />
                        </div>
                      )}
                    </div>

                    <span className="line-clamp-1 flex-1 text-sm font-medium">
                      {watchlist.name}
                    </span>

                    <div className="relative h-5 w-5 shrink-0">
                      <Image
                        src="/plus2.svg"
                        alt=""
                        width={20}
                        height={20}
                        className={`absolute inset-0 h-5 w-5 transition-opacity duration-200 brightness-0 invert ${
                          isIn ? 'opacity-0' : 'opacity-90'
                        }`}
                      />
                      <Image
                        src="/checkGreenFull.svg"
                        alt=""
                        width={20}
                        height={20}
                        className={`absolute inset-0 h-5 w-5 transition-opacity duration-200 ${
                          isIn ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    </div>
                  </DropdownMenu.Item>
                );
              })
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
