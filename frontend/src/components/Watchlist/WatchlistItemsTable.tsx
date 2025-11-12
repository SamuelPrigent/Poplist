import { useState, useMemo, useEffect } from "react";
import {
  MoreVertical,
  Trash2,
  MoveUp,
  MoveDown,
  Plus,
  Film,
  ArrowUp,
  ArrowDown,
  Eye,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowData,
  type Row,
} from "@tanstack/react-table";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Watchlist, WatchlistItem } from "@/lib/api-client";
import { watchlistAPI } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";
import { cn } from "@/lib/cn";
import { WatchProviderList } from "./WatchProviderBubble";
import { Button } from "@/components/ui/button";
import { ItemDetailsModal } from "./ItemDetailsModal";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

interface WatchlistItemsTableProps {
  watchlist: Watchlist;
  onUpdate: () => void;
}

// Extend RowData for custom meta
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

interface DraggableRowProps {
  item: WatchlistItem;
  index: number;
  row: Row<WatchlistItem>;
  loadingItem: string | null;
  hoveredRow: string | null;
  setHoveredRow: (id: string | null) => void;
  handleRemoveItem: (tmdbId: string) => void;
  handleMoveItem: (tmdbId: string, position: "first" | "last") => void;
  totalItems: number;
  isDragDisabled: boolean;
}

