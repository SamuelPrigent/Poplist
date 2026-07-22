'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type Row,
  type RowData,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  Film,
  GripVertical,
  MoreVertical,
  MoveDown,
  MoveUp,
  Trash2,
} from 'lucide-react';
import { Img as Image } from '@/components/ui/Img';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { useAuth } from '@/context/auth-context';
import { invalidateMyWatchlists } from '@/api/invalidations';
import { watchlists as watchlistsApi } from '@/api';
import { createPlaceholderItem, type Watchlist, type WatchlistItem } from '@/api';
import { cn } from '@/lib/cn';
import { formatItemFormat } from '@/lib/format';
import { buildPickerWatchlists, useMyWatchlists } from '@/hooks/useMyWatchlists';
import { AddToListDrawer } from '@/components/List/AddToListDrawer';
import { getTMDBImageUrl, getTMDBLanguage, getTMDBRegion } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguageStore } from '@/store/language';
import type { Content } from '@/types/content';
import { ItemDetailsModal } from './modal/ItemDetailsModal';
import { WatchlistPickerMenu } from './WatchlistPickerMenu';
import { WatchProviderList } from './WatchProviderBubble';
import { CompactWatchProviders, getValidProviders } from './CompactWatchProviders';

// Separate component for poster image with its own loading state
function PosterImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {/* Static background - shown while loading (no pulse to avoid flash) */}
      {!loaded && <div className="bg-muted absolute inset-0" />}
      {/* Actual image with fade-in */}
      <Image
        src={src}
        alt={alt}
        fill
        sizes="48px"
        className={`object-cover transition-opacity duration-150 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setLoaded(true)}
        unoptimized
      />
    </>
  );
}

// Bracket icon component (left/right arrows)
function BracketIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      className={className}
    >
      <title className="invisible">Filter</title>
      <path
        fill="currentColor"
        d="M9.71 6.29a1 1 0 0 0-1.42 0l-5 5a1 1 0 0 0 0 1.42l5 5a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.42L5.41 12l4.3-4.29a1 1 0 0 0 0-1.42m11 5l-5-5a1 1 0 0 0-1.42 1.42l4.3 4.29l-4.3 4.29a1 1 0 0 0 0 1.42a1 1 0 0 0 1.42 0l5-5a1 1 0 0 0 0-1.42"
      />
    </svg>
  );
}

// Sort icon component that shows bracket (neutral), arrow down (asc), or arrow up (desc)
function SortIcon({ sortState }: { sortState: false | 'asc' | 'desc' }) {
  if (sortState === 'asc') {
    return <ArrowDown className="h-4 w-4 text-green-500 transition-all duration-150" />;
  }
  if (sortState === 'desc') {
    return <ArrowUp className="h-4 w-4 text-green-500 transition-all duration-150" />;
  }
  return <BracketIcon className="h-4 w-4 rotate-90 opacity-40 transition-all duration-150" />;
}

interface ListItemsTableProps {
  watchlist: Watchlist;
  onUpdate: (updatedWatchlist?: Watchlist) => void;
  isOwner?: boolean;
  isCollaborator?: boolean;
  currentPage?: number;
  itemsPerPage?: number;
}

// Extend RowData for custom meta
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

interface DraggableRowProps {
  item: WatchlistItem;
  index: number;
  row: Row<WatchlistItem>;
  loadingItem: number | null;
  hoveredRow: number | null;
  setHoveredRow: (id: number | null) => void;
  onDelete: (tmdbId: number) => void;
  handleMoveItem: (tmdbId: number, position: 'first' | 'last') => void;
  totalItems: number;
  isDragDisabled: boolean;
  canEdit: boolean;
  content: Content;
  watchlists: Watchlist[];
  addingTo: number | null;
  handleAddFromRow: (watchlistId: string, tmdbId: string, mediaType: 'movie' | 'tv') => void;
  handleRemoveFromRow: (watchlistId: string, tmdbId: string) => void;
  showCheck: boolean;
  isFocused: boolean;
  onSelect: (tmdbId: number) => void;
  currentWatchlistItems: WatchlistItem[];
  currentWatchlist: Watchlist;
}

// `memo` : pendant le drag, dnd-kit force re-render des rows pour appliquer
// les transforms. Les rows non-bougées n'ont pas besoin de re-render leur
// contenu (poster, providers, tooltips Radix lourdes). Memo + props stables
// = on évite ~5x le re-render coût.
const DraggableRow = memo(function DraggableRow({
  item,
  index,
  row,
  loadingItem,
  hoveredRow,
  setHoveredRow,
  onDelete,
  handleMoveItem,
  totalItems,
  isDragDisabled,
  canEdit,
  content,
  watchlists,
  addingTo,
  handleAddFromRow,
  handleRemoveFromRow,
  showCheck,
  isFocused,
  onSelect,
  currentWatchlistItems,
  currentWatchlist,
}: DraggableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.tmdbId,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Liste du picker via le helper partagé : la liste courante n'est incluse que
  // si on peut l'éditer (corrige le bug d'inclusion d'une liste suivie).
  const pickerWatchlists = buildPickerWatchlists(
    watchlists,
    { ...currentWatchlist, items: currentWatchlistItems },
    canEdit,
  );

  return (
    <tr
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setHoveredRow(item.tmdbId)}
      onMouseLeave={() => setHoveredRow(null)}
      onClick={() => canEdit && onSelect(item.tmdbId)}
      className={cn(
        'group transition-colors duration-150 select-none',
        isFocused && 'bg-muted/50',
        !isFocused && hoveredRow === item.tmdbId && 'bg-muted/30',
      )}
    >
      {row.getVisibleCells().map((cell, cellIndex: number) => {
        const totalCells = row.getVisibleCells().length;
        const isActionsColumn = cellIndex === totalCells - 1;

        // Actions column (last column) - not draggable
        if (isActionsColumn) {
          return (
            <td key={cell.id} className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
              <div
                className={cn(
                  'flex items-center gap-1 transition-opacity',
                  hoveredRow === item.tmdbId || isFocused
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100',
                )}
              >
                {/* Add to watchlist button */}
                <WatchlistPickerMenu
                  watchlists={pickerWatchlists}
                  tmdbId={item.tmdbId}
                  onAdd={(watchlistId) =>
                    handleAddFromRow(
                      watchlistId,
                      item.tmdbId.toString(),
                      item.mediaType as 'movie' | 'tv',
                    )
                  }
                  onRemove={(watchlistId) =>
                    handleRemoveFromRow(watchlistId, item.tmdbId.toString())
                  }
                  addToLabel={content.watchlists.addToWatchlist}
                  noWatchlistLabel={content.watchlists.noWatchlist}
                  side="left"
                  align="start"
                >
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      className="hover:bg-muted cursor-pointer rounded p-2 transition-colors"
                      disabled={addingTo === item.tmdbId}
                      onClick={(e) => e.stopPropagation()}
                      title={content.watchlists.contextMenu.addToWatchlist}
                    >
                      {showCheck ? (
                        <Image
                          src="/checkGreenFull.svg"
                          alt=""
                          width={18}
                          height={18}
                          className="h-[18px] w-[18px]"
                        />
                      ) : (
                        <Image
                          src="/plus2.svg"
                          alt=""
                          width={18}
                          height={18}
                          className="h-[18px] w-[18px] opacity-70 brightness-0 invert"
                        />
                      )}
                    </button>
                  </DropdownMenu.Trigger>
                </WatchlistPickerMenu>

                {/* More options menu - only for canEdit */}
                {canEdit && (
                  <DropdownMenu.Root
                    onOpenChange={(open) => {
                      if (!open) {
                        setTimeout(() => {
                          if (document.activeElement instanceof HTMLElement) {
                            document.activeElement.blur();
                          }
                        }, 0);
                      }
                    }}
                  >
                    <DropdownMenu.Trigger asChild>
                      <button
                        type="button"
                        className="hover:bg-muted cursor-pointer rounded p-2 transition-colors"
                        disabled={loadingItem === item.tmdbId}
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Plus d'options"
                      >
                        <MoreVertical className="text-muted-foreground h-[18px] w-[18px]" />
                      </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="border-border bg-popover z-50 min-w-[180px] overflow-hidden rounded-xl border p-1.5 shadow-xl"
                        sideOffset={5}
                      >
                        <DropdownMenu.Item
                          className="relative flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm text-red-500 transition-colors outline-none select-none hover:bg-red-500/10 focus:bg-red-500/10"
                          onSelect={() => onDelete(item.tmdbId)}
                        >
                          <Trash2 className="mr-2.5 h-4 w-4" />
                          <span>{content.watchlists.contextMenu.removeFromWatchlist}</span>
                        </DropdownMenu.Item>

                        <DropdownMenu.Item
                          className="hover:bg-accent focus:bg-accent relative flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm transition-colors outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50"
                          onSelect={() => handleMoveItem(item.tmdbId, 'first')}
                          disabled={index === 0}
                        >
                          <MoveUp className="mr-2.5 h-4 w-4" />
                          <span>{content.watchlists.contextMenu.moveToFirst}</span>
                        </DropdownMenu.Item>

                        <DropdownMenu.Item
                          className="hover:bg-accent focus:bg-accent relative flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm transition-colors outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50"
                          onSelect={() => handleMoveItem(item.tmdbId, 'last')}
                          disabled={index === totalItems - 1}
                        >
                          <MoveDown className="mr-2.5 h-4 w-4" />
                          <span>{content.watchlists.contextMenu.moveToLast}</span>
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                )}
              </div>
            </td>
          );
        }

        // All other columns (draggable if not disabled)
        return (
          <td
            key={cell.id}
            className="px-4 py-3"
            {...(!isDragDisabled && { ...attributes, ...listeners })}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        );
      })}
    </tr>
  );
});

interface SortableMobileCardProps {
  item: WatchlistItem;
  isDragDisabled: boolean;
  content: Content;
  showCheck: boolean;
  addingTo: number | null;
  /** Premier item de la liste → pas de séparateur au-dessus. */
  isFirst: boolean;
  /** Ouvre le drawer "Ajouter à une liste" (remplace le dropdown desktop, trop petit sur mobile) */
  onOpenPicker: () => void;
  onOpenDetails: () => void;
}

// Carte mobile (< 750px) — remplace totalement la table. Lignes séparées par un
// séparateur (pas de border-card ni de fond), handle GripVertical à gauche.
// DndContext dédié côté parent pour éviter le conflit d'id avec le
// SortableContext de la table.
function SortableMobileCard({
  item,
  isDragDisabled,
  content,
  showCheck,
  addingTo,
  isFirst,
  onOpenPicker,
  onOpenDetails,
}: SortableMobileCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.tmdbId,
    disabled: isDragDisabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const posterUrl = getTMDBImageUrl(item.posterPath, 'w185');
  // formatItemFormat renvoie '—' quand pas de durée/saisons. Dans ce cas on affiche
  // un court '-' (pas le long '—') et SANS séparateur.
  const rawDuration = formatItemFormat(item);
  const hasRealDuration = rawDuration !== '—';
  const duration = hasRealDuration ? rawDuration : '-';
  // On se base sur les providers réellement affichables (mêmes que CompactWatchProviders),
  // sinon un point séparateur orphelin s'affiche pour des plateformes sans logo.
  const hasPlatforms = getValidProviders(item.platformList ?? []).length > 0;

  return (
    <div ref={setNodeRef} style={style} className="relative flex items-stretch">
      {/* Div gauche : le handle porte son padding → toute la zone (padding carte +
          gap) devient cliquable, sans changer le rendu. */}
      {!isDragDisabled && (
        <button
          type="button"
          className="text-muted-foreground/40 hover:text-muted-foreground flex shrink-0 cursor-grab touch-none items-center justify-center self-stretch pr-2 transition-colors active:cursor-grabbing"
          aria-label="Réordonner"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Div droite : séparateur en haut (sauf 1er item) → lignes séparées sans
          border-card. Le séparateur démarre au poster (pas sous le handle). */}
      <div
        className={cn(
          'flex min-w-0 flex-1 items-stretch gap-2.25 py-3 pr-1',
          !isFirst && 'border-border/60 border-t',
        )}
      >
        <button
          type="button"
          onClick={onOpenDetails}
          className="bg-muted relative w-[52px] shrink-0 cursor-pointer self-stretch overflow-hidden rounded-md"
        >
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={item.title ?? ''}
              fill
              sizes="52px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="from-muted to-muted/30 h-full w-full bg-linear-to-br" />
          )}
        </button>

        <div className="min-w-0 flex-1 pr-8">
          <button
            type="button"
            onClick={onOpenDetails}
            className="block max-w-full cursor-pointer truncate text-left font-semibold text-white"
          >
            {item.title}
          </button>
          <span
            className={cn(
              'mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
              item.mediaType === 'movie'
                ? 'bg-blue-500/10 text-blue-400'
                : 'bg-purple-500/10 text-purple-400',
            )}
          >
            {item.mediaType === 'movie'
              ? content.watchlists.contentTypes.movie
              : content.watchlists.contentTypes.series}
          </span>
          <div className="text-muted-foreground mt-2 flex items-end gap-2 pt-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="shrink-0">{duration}</span>
              {hasRealDuration && hasPlatforms && (
                <span className="text-muted-foreground/70 text-2xl leading-none">·</span>
              )}
            </div>
            {hasPlatforms && (
              <CompactWatchProviders providers={item.platformList ?? []} size={24} />
            )}
          </div>
        </div>
      </div>

      {/* Picker +/check — ouvre le drawer "Ajouter à une liste" (mobile).
          Aligné sur le titre (haut de la ligne, sous le séparateur). */}
      <div className="absolute top-3.5 right-0">
        <button
          type="button"
          className="hover:bg-muted cursor-pointer rounded p-1.5 transition-colors"
          disabled={addingTo === item.tmdbId}
          title={content.watchlists.addToWatchlist}
          onClick={(e) => {
            // Blur avant l'ouverture du drawer : sinon vaul pose aria-hidden
            // sur le layout pendant que le bouton garde le focus (warning Chrome)
            e.currentTarget.blur();
            onOpenPicker();
          }}
        >
          {showCheck ? (
            <Image
              src="/checkGreenFull.svg"
              alt=""
              width={18}
              height={18}
              className="h-[18px] w-[18px]"
            />
          ) : (
            <Image
              src="/plus2.svg"
              alt=""
              width={18}
              height={18}
              className="h-[18px] w-[18px] opacity-70 brightness-0 invert"
            />
          )}
        </button>
      </div>
    </div>
  );
}

export function ListItemsTable({
  watchlist,
  onUpdate,
  isOwner = true,
  isCollaborator = false,
  currentPage = 1,
  itemsPerPage,
}: ListItemsTableProps) {
  const { content, language } = useLanguageStore();
  const tmdbLanguage = getTMDBLanguage(language);
  const tmdbRegion = getTMDBRegion(language);
  const queryClient = useQueryClient();

  // Both owners and collaborators can edit
  const canEdit = isOwner || isCollaborator;
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>(watchlist.items);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [loadingItem, setLoadingItem] = useState<number | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);
  // Item dont on ouvre le drawer "Ajouter à une liste" (vue cartes mobile)
  const [mobilePickerItem, setMobilePickerItem] = useState<WatchlistItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const { setMyWatchlists, editableWatchlists, isInAnyOfMyLists } = useMyWatchlists(watchlist.id);
  // setter retiré : setAddingTo n'était appelé que par handleAddToWatchlist
  // (dead code supprimé). Le getter reste utilisé pour disabled state.
  const [addingTo] = useState<number | null>(null);
  // Sélection de ligne (style Spotify) : fond persistant + suppression clavier.
  // Ce n'est PAS un focus DOM (pas d'outline), juste un état visuel.
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  // Pile d'annulation des suppressions, propre à la liste en cours (en mémoire,
  // vidée à l'unmount / changement de liste).
  const [undoStack, setUndoStack] = useState<Array<{ item: WatchlistItem; index: number }>>([]);

  // Refs pour le listener clavier global (évite les closures périmées).
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const focusedRowRef = useRef(focusedRow);
  focusedRowRef.current = focusedRow;
  const undoStackRef = useRef(undoStack);
  undoStackRef.current = undoStack;
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  // Sync with parent when watchlist changes
  useEffect(() => {
    setItems(watchlist.items);
  }, [watchlist.items]);

  // Reset sélection + undo quand on change de liste, et sélection quand on change
  // de page de pagination.
  useEffect(() => {
    setFocusedRow(null);
    setUndoStack([]);
  }, [watchlist.id]);

  useEffect(() => {
    setFocusedRow(null);
  }, [currentPage]);

  // Setup drag sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Suppression d'un item de la LISTE COURANTE (point d'entrée unique des 3
  // chemins : touche Backspace, décochage du picker, option « Supprimer »).
  // Push sur la pile d'undo + suppression optimiste + API.
  const deleteFromCurrentList = useCallback(
    async (tmdbId: number) => {
      const currentItems = itemsRef.current;
      const index = currentItems.findIndex((it) => it.tmdbId === tmdbId);
      if (index === -1) return;
      const item = currentItems[index];

      setUndoStack((prev) => [...prev, { item, index }]);

      const newItems = currentItems.filter((it) => it.tmdbId !== tmdbId);
      setItems(newItems);
      setMyWatchlists((prev) =>
        prev.map((wl) =>
          wl.id === watchlist.id
            ? { ...wl, items: wl.items.filter((it) => it.tmdbId !== tmdbId) }
            : wl,
        ),
      );
      setFocusedRow((prev) => (prev === tmdbId ? null : prev));

      try {
        await watchlistsApi.removeItem(watchlist.id, String(tmdbId));
        onUpdate({ ...watchlist, items: newItems });
        invalidateMyWatchlists(queryClient);
      } catch (error) {
        console.error('Failed to delete item:', error);
        setItems(currentItems);
        setMyWatchlists((prev) =>
          prev.map((wl) =>
            wl.id === watchlist.id && !wl.items.some((it) => it.tmdbId === tmdbId)
              ? { ...wl, items: [...wl.items, item] }
              : wl,
          ),
        );
        setUndoStack((prev) => prev.slice(0, -1));
        toast.error('Erreur lors de la suppression');
      }
    },
    [watchlist, onUpdate, queryClient, setMyWatchlists],
  );

  // Annulation (Cmd/Ctrl+Z) : restaure le dernier item supprimé à sa position
  // d'origine (insert optimiste + addItem puis reorderItems côté serveur).
  const undoLastDelete = useCallback(async () => {
    const stack = undoStackRef.current;
    if (stack.length === 0) return;
    const { item, index } = stack[stack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    const currentItems = itemsRef.current;
    const insertAt = Math.min(index, currentItems.length);
    const newItems = [...currentItems];
    newItems.splice(insertAt, 0, item);
    setItems(newItems);
    setMyWatchlists((prev) =>
      prev.map((wl) =>
        wl.id === watchlist.id && !wl.items.some((it) => it.tmdbId === item.tmdbId)
          ? { ...wl, items: [...wl.items, item] }
          : wl,
      ),
    );

    try {
      await watchlistsApi.addItem(watchlist.id, {
        tmdbId: String(item.tmdbId),
        mediaType: item.mediaType as 'movie' | 'tv',
        language: tmdbLanguage,
        region: tmdbRegion,
      });
      await watchlistsApi.reorderItems(
        watchlist.id,
        newItems.map((it) => String(it.tmdbId)),
      );
      onUpdate({ ...watchlist, items: newItems });
      invalidateMyWatchlists(queryClient);
    } catch (error) {
      console.error('Failed to undo delete:', error);
      setItems(currentItems);
      toast.error("Erreur lors de l'annulation");
    }
  }, [watchlist, onUpdate, queryClient, tmdbLanguage, tmdbRegion, setMyWatchlists]);

  // Listener clavier global : Backspace/Delete (suppr. ligne sélectionnée),
  // Cmd/Ctrl+Z (undo), Escape (désélection). Gardé contre inputs/dialogs/menus.
  useEffect(() => {
    if (!canEdit) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isTyping =
        active instanceof HTMLElement &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      if (isTyping) return;
      if (
        document.querySelector(
          '[role="dialog"][data-state="open"], [role="menu"][data-state="open"]',
        )
      ) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z')) {
        if (undoStackRef.current.length > 0) {
          e.preventDefault();
          void undoLastDelete();
        }
        return;
      }
      if ((e.key === 'Backspace' || e.key === 'Delete') && focusedRowRef.current != null) {
        e.preventDefault();
        void deleteFromCurrentList(focusedRowRef.current);
        return;
      }
      if (e.key === 'Escape' && focusedRowRef.current != null) {
        setFocusedRow(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canEdit, deleteFromCurrentList, undoLastDelete]);

  // Désélection au clic hors du tableau.
  useEffect(() => {
    if (!canEdit) return;
    const onPointerDown = (e: PointerEvent) => {
      if (tableWrapperRef.current && !tableWrapperRef.current.contains(e.target as Node)) {
        setFocusedRow(null);
      }
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [canEdit]);

  const handleAddFromDetails = async (
    watchlistId: string,
    tmdbId: string,
    mediaType: 'movie' | 'tv',
  ) => {
    const idNum = Number(tmdbId);
    const placeholder = createPlaceholderItem({
      tmdbId: idNum,
      title: '',
      posterPath: null,
      mediaType,
    });
    setMyWatchlists((prev) =>
      prev.map((wl) =>
        wl.id === watchlistId && !wl.items.some((it) => it.tmdbId === idNum)
          ? { ...wl, items: [...wl.items, placeholder] }
          : wl,
      ),
    );
    if (watchlistId === watchlist.id) {
      setItems((prev) => (prev.some((it) => it.tmdbId === idNum) ? prev : [...prev, placeholder]));
    }
    try {
      await watchlistsApi.addItem(watchlistId, {
        tmdbId,
        mediaType,
        language: tmdbLanguage,
        region: tmdbRegion,
      });
      invalidateMyWatchlists(queryClient);
      if (watchlistId === watchlist.id) {
        onUpdate();
      }
      toast.success('Ajouté à la liste');
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      setMyWatchlists((prev) =>
        prev.map((wl) =>
          wl.id === watchlistId
            ? { ...wl, items: wl.items.filter((it) => it.tmdbId !== idNum) }
            : wl,
        ),
      );
      if (watchlistId === watchlist.id) {
        setItems((prev) => prev.filter((it) => it.tmdbId !== idNum));
      }
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleRemoveFromDetails = async (watchlistId: string, tmdbId: string) => {
    // Décochage de la liste COURANTE → suppression annulable (undo).
    if (watchlistId === watchlist.id) {
      await deleteFromCurrentList(Number(tmdbId));
      return;
    }
    // Retrait d'une AUTRE de mes listes (picker uniquement, non annulable).
    const idNum = Number(tmdbId);
    let removed: WatchlistItem | undefined;
    setMyWatchlists((prev) =>
      prev.map((wl) => {
        if (wl.id !== watchlistId) return wl;
        removed = wl.items.find((it) => it.tmdbId === idNum);
        return { ...wl, items: wl.items.filter((it) => it.tmdbId !== idNum) };
      }),
    );
    try {
      await watchlistsApi.removeItem(watchlistId, tmdbId);
      invalidateMyWatchlists(queryClient);
      toast.success('Retiré de la liste');
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      toast.error('Erreur lors du retrait');
      if (removed) {
        const restored = removed;
        setMyWatchlists((prev) =>
          prev.map((wl) =>
            wl.id === watchlistId ? { ...wl, items: [...wl.items, restored] } : wl,
          ),
        );
      }
    }
  };

  const handleMoveItem = async (tmdbId: number, position: 'first' | 'last') => {
    try {
      setLoadingItem(tmdbId);
      const itemIndex = items.findIndex((item) => item.tmdbId === tmdbId);
      if (itemIndex === -1) return;

      const newItems = [...items];
      const [movedItem] = newItems.splice(itemIndex, 1);
      if (position === 'first') {
        newItems.unshift(movedItem);
      } else {
        newItems.push(movedItem);
      }
      setItems(newItems);

      await watchlistsApi.moveItem(watchlist.id, tmdbId.toString(), position);

      // Notify parent with updated watchlist (no loading flicker)
      onUpdate({ ...watchlist, items: newItems });
    } catch (error) {
      console.error('Failed to move item:', error);
      alert('Failed to move item');
      setItems(watchlist.items);
    } finally {
      setLoadingItem(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.tmdbId === active.id);
      const newIndex = items.findIndex((item) => item.tmdbId === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      try {
        const orderedTmdbIds = newItems.map((item) => item.tmdbId.toString());
        await watchlistsApi.reorderItems(watchlist.id, orderedTmdbIds);

        // Notify parent with updated watchlist (no loading flicker)
        onUpdate({ ...watchlist, items: newItems });
      } catch (error) {
        console.error('Failed to reorder items:', error);
        setItems(items);
      }
    }
  };

  // Define columns
  const columns = useMemo<ColumnDef<WatchlistItem>[]>(
    () => [
      {
        id: 'index',
        header: content.watchlists.tableHeaders.number,
        cell: (info) => info.row.index + 1,
        size: 39,
      },
      {
        accessorKey: 'title',
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <div
              onClick={() => {
                if (!isSorted) {
                  column.toggleSorting(false);
                } else if (isSorted === 'asc') {
                  column.toggleSorting(true);
                } else {
                  column.clearSorting();
                }
              }}
              className="focus-visible:outline-primary flex w-full cursor-pointer items-center gap-2 transition-colors duration-150 hover:text-white focus-visible:outline-2"
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!isSorted) {
                    column.toggleSorting(false);
                  } else if (isSorted === 'asc') {
                    column.toggleSorting(true);
                  } else {
                    column.clearSorting();
                  }
                }
              }}
            >
              {content.watchlists.tableHeaders.title}
              <SortIcon sortState={isSorted} />
            </div>
          );
        },
        cell: (info) => {
          const item = info.row.original;
          const rowIndex = info.row.index;
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedItem(item);
                setSelectedIndex(rowIndex);
                setDetailsModalOpen(true);
              }}
              className="group/cell flex cursor-pointer items-center gap-3 text-left"
            >
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded">
                {item.posterPath ? (
                  <>
                    <PosterImage
                      src={getTMDBImageUrl(item.posterPath, 'w92') || ''}
                      alt={item.title ?? ''}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover/cell:opacity-100">
                      <Eye className="h-5 w-5 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center">
                    ?
                  </div>
                )}
              </div>
              <span className="font-medium text-white underline-offset-2 transition-colors group-hover/cell:underline">
                {item.title}
              </span>
            </button>
          );
        },
        size: 250,
      },
      {
        accessorKey: 'mediaType',
        header: content.watchlists.tableHeaders.type,
        cell: (info) => {
          const type = info.getValue() as 'movie' | 'tv';
          return (
            <span
              className={cn(
                'inline-block rounded-full px-2 py-1 text-xs font-medium',
                type === 'movie'
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'bg-purple-500/10 text-purple-400',
              )}
            >
              {type === 'movie'
                ? content.watchlists.contentTypes.movie
                : content.watchlists.contentTypes.series}
            </span>
          );
        },
        size: 80,
      },
      {
        accessorKey: 'platformList',
        header: content.watchlists.tableHeaders.platforms,
        cell: (info) => {
          const rawPlatforms = info.getValue() as unknown;

          const platforms: { name: string; logoPath: string }[] = Array.isArray(rawPlatforms)
            ? rawPlatforms
                .filter((p) => p !== null && p !== undefined && p !== '')
                .map((p) => {
                  if (typeof p === 'string') {
                    return p.trim() ? { name: p, logoPath: '' } : null;
                  }
                  if (p && typeof p === 'object' && p.name && p.name.trim()) {
                    return { name: p.name, logoPath: p.logoPath || '' };
                  }
                  return null;
                })
                .filter((p): p is { name: string; logoPath: string } => p !== null)
            : [];

          return <WatchProviderList providers={platforms} maxVisible={4} />;
        },
        size: 160,
      },
      {
        id: 'format',
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <div
              onClick={() => {
                if (!isSorted) {
                  column.toggleSorting(false);
                } else if (isSorted === 'asc') {
                  column.toggleSorting(true);
                } else {
                  column.clearSorting();
                }
              }}
              className="focus-visible:outline-primary flex w-full cursor-pointer items-center gap-2 transition-colors duration-150 hover:text-white focus-visible:outline-2"
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!isSorted) {
                    column.toggleSorting(false);
                  } else if (isSorted === 'asc') {
                    column.toggleSorting(true);
                  } else {
                    column.clearSorting();
                  }
                }
              }}
            >
              Format
              <SortIcon sortState={isSorted} />
            </div>
          );
        },
        accessorFn: (row) => {
          if (row.mediaType === 'tv' && row.numberOfEpisodes) {
            return row.numberOfEpisodes * 35;
          }
          return row.runtime || 0;
        },
        cell: (info) => (
          <span className="text-muted-foreground text-sm">
            {formatItemFormat(info.row.original)}
          </span>
        ),
        size: 150,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: () => null,
        size: 120,
      },
    ],
    [content],
  );

  const isCustomOrder = sorting.length === 0;

  const displayItems = useMemo(() => {
    let itemsToDisplay = items;

    if (itemsPerPage !== undefined && itemsPerPage < items.length) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      itemsToDisplay = items.slice(startIndex, endIndex);
    }

    return itemsToDisplay;
  }, [items, currentPage, itemsPerPage]);

  const handleNavigatePrevious = useCallback(() => {
    if (selectedIndex > 0) {
      const prevItem = displayItems[selectedIndex - 1];
      setSelectedItem(prevItem);
      setSelectedIndex(selectedIndex - 1);
    }
  }, [selectedIndex, displayItems]);

  const handleNavigateNext = useCallback(() => {
    if (selectedIndex < displayItems.length - 1) {
      const nextItem = displayItems[selectedIndex + 1];
      setSelectedItem(nextItem);
      setSelectedIndex(selectedIndex + 1);
    }
  }, [selectedIndex, displayItems]);

  const table = useReactTable({
    data: displayItems,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (items.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Film strokeWidth={1.2} className="text-muted-foreground h-8 w-8" />
          </EmptyMedia>
          <EmptyTitle>{content.watchlists.noItemsYet}</EmptyTitle>
          <EmptyDescription>{content.watchlists.noItemsDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <div ref={tableWrapperRef} className="mb-2 overflow-hidden max-[749px]:hidden">
        <DndContext
          id={`dnd-watchlist-${watchlist.id}`}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full table-fixed">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-border border-b">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-muted-foreground px-4 py-4 text-left text-sm font-normal transition-colors duration-150 select-none"
                      style={{ width: header.column.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              <SortableContext
                items={displayItems.map((item) => item.tmdbId)}
                strategy={verticalListSortingStrategy}
                disabled={!isCustomOrder || !canEdit}
              >
                {table.getRowModel().rows.map((row, index) => (
                  <DraggableRow
                    key={row.original.tmdbId}
                    item={row.original}
                    index={index}
                    row={row}
                    loadingItem={loadingItem}
                    hoveredRow={hoveredRow}
                    setHoveredRow={setHoveredRow}
                    onDelete={deleteFromCurrentList}
                    handleMoveItem={handleMoveItem}
                    totalItems={displayItems.length}
                    isDragDisabled={!isCustomOrder || !canEdit}
                    canEdit={canEdit}
                    content={content}
                    watchlists={editableWatchlists}
                    addingTo={addingTo}
                    handleAddFromRow={handleAddFromDetails}
                    handleRemoveFromRow={handleRemoveFromDetails}
                    showCheck={canEdit || isInAnyOfMyLists(row.original.tmdbId)}
                    isFocused={focusedRow === row.original.tmdbId}
                    onSelect={setFocusedRow}
                    currentWatchlistItems={items}
                    currentWatchlist={watchlist}
                  />
                ))}
              </SortableContext>
            </tbody>
          </table>
        </DndContext>
      </div>

      {/* Vue cartes mobile (< 750px) — remplace totalement la table */}
      <div className="min-[750px]:hidden">
        <DndContext
          id={`dnd-watchlist-mobile-${watchlist.id}`}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={displayItems.map((item) => item.tmdbId)}
            strategy={verticalListSortingStrategy}
            disabled={!isCustomOrder || !canEdit}
          >
            <div>
              {displayItems.map((item, index) => (
                <SortableMobileCard
                  key={item.tmdbId}
                  item={item}
                  isDragDisabled={!isCustomOrder || !canEdit}
                  content={content}
                  showCheck={canEdit || isInAnyOfMyLists(item.tmdbId)}
                  addingTo={addingTo}
                  isFirst={index === 0}
                  onOpenPicker={() => setMobilePickerItem(item)}
                  onOpenDetails={() => {
                    // Blur le bouton poster/titre : sinon vaul pose aria-hidden
                    // sur le layout pendant qu'il garde le focus (warning Chrome)
                    if (document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                    setSelectedItem(item);
                    setSelectedIndex(index);
                    setDetailsModalOpen(true);
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Drawer "Ajouter à une liste" (mobile, + des cartes) */}
      {mobilePickerItem && (
        <AddToListDrawer
          open={!!mobilePickerItem}
          onOpenChange={(open) => {
            if (!open) setMobilePickerItem(null);
          }}
          watchlists={buildPickerWatchlists(editableWatchlists, { ...watchlist, items }, canEdit)}
          tmdbId={mobilePickerItem.tmdbId}
          onAdd={(watchlistId) =>
            handleAddFromDetails(
              watchlistId,
              mobilePickerItem.tmdbId.toString(),
              mobilePickerItem.mediaType as 'movie' | 'tv',
            )
          }
          onRemove={(watchlistId) =>
            handleRemoveFromDetails(watchlistId, mobilePickerItem.tmdbId.toString())
          }
        />
      )}

      {/* Item Details Modal */}
      {selectedItem && (
        <ItemDetailsModal
          open={detailsModalOpen}
          onOpenChange={(open) => {
            setDetailsModalOpen(open);
            if (!open) {
              setSelectedIndex(-1);
            }
          }}
          tmdbId={selectedItem.tmdbId.toString()}
          type={selectedItem.mediaType as 'movie' | 'tv'}
          platforms={selectedItem.platformList ?? undefined}
          onPrevious={selectedIndex > 0 ? handleNavigatePrevious : undefined}
          onNext={selectedIndex < displayItems.length - 1 ? handleNavigateNext : undefined}
          watchlists={buildPickerWatchlists(editableWatchlists, { ...watchlist, items }, canEdit)}
          isAuthenticated={isAuthenticated}
          onAddToWatchlist={(watchlistId) =>
            handleAddFromDetails(
              watchlistId,
              selectedItem.tmdbId.toString(),
              selectedItem.mediaType as 'movie' | 'tv',
            )
          }
          onRemoveFromWatchlist={(watchlistId) =>
            handleRemoveFromDetails(watchlistId, selectedItem.tmdbId.toString())
          }
        />
      )}
    </>
  );
}
