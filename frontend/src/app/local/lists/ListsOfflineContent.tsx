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
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronRight, Database, Edit, Film, MoreVertical, Plus, Trash2 } from "lucide-react";
import { domAnimation, LazyMotion, m } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CreateListDialog } from "@/components/List/modal/CreateListDialog";
import { DeleteListDialog } from "@/components/List/modal/DeleteListDialog";
import { EditListDialogOffline } from "@/components/List/modal/EditListDialogOffline";
import { Button } from "@/components/ui/button";
import {
   Empty,
   EmptyDescription,
   EmptyHeader,
   EmptyMedia,
   EmptyTitle,
} from "@/components/ui/empty";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/context/auth-context";
import { AuthDrawer } from "@/features/auth/AuthDrawer";
import { useListThumbnail } from "@/hooks/useListThumbnail";
import type { Watchlist } from "@/lib/api-client";
import { getLocalWatchlists } from "@/lib/localStorageHelpers";
import { useLanguageStore } from "@/store/language";

type WatchlistWithOrder = Watchlist & { order?: number };

const STORAGE_KEY = "watchlists";

interface WatchlistCardOfflineProps {
   watchlist: Watchlist;
   onEdit: (watchlist: Watchlist) => void;
   onDelete: (watchlist: Watchlist) => void;
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
   draggableProps,
}: WatchlistCardOfflineProps) {
   const { content } = useLanguageStore();
   const router = useRouter();
   const thumbnailUrl = useListThumbnail(watchlist);

   return (
      <div
         ref={draggableProps?.ref}
         style={draggableProps?.style}
         {...(draggableProps?.attributes || {})}
         {...(draggableProps?.listeners || {})}
         tabIndex={0}
         onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
               e.preventDefault();
               router.push(`/local/list/${watchlist.id}`);
            }
         }}
         className="group cursor-pointer rounded-lg p-2 transition-colors hover:bg-[#36363780]"
      >
         {/* Cover Image */}
         <button
            type="button"
            onClick={() => router.push(`/local/list/${watchlist.id}`)}
            tabIndex={-1}
            className="bg-muted relative mb-3 aspect-square w-full cursor-pointer overflow-hidden rounded-md"
         >
            {thumbnailUrl ? (
               <Image
                  src={thumbnailUrl}
                  alt={watchlist.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover"
                  unoptimized
               />
            ) : (
               <div className="flex h-full w-full items-center justify-center">
                  <Film strokeWidth={1.4} className="text-muted-foreground h-12 w-12" />
               </div>
            )}
         </button>

         {/* Text Info */}
         <button
            type="button"
            onClick={() => router.push(`/local/list/${watchlist.id}`)}
            tabIndex={-1}
            className="line-clamp-2 w-full text-left text-sm font-semibold text-white"
         >
            {watchlist.name}
         </button>

         <div className="mt-2 text-xs">
            <button
               type="button"
               onClick={() => router.push(`/local/list/${watchlist.id}`)}
               tabIndex={-1}
               className="text-muted-foreground"
            >
               {watchlist.isPublic ? content.watchlists.public : content.watchlists.private}
            </button>
         </div>

         <div className="text-muted-foreground mt-1 flex items-center justify-between text-xs">
            <button
               type="button"
               onClick={() => router.push(`/local/list/${watchlist.id}`)}
               tabIndex={-1}
            >
               {watchlist.items.length}{" "}
               {watchlist.items.length === 1 ? content.watchlists.item : content.watchlists.items}
            </button>

            {/* More Menu */}
            <DropdownMenu.Root>
               <DropdownMenu.Trigger asChild>
                  <button
                     type="button"
                     onClick={(e) => e.stopPropagation()}
                     className="ml-auto flex h-6 w-6 cursor-pointer items-center justify-center rounded opacity-0 transition-all group-hover:opacity-100 hover:brightness-125 hover:backdrop-brightness-150 focus-visible:opacity-100"
                  >
                     <MoreVertical className="h-4 w-4" />
                  </button>
               </DropdownMenu.Trigger>

               <DropdownMenu.Portal>
                  <DropdownMenu.Content
                     className="border-border bg-popover z-50 min-w-[180px] overflow-hidden rounded-xl border p-1 shadow-md"
                     sideOffset={5}
                  >
                     <DropdownMenu.Item
                        className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex cursor-pointer items-center rounded-lg px-2 py-1.5 text-sm transition-colors outline-none select-none"
                        onSelect={() => onEdit(watchlist)}
                     >
                        <Edit className="mr-2 h-4 w-4" />
                        <span>{content.watchlists.edit}</span>
                     </DropdownMenu.Item>

                     <DropdownMenu.Item
                        className="relative flex cursor-pointer items-center rounded-lg px-2 py-1.5 text-sm text-red-500 transition-colors outline-none select-none hover:bg-red-500/10 hover:text-red-500 focus:bg-red-500/10 focus:text-red-500"
                        onSelect={() => onDelete(watchlist)}
                     >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>{content.watchlists.delete}</span>
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
   const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: watchlist.id,
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
         draggableProps={{
            ref: setNodeRef,
            style,
            attributes,
            listeners,
         }}
      />
   );
}

