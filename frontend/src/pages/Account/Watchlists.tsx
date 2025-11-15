import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { watchlistAPI } from "@/lib/api-client";
import type { Watchlist } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Plus, Film, MoreVertical, Edit, Trash2 } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useLanguageStore } from "@/store/language";
import type { Content } from "@/types/content";
import { CreateWatchlistDialog } from "@/components/Watchlist/CreateWatchlistDialog";
import { EditWatchlistDialog } from "@/components/Watchlist/EditWatchlistDialog";
import { DeleteWatchlistDialog } from "@/components/Watchlist/DeleteWatchlistDialog";
import { useWatchlistThumbnail } from "@/hooks/useWatchlistThumbnail";
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

interface WatchlistCardProps {
  watchlist: Watchlist;
  onEdit: (watchlist: Watchlist) => void;
  onDelete: (watchlist: Watchlist) => void;
  content: Content;
}

function WatchlistCard({
  watchlist,
  onEdit,
  onDelete,
  content,
}: WatchlistCardProps) {
  const navigate = useNavigate();
  const thumbnailUrl = useWatchlistThumbnail(watchlist);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: watchlist._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group cursor-grab rounded-lg p-2 transition-colors hover:bg-[#36363780] active:cursor-grabbing"
    >
      {/* Cover Image */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/account/watchlist/${watchlist._id}`);
        }}
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
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/account/watchlist/${watchlist._id}`);
        }}
        className="line-clamp-2 text-sm font-semibold text-white"
      >
        {watchlist.name}
      </h3>

      <div className="mt-2 text-xs">
        <span
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/account/watchlist/${watchlist._id}`);
          }}
          className="text-muted-foreground"
        >
          {watchlist.isPublic
            ? content.watchlists.public
            : content.watchlists.private}
        </span>
      </div>

      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/account/watchlist/${watchlist._id}`);
          }}
        >
          {watchlist.items.length}{" "}
          {watchlist.items.length === 1
            ? content.watchlists.item
            : content.watchlists.items}
        </span>

        {/* More Menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex h-6 w-6 items-center justify-center rounded opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[180px] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-md"
              sideOffset={5}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              {/* Edit */}
              <DropdownMenu.Item
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                onSelect={() => {
                  onEdit(watchlist);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                <span>{content.watchlists.editWatchlist}</span>
              </DropdownMenu.Item>

              {/* Delete */}
              <DropdownMenu.Item
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-red-500 outline-none transition-colors hover:bg-red-500/10 hover:text-red-500"
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

export function Watchlists() {
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

  const fetchWatchlists = async () => {
    try {
      setLoading(true);
      const data = await watchlistAPI.getMine();
      setWatchlists(data.watchlists);
    } catch (error) {
      console.error("Failed to fetch watchlists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = watchlists.findIndex((w) => w._id === active.id);
      const newIndex = watchlists.findIndex((w) => w._id === over.id);

      const newWatchlists = arrayMove(watchlists, oldIndex, newIndex);
      setWatchlists(newWatchlists);

      // Persist to backend
      try {
        const orderedWatchlistIds = newWatchlists.map((w) => w._id);
        await watchlistAPI.reorderWatchlists(orderedWatchlistIds);
      } catch (error) {
        console.error("Failed to reorder watchlists:", error);
        // Revert on error
        setWatchlists(watchlists);
      }
    }
  };

  useEffect(() => {
    fetchWatchlists();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-10 text-3xl font-bold text-white">
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
      <div className="mb-8 mt-9 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-white">
            {content.watchlists.title}
          </h1>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {content.watchlists.createWatchlist}
        </Button>
      </div>

      <CreateWatchlistDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchWatchlists}
      />

      {selectedWatchlist && (
        <>
          <EditWatchlistDialog
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
          />
        </>
      )}

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
                <WatchlistCard
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
                  content={content}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
