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
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Film, Plus } from 'lucide-react';
import { domAnimation, LazyMotion, m } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { ListCard } from '@/components/List/ListCard';
import { CreateListDialog } from '@/components/List/modal/CreateListDialog';
import { DeleteListDialog } from '@/components/List/modal/DeleteListDialog';
import { EditListDialog } from '@/components/List/modal/EditListDialog';
import { Section } from '@/components/layout/Section';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import type { Watchlist } from '@/lib/api-client';
import { watchlistAPI } from '@/lib/api-client';
import { useLanguageStore } from '@/store/language';
import { useListFiltersStore } from '@/store/listFilters';

interface SortableWatchlistCardProps {
  watchlist: Watchlist;
  onEdit: (watchlist: Watchlist) => void;
  onDelete: (watchlist: Watchlist) => void;
}

function SortableWatchlistCard({ watchlist, onEdit, onDelete }: SortableWatchlistCardProps) {
  const { content } = useLanguageStore();

  // Use isOwner flag from backend
  const isOwner = watchlist.isOwner ?? false;

  // Enable drag for all watchlists (each user has their own watchlistsOrder)
  const isDraggable = true;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: watchlist._id,
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ListCard
      watchlist={watchlist}
      content={content}
      href={`/account/list/${watchlist._id}`}
      onEdit={isOwner ? onEdit : undefined}
      onDelete={isOwner ? onDelete : undefined}
      showMenu={isOwner}
      showVisibility={true}
      showSavedBadge={!isOwner && !watchlist.isCollaborator && watchlist.isSaved}
      showCollaborativeBadge={watchlist.isCollaborator === true}
      draggableProps={{
        ref: setNodeRef,
        style,
        attributes,
        listeners: isDraggable ? listeners : {},
      }}
    />
  );
}

export function ListsContent() {
  const { content } = useLanguageStore();
  const { showOwned, showSaved, toggleOwned, toggleSaved } = useListFiltersStore();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(null);

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
    })
  );

  const fetchWatchlists = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const data = await watchlistAPI.getMine();
      setWatchlists(data.watchlists);
    } catch (error) {
      console.error('Failed to fetch watchlists:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = watchlists.findIndex(w => w._id === active.id);
      const newIndex = watchlists.findIndex(w => w._id === over.id);

      const newWatchlists = arrayMove(watchlists, oldIndex, newIndex);
      setWatchlists(newWatchlists);

      // Persist to backend
      try {
        const orderedWatchlistIds = newWatchlists.map(w => w._id);
        await watchlistAPI.reorderWatchlists(orderedWatchlistIds);
      } catch (error) {
        console.error('Failed to reorder watchlists:', error);
        // Revert on error
        setWatchlists(watchlists);
      }
    }
  };

  useEffect(() => {
    fetchWatchlists();
  }, [fetchWatchlists]);

  const handleCreateSuccess = async (newWatchlist?: Watchlist) => {
    if (newWatchlist) {
      // Optimistic update: add new watchlist to the beginning immediately
      setWatchlists(prev => [newWatchlist, ...prev]);

      // Fetch in background to sync with server (don't show loading spinner)
      fetchWatchlists(false).catch(error => {
        console.error('Failed to sync watchlists:', error);
      });
    } else {
      // Fallback: full refetch with loading spinner
      await fetchWatchlists(true);
    }
  };

  if (loading) {
    return (
      <Section>
        <h1 className="mb-10 text-3xl font-bold text-white">{content.watchlists.title}</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{content.watchlists.loading}</div>
        </div>
      </Section>
    );
  }

  // Filter watchlists based on selected filters
  const filteredWatchlists = watchlists.filter(watchlist => {
    // Use flags from backend
    const isOwner = watchlist.isOwner ?? false;
    const isCollaborator = watchlist.isCollaborator ?? false;
    const isSaved = watchlist.isSaved ?? false;

    // "Mes watchlists" filter: show owned watchlists AND collaborative watchlists
    if (showOwned && (isOwner || isCollaborator)) {
      return true;
    }

    // "Suivies" filter: show followed watchlists (not owned, not collaborative)
    if (showSaved && isSaved && !isOwner && !isCollaborator) {
      return true;
    }

    return false;
  });

  return (
    <Section className="mb-20">
      {/* Title */}
      <div className="mt-0 mb-6">
        <h1 className="mb-1 text-3xl font-bold text-white">{content.watchlists.title}</h1>
        <div className="text-muted-foreground">{content.home.library.subtitle}</div>
      </div>

      {/* Filters and Create Button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleOwned}
            className={`focus-visible:ring-offset-background cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none ${
              showOwned
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {content.watchlists.myWatchlists || 'Mes watchlists'}
          </button>
          <button
            type="button"
            onClick={toggleSaved}
            className={`focus-visible:ring-offset-background cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none ${
              showSaved
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {content.watchlists.followed || 'Suivies'}
          </button>
        </div>

        <Button
          className="corner-squircle focus-visible:ring-offset-background cursor-pointer rounded-2xl focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          {content.watchlists.createWatchlist}
        </Button>
      </div>

      <CreateListDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedWatchlist && (
        <>
          <EditListDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={fetchWatchlists}
            watchlist={selectedWatchlist}
          />
          <DeleteListDialog
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
              <Film className="text-muted-foreground h-8 w-8" />
            </EmptyMedia>
            <EmptyTitle>
              {watchlists.length === 0
                ? content.watchlists.noWatchlists
                : content.watchlists.noWatchlistsInCategory ||
                  'Aucune watchlist dans cette catégorie'}
            </EmptyTitle>
            <EmptyDescription>
              {watchlists.length === 0
                ? content.watchlists.createWatchlistDescription
                : content.watchlists.adjustFilters ||
                  'Ajustez les filtres pour voir plus de watchlists'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <LazyMotion features={domAnimation}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredWatchlists.map(w => w._id)}
              strategy={rectSortingStrategy}
            >
              <m.div
                key={`grid-${showOwned}-${showSaved}`}
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.0005,
                      delayChildren: 0,
                    },
                  },
                }}
                className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              >
                {filteredWatchlists.map(watchlist => (
                  <m.div
                    key={watchlist._id}
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          duration: 0.15,
                        },
                      },
                    }}
                  >
                    <SortableWatchlistCard
                      watchlist={watchlist}
                      onEdit={wl => {
                        setSelectedWatchlist(wl);
                        setEditDialogOpen(true);
                      }}
                      onDelete={wl => {
                        setSelectedWatchlist(wl);
                        setDeleteDialogOpen(true);
                      }}
                    />
                  </m.div>
                ))}
              </m.div>
            </SortableContext>
          </DndContext>
        </LazyMotion>
      )}
    </Section>
  );
}
