"use client";

import {
   closestCenter,
   DndContext,
   type DragEndEvent,
   KeyboardSensor,
   MouseSensor,
   TouchSensor,
   useSensor,
   useSensors,
} from "@dnd-kit/core";
import {
   arrayMove,
   rectSortingStrategy,
   SortableContext,
   sortableKeyboardCoordinates,
   useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Film, Plus } from "lucide-react";
import { domAnimation, LazyMotion, m } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ListCard } from "@/components/List/ListCard";
import { useAuth } from "@/context/auth-context";
import { CreateListDialog } from "@/components/List/modal/CreateListDialog";
import { DeleteListDialog } from "@/components/List/modal/DeleteListDialog";
import { EditListDialog } from "@/components/List/modal/EditListDialog";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import {
   Empty,
   EmptyDescription,
   EmptyHeader,
   EmptyMedia,
   EmptyTitle,
} from "@/components/ui/empty";
import { PageReveal } from "@/components/ui/PageReveal";
import type { Watchlist } from "@/lib/api-client";
import { watchlistAPI } from "@/lib/api-client";
import { useRegisterSection } from "@/hooks/usePageReady";
import { useLanguageStore } from "@/store/language";
import { useListFiltersStore } from "@/store/listFilters";

interface SortableWatchlistCardProps {
   watchlist: Watchlist;
   onEdit: (watchlist: Watchlist) => void;
   onDelete: (watchlist: Watchlist) => void;
   priority?: boolean;
}

function SortableWatchlistCard({
   watchlist,
   onEdit,
   onDelete,
   priority = false,
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
         showVisibility={true}
         showSavedBadge={!isOwner && !watchlist.isCollaborator && watchlist.isSaved}
         showCollaborativeBadge={watchlist.isCollaborator === true}
         priority={priority}
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
   const router = useRouter();
   const { showOwned, showSaved, toggleOwned, toggleSaved } = useListFiltersStore();

   // Register section for coordinated loading
   const { markReady } = useRegisterSection('user-watchlists');

   const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
   const [loading, setLoading] = useState(true);
   // Track if initial load is done (for cascade vs pop animation)
   const [initialLoadDone, setInitialLoadDone] = useState(false);
   const [dialogOpen, setDialogOpen] = useState(false);
   const [editDialogOpen, setEditDialogOpen] = useState(false);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(null);

   // Redirect to local lists if not authenticated (wait for auth to load first)
   useEffect(() => {
      if (!authLoading && user === null) {
         router.push("/local/lists");
      }
   }, [user, authLoading, router]);

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

   const fetchWatchlists = useCallback(async (showLoading = true, shouldMarkReady = true) => {
      try {
         if (showLoading) {
            setLoading(true);
         }
         const data = await watchlistAPI.getMine();
         setWatchlists(data.watchlists);
      } catch (error) {
         console.error("Failed to fetch watchlists:", error);
      } finally {
         if (showLoading) {
            setLoading(false);
         }
         if (shouldMarkReady) {
            markReady();
            // Mark initial load as done after PageReveal animation completes
            setTimeout(() => setInitialLoadDone(true), 100);
         }
      }
   }, [markReady]);

   const handleDragEnd = async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
         const oldIndex = watchlists.findIndex((w) => w.id === active.id);
         const newIndex = watchlists.findIndex((w) => w.id === over.id);

         const newWatchlists = arrayMove(watchlists, oldIndex, newIndex);
         setWatchlists(newWatchlists);

         // Persist to backend - send all watchlist IDs (unified position system)
         try {
            const allWatchlistIds = newWatchlists.map((w) => w.id);
            await watchlistAPI.reorderWatchlists(allWatchlistIds);
         } catch (error) {
            console.error("Failed to reorder watchlists:", error);
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
         setWatchlists((prev) => [newWatchlist, ...prev]);

         // Fetch in background to sync with server (don't show loading spinner, don't trigger markReady again)
         fetchWatchlists(false, false).catch((error) => {
            console.error("Failed to sync watchlists:", error);
         });
      } else {
         // Fallback: full refetch with loading spinner (don't trigger markReady again)
         await fetchWatchlists(true, false);
      }
   };

   // Filter watchlists based on selected filters
   const filteredWatchlists = watchlists.filter((watchlist) => {
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
         <div className="mt-0 mb-3">
            <h1 className="text-3xl font-bold text-white">{content.watchlists.title}</h1>
         </div>

         {/* Filters and Create Button */}
         <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <button
                  type="button"
                  onClick={toggleOwned}
                  className={`focus-visible:ring-offset-background cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none ${
                     showOwned
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
               >
                  {content.watchlists.myWatchlists || "Mes watchlists"}
               </button>
               <button
                  type="button"
                  onClick={toggleSaved}
                  className={`focus-visible:ring-offset-background cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none ${
                     showSaved
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
               >
                  {content.watchlists.followed || "Suivies"}
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

         {loading ? null : filteredWatchlists.length === 0 ? (
            <Empty>
               <EmptyHeader>
                  <EmptyMedia variant="icon">
                     <Film strokeWidth={1.4} className="text-muted-foreground h-8 w-8" />
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
            <LazyMotion features={domAnimation}>
               <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
               >
                  <SortableContext
                     items={filteredWatchlists.map((w) => w.id)}
                     strategy={rectSortingStrategy}
                  >
                     {/* Initial load: no animation (PageReveal handles reveal) */}
                     {/* After initial load: simple fade on each item for filter changes */}
                     <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {filteredWatchlists.map((watchlist, index) =>
                           initialLoadDone ? (
                              <m.div
                                 key={watchlist.id}
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 transition={{ duration: 0.15 }}
                              >
                                 <SortableWatchlistCard
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
                                 />
                              </m.div>
                           ) : (
                              <div key={watchlist.id}>
                                 <SortableWatchlistCard
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
                                 />
                              </div>
                           )
                        )}
                     </div>
                  </SortableContext>
               </DndContext>
            </LazyMotion>
         )}
      </Section>
   );
}

export function ListsContent() {
   return (
      <PageReveal timeout={3000} minLoadingTime={100} revealDuration={0.3}>
         <ListsContentInner />
      </PageReveal>
   );
}