function DraggableRow({
  item,
  index,
  row,
  loadingItem,
  hoveredRow,
  setHoveredRow,
  handleRemoveItem,
  handleMoveItem,
  totalItems,
  isDragDisabled,
}: DraggableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.tmdbId, disabled: isDragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setHoveredRow(item.tmdbId)}
      onMouseLeave={() => setHoveredRow(null)}
      className={cn(
        "group border-b border-border transition-colors duration-150",
        hoveredRow === item.tmdbId && "bg-muted/30",
        !isDragDisabled && "cursor-grab active:cursor-grabbing",
      )}
    >
      {row.getVisibleCells().map((cell, cellIndex: number) => {
        const totalCells = row.getVisibleCells().length;
        // Actions column (last column) and Informations column (second to last) - not draggable
        if (cellIndex === totalCells - 1 || cellIndex === totalCells - 2) {
          return (
            <td
              key={cell.id}
              className="px-4 py-3"
              onClick={(e) => e.stopPropagation()}
            >
              {cellIndex === totalCells - 1 ? (
                <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    className={cn(
                      "cursor-pointer rounded-full p-1 transition-opacity hover:bg-muted",
                      hoveredRow === item.tmdbId
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100",
                    )}
                    disabled={loadingItem === item.tmdbId}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 min-w-[200px] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-md"
                    sideOffset={5}
                  >
                    <DropdownMenu.Item
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      disabled
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      <span>Add to Watchlist</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        →
                      </span>
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-red-500 outline-none transition-colors hover:bg-red-500/10 hover:text-red-500 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      onSelect={() => handleRemoveItem(item.tmdbId)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Remove from Watchlist</span>
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="my-1 h-px bg-border" />

                    <DropdownMenu.Item
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      onSelect={() => handleMoveItem(item.tmdbId, "first")}
                      disabled={index === 0}
                    >
                      <MoveUp className="mr-2 h-4 w-4" />
                      <span>Move to First Position</span>
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      onSelect={() => handleMoveItem(item.tmdbId, "last")}
                      disabled={index === totalItems - 1}
                    >
                      <MoveDown className="mr-2 h-4 w-4" />
                      <span>Move to Last Position</span>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
              ) : (
                // Informations column
                flexRender(cell.column.columnDef.cell, cell.getContext())
              )}
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
}

export function WatchlistItemsTable({
  watchlist,
  //   onUpdate,
}: WatchlistItemsTableProps) {
  const { content } = useLanguageStore();
  const [items, setItems] = useState<WatchlistItem[]>(watchlist.items);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);

  // Sync with parent when watchlist changes
  useEffect(() => {
    setItems(watchlist.items);
  }, [watchlist.items]);

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

  const formatRuntime = (minutes: number | undefined) => {
    if (!minutes) return "—";
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const handleRemoveItem = async (tmdbId: string) => {
    try {
      setLoadingItem(tmdbId);
      // Update local state immediately
      setItems((prev) => prev.filter((item) => item.tmdbId !== tmdbId));
      // Call API
      await watchlistAPI.removeItem(watchlist._id, tmdbId);
      // Don't call onUpdate() to avoid refetching and losing scroll position
    } catch (error) {
      console.error("Failed to remove item:", error);
      alert("Failed to remove item");
      // Revert on error
      setItems(watchlist.items);
    } finally {
      setLoadingItem(null);
    }
  };

  const handleMoveItem = async (tmdbId: string, position: "first" | "last") => {
    try {
      setLoadingItem(tmdbId);
      const itemIndex = items.findIndex((item) => item.tmdbId === tmdbId);
      if (itemIndex === -1) return;

      // Update local state immediately
      const newItems = [...items];
      const [movedItem] = newItems.splice(itemIndex, 1);
      if (position === "first") {
        newItems.unshift(movedItem);
      } else {
        newItems.push(movedItem);
      }
      setItems(newItems);

      // Call API
      await watchlistAPI.moveItem(watchlist._id, tmdbId, position);
      // Don't call onUpdate() to avoid refetching and losing scroll position
    } catch (error) {
      console.error("Failed to move item:", error);
      alert("Failed to move item");
      // Revert on error
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

      // Persist to backend
      try {
        const orderedTmdbIds = newItems.map((item) => item.tmdbId);
        await watchlistAPI.reorderItems(watchlist._id, orderedTmdbIds);
        // Don't call onUpdate() to avoid refetching and resetting the local state
      } catch (error) {
        console.error("Failed to reorder items:", error);
        // Revert on error
        setItems(items);
      }
    }
  };

  // Define columns
  const columns = useMemo<ColumnDef<WatchlistItem>[]>(
    () => [
      {
        id: "index",
        header: content.watchlists.tableHeaders.number,
        cell: (info) => info.row.index + 1,
        size: 45,
      },
      {
        accessorKey: "title",
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <button
              onClick={() => {
                if (!isSorted) {
                  column.toggleSorting(false); // asc
                } else if (isSorted === "asc") {
                  column.toggleSorting(true); // desc
                } else {
                  column.clearSorting(); // custom order
                }
              }}
              className="flex items-center gap-2 hover:text-white"
            >
              {content.watchlists.tableHeaders.title}
              {isSorted === "asc" && <ArrowDown className="h-3 w-3" />}
              {isSorted === "desc" && <ArrowUp className="h-3 w-3" />}
            </button>
          );
        },
        cell: (info) => {
          const item = info.row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
                {item.posterUrl ? (
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    ?
                  </div>
                )}
              </div>
              <span className="font-medium text-white">{item.title}</span>
            </div>
          );
        },
        size: 250,
      },
      {
        accessorKey: "type",
        header: content.watchlists.tableHeaders.type,
        cell: (info) => {
          const type = info.getValue() as "movie" | "tv";
          return (
            <span
              className={cn(
                "inline-block rounded-full px-2 py-1 text-xs font-medium",
                type === "movie"
                  ? "bg-blue-500/10 text-blue-400"
                  : "bg-purple-500/10 text-purple-400",
              )}
            >
              {type === "movie"
                ? content.watchlists.contentTypes.movie
                : content.watchlists.contentTypes.series}
            </span>
          );
        },
        size: 100,
      },
      {
        accessorKey: "platformList",
        header: content.watchlists.tableHeaders.platforms,
        cell: (info) => {
          const rawPlatforms = info.getValue() as unknown;

          // Handle both old format (string[]) and new format (Platform[])
          const platforms: { name: string; logoPath: string }[] = Array.isArray(
            rawPlatforms,
          )
            ? rawPlatforms
                .filter((p) => p !== null && p !== undefined && p !== "")
                .map((p) => {
                  // Handle string format (old data)
                  if (typeof p === "string") {
                    return p.trim() ? { name: p, logoPath: "" } : null;
                  }
                  // Handle object format (new data)
                  if (p && typeof p === "object" && p.name && p.name.trim()) {
                    return { name: p.name, logoPath: p.logoPath || "" };
                  }
                  return null;
                })
                .filter(
                  (p): p is { name: string; logoPath: string } => p !== null,
                )
            : [];

          return <WatchProviderList providers={platforms} maxVisible={4} />;
        },
        size: 160,
      },
      {
        accessorKey: "runtime",
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <button
              onClick={() => {
                if (!isSorted) {
                  column.toggleSorting(false); // asc (shortest to longest)
                } else if (isSorted === "asc") {
                  column.toggleSorting(true); // desc (longest to shortest)
                } else {
                  column.clearSorting(); // custom order
                }
              }}
              className="flex items-center gap-2 hover:text-white"
            >
              {content.watchlists.tableHeaders.duration}
              {isSorted === "asc" && <ArrowDown className="h-3 w-3" />}
              {isSorted === "desc" && <ArrowUp className="h-3 w-3" />}
            </button>
          );
        },
        cell: (info) => {
          const runtime = info.getValue() as number | undefined;
          return (
            <span className="text-sm text-muted-foreground">
              {formatRuntime(runtime)}
            </span>
          );
        },
        size: 120,
      },
      {
        id: "informations",
        header: "Informations",
        cell: (info) => {
          const item = info.row.original;
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedItem(item);
                setDetailsModalOpen(true);
              }}
              className="h-8 gap-1.5 px-3 text-xs"
            >
              <Eye className="h-3 w-3" />
              Aperçu
            </Button>
          );
        },
        size: 120,
      },
      {
        id: "actions",
        header: "",
        cell: () => null,
        size: 80,
      },
    ],
    [content],
  );

  // Determine if we're in custom order mode (no sorting)
  const isCustomOrder = sorting.length === 0;

  // Use sorted items if sorting is active, otherwise use local state
  const displayItems = useMemo(() => {
    if (!isCustomOrder) {
      return items;
    }
    return items;
  }, [items, isCustomOrder]);

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
            <Film className="h-8 w-8 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle>{content.watchlists.noItemsYet}</EmptyTitle>
          <EmptyDescription>
            {content.watchlists.noItemsDescription}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-border bg-muted/30"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground"
                      style={{ width: header.column.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              <SortableContext
                items={displayItems.map((item) => item.tmdbId)}
                strategy={verticalListSortingStrategy}
                disabled={!isCustomOrder}
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
                    handleRemoveItem={handleRemoveItem}
                    handleMoveItem={handleMoveItem}
                    totalItems={displayItems.length}
                    isDragDisabled={!isCustomOrder}
                  />
                ))}
              </SortableContext>
            </tbody>
          </table>
        </DndContext>
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <ItemDetailsModal
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          tmdbId={selectedItem.tmdbId}
          type={selectedItem.type}
          platforms={selectedItem.platformList}
        />
      )}
    </>
  );
}