// Skeleton component
const ListCardSkeleton = () => (
   <div className="bg-muted/30 rounded-lg p-2">
      <div className="bg-muted/50 aspect-square w-full rounded-md" />
      <div className="mt-3 space-y-2">
         <div className="bg-muted/50 h-4 w-3/4 rounded" />
         <div className="bg-muted/50 h-3 w-1/2 rounded" />
      </div>
   </div>
);

function ListsOfflineContentInner() {
   const { content } = useLanguageStore();
   const { user } = useAuth();
   const router = useRouter();
   const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
   const [loading, setLoading] = useState(true);
   const [dialogOpen, setDialogOpen] = useState(false);
   const [editDialogOpen, setEditDialogOpen] = useState(false);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(null);
   const [authDrawerOpen, setAuthDrawerOpen] = useState(false);
   const [popoverOpen, setPopoverOpen] = useState(false);
   const popoverTimeoutRef = useRef<number | null>(null);

   // Redirect to account lists if authenticated
   useEffect(() => {
      if (user) {
         router.push("/account/lists");
      }
   }, [user, router]);

   // Handle popover hover with delay
   const handlePopoverEnter = () => {
      if (popoverTimeoutRef.current) {
         clearTimeout(popoverTimeoutRef.current);
         popoverTimeoutRef.current = null;
      }
      setPopoverOpen(true);
   };

   const handlePopoverLeave = () => {
      popoverTimeoutRef.current = window.setTimeout(() => {
         setPopoverOpen(false);
      }, 150);
   };

   // Cleanup timeout on unmount
   useEffect(() => {
      return () => {
         if (popoverTimeoutRef.current) {
            clearTimeout(popoverTimeoutRef.current);
         }
      };
   }, []);

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

   const fetchWatchlists = useCallback(() => {
      try {
         setLoading(true);
         const localWatchlists = getLocalWatchlists();
         // Only show watchlists created locally (ownerId === "offline")
         let ownedWatchlists = localWatchlists.filter((w) => w.ownerId === "offline");

         // Sort by order if it exists, otherwise by creation date (oldest first)
         ownedWatchlists = ownedWatchlists.sort((a, b) => {
            const aWithOrder = a as WatchlistWithOrder;
            const bWithOrder = b as WatchlistWithOrder;

            if (aWithOrder.order !== undefined && bWithOrder.order !== undefined) {
               return aWithOrder.order - bWithOrder.order;
            }
            if (aWithOrder.order !== undefined) return -1;
            if (bWithOrder.order !== undefined) return 1;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
         });

         setWatchlists(ownedWatchlists);
      } catch (error) {
         console.error("Failed to load watchlists from localStorage:", error);
         setWatchlists([]);
      } finally {
         setLoading(false);
      }
   }, []);

   const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
         const oldIndex = watchlists.findIndex((w) => w.id === active.id);
         const newIndex = watchlists.findIndex((w) => w.id === over.id);

         const newWatchlists = arrayMove(watchlists, oldIndex, newIndex);
         setWatchlists(newWatchlists);

         try {
            const allWatchlists = getLocalWatchlists();
            const watchlistsWithOrder = newWatchlists.map((w, index) => ({
               ...w,
               order: index,
            }));

            const updatedAllWatchlists = allWatchlists.map((w) => {
               const reordered = watchlistsWithOrder.find((rw) => rw.id === w.id);
               return reordered || w;
            });

            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAllWatchlists));
         } catch (error) {
            console.error("Failed to save watchlist order:", error);
            setWatchlists(watchlists);
         }
      }
   };

   useEffect(() => {
      fetchWatchlists();
   }, [fetchWatchlists]);

   const handleCreateSuccess = (newWatchlist?: Watchlist) => {
      if (newWatchlist) {
         const updatedWatchlists = [newWatchlist, ...watchlists];
         localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWatchlists));
      }
      fetchWatchlists();
   };

   if (loading) {
      return (
         <div className="container mx-auto mb-32 min-h-[80vh] w-(--sectionWidth) max-w-(--maxWidth) px-4 py-8">
            <div className="mt-9 mb-3">
               <h1 className="text-3xl font-bold text-white">{content.watchlists.title}</h1>
            </div>
            <div className="mb-7 h-8" /> {/* Placeholder for badge */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
               {Array.from({ length: 8 }).map((_, i) => (
                  <ListCardSkeleton key={i} />
               ))}
            </div>
         </div>
      );
   }

   return (
      <div className="container mx-auto mb-32 min-h-[80vh] w-(--sectionWidth) max-w-(--maxWidth) px-4 py-8">
         <div className="mt-9 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <h1 className="text-3xl font-bold text-white">{content.watchlists.title}</h1>
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
            offline={true}
         />

         {selectedWatchlist && (
            <>
               <EditListDialogOffline
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
                  offline={true}
               />
            </>
         )}

         {/* Data Source Badge with Signup Popover */}
         <div className="mb-7">
            <Popover open={popoverOpen} onOpenChange={() => {}}>
               <PopoverTrigger asChild>
                  <div
                     role="button"
                     tabIndex={0}
                     className="flex w-fit cursor-default items-center gap-2 rounded-full bg-slate-800/60 px-3 py-[6px] text-sm text-gray-400 backdrop-blur-sm transition-all hover:bg-slate-800/80"
                     onMouseEnter={handlePopoverEnter}
                     onMouseLeave={handlePopoverLeave}
                  >
                     <Database className="h-4 w-4 shrink-0 text-slate-400" />
                     <span className="text-sm font-medium text-slate-300 select-none">
                        {content.watchlists.notLoggedInWarning}
                     </span>
                  </div>
               </PopoverTrigger>
               <PopoverContent
                  className="w-72 border-2 border-none bg-transparent p-0"
                  side="bottom"
                  align="start"
                  sideOffset={0}
                  onMouseEnter={handlePopoverEnter}
                  onMouseLeave={handlePopoverLeave}
               >
                  <div className="h-3 w-full bg-transparent" />
                  <div className="border-border bg-popover space-y-4 rounded-2xl border p-5 shadow-lg">
                     <p className="text-sm font-medium text-white">
                        {content.watchlists.offlinePopover.title}
                     </p>
                     <ul className="text-muted-foreground space-y-2.5 text-sm">
                        <li className="flex items-center gap-2">
                           <span className="text-green-500">✓</span>
                           {content.watchlists.offlinePopover.accessEverywhere}
                        </li>
                        <li className="flex items-center gap-2">
                           <span className="text-green-500">✓</span>
                           {content.watchlists.offlinePopover.collaborativeLists}
                        </li>
                        <li className="flex items-center gap-2">
                           <span className="text-green-500">✓</span>
                           {content.watchlists.offlinePopover.shareWithFriends}
                        </li>
                     </ul>
                     <Button
                        variant="secondary"
                        className="corner-squircle focus-visible:ring-offset-background cursor-pointer rounded-2xl focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
                        onClick={() => setAuthDrawerOpen(true)}
                     >
                        {content.watchlists.offlinePopover.signup}
                        <ChevronRight className="ml-1 h-4 w-4" />
                     </Button>
                  </div>
               </PopoverContent>
            </Popover>
         </div>

         <AuthDrawer
            open={authDrawerOpen}
            onClose={() => setAuthDrawerOpen(false)}
            initialMode="signup"
         />

         {watchlists.length === 0 ? (
            <Empty>
               <EmptyHeader>
                  <EmptyMedia variant="icon">
                     <Film strokeWidth={1.4} className="text-muted-foreground h-8 w-8" />
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
               <SortableContext items={watchlists.map((w) => w.id)} strategy={rectSortingStrategy}>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                     {watchlists.map((watchlist) => (
                        <SortableWatchlistCardOffline
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
                        />
                     ))}
                  </div>
               </SortableContext>
            </DndContext>
         )}
      </div>
   );
}

export function ListsOfflineContent() {
   return (
      <LazyMotion features={domAnimation}>
         <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
         >
            <ListsOfflineContentInner />
         </m.div>
      </LazyMotion>
   );
}
