import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Watchlist } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Film, MoreVertical, Edit, Trash2 } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useLanguageStore } from "@/store/language";
import type { Content } from "@/types/content";
import { cn } from "@/lib/cn";
import { OfflineIcon } from "@/components/icons/OfflineIcon";
import { CreateWatchlistDialog } from "@/components/Watchlist/CreateWatchlistDialog";
import { EditWatchlistDialogOffline } from "@/components/Watchlist/EditWatchlistDialogOffline";
import { DeleteWatchlistDialog } from "@/components/Watchlist/DeleteWatchlistDialog";
import { useWatchlistThumbnail } from "@/hooks/useWatchlistThumbnail";
import { getLocalWatchlists } from "@/lib/localStorageHelpers";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const STORAGE_KEY = "watchlists";

interface WatchlistCardOfflineProps {
  watchlist: Watchlist;
  onEdit: (watchlist: Watchlist) => void;
  onDelete: (watchlist: Watchlist) => void;
  content: Content;
  draggableProps?: {
    ref: (node: HTMLElement | null) => void;
    style: React.CSSProperties;
    attributes: React.HTMLAttributes<HTMLElement>;
    listeners: React.DOMAttributes<HTMLElement> | undefined;
  };
}

function WatchlistCardOffline({
  watchlist,
  onEdit,
  onDelete,
  content,
  draggableProps,
}: WatchlistCardOfflineProps) {
  const navigate = useNavigate();
  const thumbnailUrl = useWatchlistThumbnail(watchlist);
  const editButtonRef = useRef<HTMLDivElement>(null);
  const deleteButtonRef = useRef<HTMLDivElement>(null);

  // Handle Tab navigation inside dropdown to alternate between Edit and Delete
  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation();

      const editButton = editButtonRef.current;
      const deleteButton = deleteButtonRef.current;

      if (!editButton || !deleteButton) return;

      const activeElement = document.activeElement;

      if (activeElement === editButton || editButton.contains(activeElement)) {
        deleteButton.focus();
      } else {
        editButton.focus();
      }
    }
  };

  return (
    <div
      ref={draggableProps?.ref}
      style={draggableProps?.style}
      {...(draggableProps?.attributes || {})}
      {...(draggableProps?.listeners || {})}
      className="group cursor-pointer rounded-lg p-2 transition-colors hover:bg-[#36363780]"
    >
      {/* Cover Image */}
      <div
        onClick={() => navigate(`/local/watchlist/${watchlist._id}`)}
        className="relative mb-3 aspect-[1/1] w-full overflow-hidden rounded-md bg-muted"
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={watchlist.name}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Film className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Text Info */}
      <h3
        onClick={() => navigate(`/local/watchlist/${watchlist._id}`)}
        className="line-clamp-2 text-sm font-semibold text-white"
      >
        {watchlist.name}
      </h3>

      <div className="mt-2 text-xs">
        <span
          onClick={() => navigate(`/local/watchlist/${watchlist._id}`)}
          className="text-muted-foreground"
        >
          {watchlist.isPublic
            ? content.watchlists.public
            : content.watchlists.private}
        </span>
      </div>

      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span onClick={() => navigate(`/local/watchlist/${watchlist._id}`)}>
          {watchlist.items.length}{" "}
          {watchlist.items.length === 1
            ? content.watchlists.item
            : content.watchlists.items}
        </span>

        {/* More Menu */}
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
              onClick={(e) => e.stopPropagation()}
              className="flex h-6 w-6 items-center justify-center rounded opacity-0 transition-opacity hover:bg-muted focus-visible:opacity-100 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[180px] overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-md"
              sideOffset={5}
              onKeyDown={handleDropdownKeyDown}
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                editButtonRef.current?.focus();
              }}
            >
              {/* Edit */}
              <DropdownMenu.Item
                ref={editButtonRef}
                className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                onSelect={() => {
                  onEdit(watchlist);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                <span>{content.watchlists.editWatchlist}</span>
              </DropdownMenu.Item>

              {/* Delete */}
              <DropdownMenu.Item
                ref={deleteButtonRef}
                className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm text-red-500 outline-none transition-colors hover:bg-red-500/10 hover:text-red-500 focus:bg-red-500/10 focus:text-red-500"
                onSelect={() => {
                  onDelete(watchlist);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>{content.watchlists.deleteWatchlist}</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
}

interface SortableWatchlistCardOfflineProps {
  watchlist: Watchlist;
  onEdit: (watchlist: Watchlist) => void;
  onDelete: (watchlist: Watchlist) => void;
}

function SortableWatchlistCardOffline({
  watchlist,
  onEdit,
  onDelete,
}: SortableWatchlistCardOfflineProps) {
  const { content } = useLanguageStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: watchlist._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <WatchlistCardOffline
      watchlist={watchlist}
      onEdit={onEdit}
      onDelete={onDelete}
      content={content}
      draggableProps={{
        ref: setNodeRef,
        style,
        attributes,
        listeners,
      }}
    />
  );
}

export function WatchlistsOffline() {
  const { content } = useLanguageStore();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(
    null,
  );

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

  const fetchWatchlists = () => {
    try {
      setLoading(true);
      const localWatchlists = getLocalWatchlists();
      // Only show watchlists created locally (ownerId === "offline")
      let ownedWatchlists = localWatchlists.filter(
        (w) => w.ownerId === "offline",
      );

      // Sort by order if it exists, otherwise by creation date (oldest first)
      ownedWatchlists = ownedWatchlists.sort((a, b) => {
        // If both have order, sort by order
        if ((a as any).order !== undefined && (b as any).order !== undefined) {
          return (a as any).order - (b as any).order;
        }
        // If only one has order, it comes first
        if ((a as any).order !== undefined) return -1;
        if ((b as any).order !== undefined) return 1;
        // Otherwise sort by creation date (oldest first)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      setWatchlists(ownedWatchlists);
    } catch (error) {
      console.error("Failed to load watchlists from localStorage:", error);
      setWatchlists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = watchlists.findIndex((w) => w._id === active.id);
      const newIndex = watchlists.findIndex((w) => w._id === over.id);

      const newWatchlists = arrayMove(watchlists, oldIndex, newIndex);
      setWatchlists(newWatchlists);

      // Add order field to each watchlist and save to localStorage
      try {
        const allWatchlists = getLocalWatchlists();
        const watchlistsWithOrder = newWatchlists.map((w, index) => ({
          ...w,
          order: index,
        }));

        // Update only the reordered watchlists in the full list
        const updatedAllWatchlists = allWatchlists.map(w => {
          const reordered = watchlistsWithOrder.find(rw => rw._id === w._id);
          return reordered || w;
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAllWatchlists));
      } catch (error) {
        console.error("Failed to save watchlist order:", error);
        // Revert on error
        setWatchlists(watchlists);
      }
    }
  };

  useEffect(() => {
    fetchWatchlists();
  }, []);

  const handleCreateSuccess = (newWatchlist?: Watchlist) => {
    if (newWatchlist) {
      // Save to localStorage - add new watchlist at the beginning
      const updatedWatchlists = [newWatchlist, ...watchlists];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWatchlists));
    }
    fetchWatchlists();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-white">
          {content.watchlists.title}
        </h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">
            {content.watchlists.loading}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto mb-32 px-4 py-8">
      <div className="mb-3 mt-9 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-white">
            {content.watchlists.title}
          </h1>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          {content.watchlists.createWatchlist}
        </Button>
      </div>

      <CreateWatchlistDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleCreateSuccess}
        offline={true}
      />

      {selectedWatchlist && (
        <>
          <EditWatchlistDialogOffline
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={fetchWatchlists}
            watchlist={selectedWatchlist}
          />
          <DeleteWatchlistDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onSuccess={fetchWatchlists}
            watchlist={selectedWatchlist}
            offline={true}
          />
        </>
      )}

      {/* Data Source Badge */}
      <div className="mb-7">
        <div className="flex w-fit items-center gap-1">
          <p className="text-sm font-light text-slate-300">
            {content.watchlists.notLoggedInWarning}
          </p>
          <OfflineIcon className={cn("h-4 w-4 text-slate-300")} />
        </div>
      </div>

      {watchlists.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Film className="h-8 w-8 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>{content.watchlists.noWatchlists}</EmptyTitle>
            <EmptyDescription>
              {content.watchlists.createWatchlistDescription}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={watchlists.map((w) => w._id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {watchlists.map((watchlist) => (
                <SortableWatchlistCardOffline
                  key={watchlist._id}
                  watchlist={watchlist}
                  onEdit={(wl) => {
                    setSelectedWatchlist(wl);
                    setEditDialogOpen(true);
                  }}
                  onDelete={(wl) => {
                    setSelectedWatchlist(wl);
                    setDeleteDialogOpen(true);
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
