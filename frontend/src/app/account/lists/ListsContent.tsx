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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { PageFade } from '@/components/ui/PageFade';
import { lazy, Suspense, useEffect, useState } from 'react';
import { ListCard } from '@/components/List/ListCard';
import { ListCardGrid } from '@/components/List/ListCardGrid';
import { LibraryEmpty } from '@/components/List/LibraryEmpty';
import { useAuth } from '@/context/auth-context';
// Dialogs en lazy : importés statiquement, leurs ~870 lignes (+ deps) partaient
// dans le chunk initial de la page et gonflaient le Total Blocking Time à
// l'hydratation, alors qu'ils ne servent qu'à l'interaction. Le chunk ne se
// charge qu'à la première ouverture (cf. private/lighthouse.md §7).
const CreateListDialog = lazy(() =>
  import('@/components/List/modal/CreateListDialog').then((m) => ({
    default: m.CreateListDialog,
  })),
);
const DeleteListDialog = lazy(() =>
  import('@/components/List/modal/DeleteListDialog').then((m) => ({
    default: m.DeleteListDialog,
  })),
);
const EditListDialog = lazy(() =>
  import('@/components/List/modal/EditListDialog').then((m) => ({
    default: m.EditListDialog,
  })),
);
import { Section } from '@/components/layout/Section';
import { Button } from '@/components/ui/button';
import { watchlists as watchlistsApi, type Watchlist } from '@/api';
import { watchlistsQueries } from '@/api/queries';
import { useScrollToTopOnMount } from '@/hooks/useScrollToTopOnMount';
import { useLanguageStore } from '@/store/language';
import { useListFiltersStore } from '@/store/listFilters';
import { useIsMounted } from '@/hooks/useIsMounted';

// Skeleton component
const ListCardSkeleton = () => (
  <div className="bg-muted/30 rounded-lg p-2 max-[749px]:rounded-none max-[749px]:bg-transparent max-[749px]:p-0">
    <div className="bg-muted/50 aspect-square w-full rounded-md max-[749px]:rounded" />
    <div className="mt-3 space-y-2 max-[749px]:mt-2">
      <div className="bg-muted/50 h-4 w-3/4 rounded" />
      <div className="bg-muted/50 h-3 w-1/2 rounded max-[749px]:hidden" />
    </div>
  </div>
);

interface SortableWatchlistCardProps {
  watchlist: Watchlist;
  onEdit: (watchlist: Watchlist) => void;
  onDelete: (watchlist: Watchlist) => void;
  priority?: boolean;
  imageFetchPriority?: 'high' | 'auto' | 'low';
}

function SortableWatchlistCard({
  watchlist,
  onEdit,
  onDelete,
  priority = false,
  imageFetchPriority,
}: SortableWatchlistCardProps) {
  const { content } = useLanguageStore();

  // Use isOwner flag from backend
  const isOwner = watchlist.isOwner ?? false;

  // Enable drag for all watchlists (each user has their own watchlistsOrder)
  const isDraggable = true;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: watchlist.id,
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
      href={`/lists/${watchlist.id}`}
      onEdit={isOwner ? onEdit : undefined}
      onDelete={isOwner ? onDelete : undefined}
      showMenu={isOwner}
      showSavedBadge={!isOwner && !watchlist.isCollaborator && watchlist.isSaved}
      showCollaborativeBadge={(watchlist.collaborators?.length ?? 0) > 0}
      priority={priority}
      imageFetchPriority={imageFetchPriority}
      draggableProps={{
        ref: setNodeRef,
        style,
        attributes,
        listeners: isDraggable ? listeners : {},
      }}
    />
  );
}

