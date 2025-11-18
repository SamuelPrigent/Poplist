import { useEffect, useState } from "react";
import { watchlistAPI } from "@/lib/api-client";
import type { Watchlist } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Plus, Film } from "lucide-react";
import { useLanguageStore } from "@/store/language";
import { useWatchlistFiltersStore } from "@/store/watchlistFilters";
import { CreateWatchlistDialog } from "@/components/Watchlist/CreateWatchlistDialog";
import { EditWatchlistDialog } from "@/components/Watchlist/EditWatchlistDialog";
import { DeleteWatchlistDialog } from "@/components/Watchlist/DeleteWatchlistDialog";
import { WatchlistCard } from "@/components/Watchlist/WatchlistCard";
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

interface SortableWatchlistCardProps {
  watchlist: Watchlist;
  onEdit: (watchlist: Watchlist) => void;
  onDelete: (watchlist: Watchlist) => void;
}

function SortableWatchlistCard({
  watchlist,
  onEdit,
  onDelete,
}: SortableWatchlistCardProps) {
  const { content } = useLanguageStore();

  // Use isOwner flag from backend
  const isOwner = watchlist.isOwner ?? false;

  // Disable drag for followed watchlists (not owned by user)
  const isDraggable = isOwner;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: watchlist._id,
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <WatchlistCard
      watchlist={watchlist}
      content={content}
      href={`/account/watchlist/${watchlist._id}`}
      onEdit={isOwner ? onEdit : undefined}
      onDelete={isOwner ? onDelete : undefined}
      showMenu={isOwner}
      showVisibility={true}
      showSavedBadge={!isOwner}
      draggableProps={{
        ref: setNodeRef,
        style,
        attributes,
        listeners: isDraggable ? listeners : {},
      }}
    />
  );
}

export function Watchlists() {
  const { content } = useLanguageStore();
  const { showOwned, showSaved, toggleOwned, toggleSaved } =
    useWatchlistFiltersStore();
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
      //   console.log(
      //     "📦 Watchlists received from backend:",
      //     data.watchlists.map((w) => ({
      //       name: w.name,
      //       isOwner: w.isOwner,
      //       isSaved: w.isSaved,
      //     })),
      //   );
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

  // Filter watchlists based on selected filters
  const filteredWatchlists = watchlists.filter((watchlist) => {
    // Use isOwner flag from backend
    const isOwner = watchlist.isOwner ?? false;

    // If user is owner, show in "Mes watchlists" category
    // If user is not owner (followed watchlist), show in "Suivies" category
    if (isOwner) {
      return showOwned;
    } else {
      return showSaved;
    }
  });

  return (
    <div className="container mx-auto mb-32 px-4 py-8">
      <div className="mb-4 mt-6 flex items-center justify-between">
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

      {/* Filters */}
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={toggleOwned}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            showOwned
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {content.watchlists.myWatchlists || "Mes watchlists"}
        </button>
        <button
          onClick={toggleSaved}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            showSaved
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {content.watchlists.followed || "Suivies"}
        </button>
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

      {filteredWatchlists.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Film className="h-8 w-8 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>
              {watchlists.length === 0
                ? content.watchlists.noWatchlists
                : content.watchlists.noWatchlistsInCategory ||
                  "Aucune watchlist dans cette catégorie"}
            </EmptyTitle>
            <EmptyDescription>
              {watchlists.length === 0
                ? content.watchlists.createWatchlistDescription
                : content.watchlists.adjustFilters ||
                  "Ajustez les filtres pour voir plus de watchlists"}
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
            items={filteredWatchlists.map((w) => w._id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredWatchlists.map((watchlist) => (
                <SortableWatchlistCard
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