function ListsContentInner() {
  const { content } = useLanguageStore();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { showOwned, showSaved, toggleOwned, toggleSaved } = useListFiltersStore();
  const mounted = useIsMounted();

  const queryClient = useQueryClient();
  const mineKey = watchlistsQueries.mine().queryKey;

  const { data, isPending: loading, refetch } = useQuery(watchlistsQueries.mine());
  const watchlists = data?.watchlists ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(null);
  // Passe à true à la 1ère ouverture du dialog de création et n'en bouge plus :
  // garde le dialog monté après fermeture (animation de sortie + état conservés).
  const [createDialogTouched, setCreateDialogTouched] = useState(false);
  useEffect(() => {
    if (dialogOpen) setCreateDialogTouched(true);
  }, [dialogOpen]);

  useScrollToTopOnMount();

  // Redirect to local lists if not authenticated (wait for auth to load first)
  useEffect(() => {
    if (!authLoading && user === null) {
      navigate({ to: '/local/lists' as never });
    }
  }, [user, authLoading, navigate]);

  // Refetch when page is restored from bfcache (browser back)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        refetch();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [refetch]);

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = watchlists.findIndex((w) => w.id === active.id);
      const newIndex = watchlists.findIndex((w) => w.id === over.id);

      const newWatchlists = arrayMove(watchlists, oldIndex, newIndex);
      const previous = queryClient.getQueryData(mineKey);

      // Optimistic update du cache TQ
      queryClient.setQueryData(mineKey, { watchlists: newWatchlists });

      try {
        const allWatchlistIds = newWatchlists.map((w) => w.id);
        await watchlistsApi.reorderWatchlists(allWatchlistIds);
      } catch (error) {
        console.error('Failed to reorder watchlists:', error);
        // Rollback
        if (previous) queryClient.setQueryData(mineKey, previous);
        queryClient.invalidateQueries({ queryKey: mineKey });
      }
    }
  };

  const handleCreateSuccess = async (newWatchlist?: Watchlist) => {
    if (newWatchlist) {
      // Optimistic prepend + refetch en background
      queryClient.setQueryData(mineKey, { watchlists: [newWatchlist, ...watchlists] });
      queryClient.invalidateQueries({ queryKey: mineKey });
    } else {
      queryClient.invalidateQueries({ queryKey: mineKey });
    }
  };

  // Sur mobile (< 750px) les boutons de filtre sont masqués → on garde les deux
  // filtres actifs (afficher toutes les listes). matchMedia évalué après mount.
  const isMobile =
    mounted && typeof window !== 'undefined' && window.matchMedia('(max-width: 749px)').matches;
  // `!mounted ||` : avant le montage (SSR + 1er rendu client), on affiche TOUT.
  // Sinon le HTML SSR omettait les listes suivies (showSaved=false par défaut,
  // store pas encore réhydraté) et elles s'inséraient dans la grille après
  // l'hydratation → gros Cumulative Layout Shift dès qu'une suivie n'était pas
  // en fin de liste (toutes les cards se décalaient). Rendre la grille complète
  // dès le SSR = zéro insertion. Un utilisateur desktop ayant explicitement
  // filtré verra l'ajustement au rehydrate : cas minoritaire et choix explicite.
  const showOwnedEff = !mounted || isMobile || showOwned;
  const showSavedEff = !mounted || isMobile || showSaved;

  // Filter watchlists based on selected filters
  const filteredWatchlists = watchlists.filter((watchlist) => {
    // Use flags from backend
    const isOwner = watchlist.isOwner ?? false;
    const isCollaborator = watchlist.isCollaborator ?? false;
    const isSaved = watchlist.isSaved ?? false;

    // "Mes watchlists" filter: show owned watchlists AND collaborative watchlists
    if (showOwnedEff && (isOwner || isCollaborator)) {
      return true;
    }

    // "Suivies" filter: show followed watchlists (not owned, not collaborative)
    if (showSavedEff && isSaved && !isOwner && !isCollaborator) {
      return true;
    }

    return false;
  });

  return (
    <Section className="mb-20 max-[749px]:mb-2">
      {/* Title */}
      <div className="mt-0 mb-1 max-[749px]:mb-5">
        <h1 className="text-3xl font-bold text-white max-[749px]:text-[28px]">
          {content.watchlists.title}
        </h1>
      </div>

      {/* Filters and Create Button */}
      <div className="mb-8 flex items-end justify-between max-[749px]:mb-6">
        <div className="flex items-end gap-2 max-[749px]:hidden">
          <button
            type="button"
            onClick={toggleOwned}
            className={`focus-visible:ring-offset-background h-[31px] cursor-pointer rounded-md px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none ${
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
            className={`focus-visible:ring-offset-background h-[31px] cursor-pointer rounded-md px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none ${
              showSaved
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {content.watchlists.followed || 'Suivies'}
          </button>
        </div>

        <Button
          className="corner-squircle focus-visible:ring-offset-background cursor-pointer rounded-2xl focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none max-[749px]:w-full max-[749px]:justify-center"
          onClick={(e) => {
            // Blur avant l'ouverture de la modale (warning aria-hidden Chrome)
            e.currentTarget.blur();
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          {content.watchlists.createWatchlist}
        </Button>
      </div>

      {/* Monté à la 1ère ouverture puis laissé monté (animation de fermeture
          préservée). Suspense fallback null : rien à afficher pendant le
          chargement du chunk (~1 frame). */}
      {(dialogOpen || createDialogTouched) && (
        <Suspense fallback={null}>
          <CreateListDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onSuccess={handleCreateSuccess}
          />
        </Suspense>
      )}

      {selectedWatchlist && (
        <Suspense fallback={null}>
          <EditListDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: mineKey })}
            watchlist={selectedWatchlist}
          />
          <DeleteListDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: mineKey })}
            watchlist={selectedWatchlist}
          />
        </Suspense>
      )}

      {loading ? (
        <ListCardGrid>
          {Array.from({ length: 10 }).map((_, i) => (
            <ListCardSkeleton key={i} />
          ))}
        </ListCardGrid>
      ) : filteredWatchlists.length === 0 ? (
        watchlists.length === 0 ? (
          <LibraryEmpty
            title={content.watchlists.noWatchlists}
            titleMobile={content.watchlists.noWatchlistsMobile}
            description={content.watchlists.createWatchlistDescription}
            descriptionMobile={content.watchlists.createWatchlistDescriptionMobile}
          />
        ) : (
          <LibraryEmpty
            title={content.watchlists.noWatchlistsInCategory || 'Aucune liste dans cette catégorie'}
            description={
              content.watchlists.adjustFilters || 'Ajustez les filtres pour voir plus de listes'
            }
          />
        )
      ) : (
        <DndContext
          id="dnd-account-lists"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredWatchlists.map((w) => w.id)}
            strategy={rectSortingStrategy}
          >
            {/* Grid */}
            <ListCardGrid>
              {filteredWatchlists.map((watchlist, index) => (
                <SortableWatchlistCard
                  key={watchlist.id}
                  watchlist={watchlist}
                  onEdit={(wl) => {
                    setSelectedWatchlist(wl);
                    setEditDialogOpen(true);
                  }}
                  onDelete={(wl) => {
                    setSelectedWatchlist(wl);
                    setDeleteDialogOpen(true);
                  }}
                  priority={index < 4}
                  // Priorité réseau étagée selon l'ordre d'affichage : les
                  // covers du haut chargent avant celles du bas.
                  imageFetchPriority={index < 4 ? 'high' : index < 10 ? 'auto' : 'low'}
                />
              ))}
            </ListCardGrid>
          </SortableContext>
        </DndContext>
      )}
    </Section>
  );
}

export function ListsContent() {
  return (
    <PageFade>
        <ListsContentInner />
    </PageFade>
  );
}
