/* eslint-disable react-hooks/refs */
"use client";

import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Edit, Film, MoreVertical, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useListThumbnail } from "@/hooks/useListThumbnail";
import type { Watchlist } from "@/lib/api-client";
import type { Content } from "@/types/content";

interface ListCardProps {
   watchlist: Watchlist;
   content: Content;
   href: string;
   onEdit?: (watchlist: Watchlist) => void;
   onDelete?: (watchlist: Watchlist) => void;
   showMenu?: boolean;
   showOwner?: boolean;
   showVisibility?: boolean;
   showSavedBadge?: boolean;
   showCollaborativeBadge?: boolean;
   categoryGradient?: string;
   priority?: boolean;
   draggableProps?: {
      ref: (node: HTMLElement | null) => void;
      style?: React.CSSProperties;
      attributes?: DraggableAttributes;
      listeners?: DraggableSyntheticListeners;
   };
}

export function ListCard({
   watchlist,
   content,
   href,
   onEdit,
   onDelete,
   showMenu = true,
   showOwner = false,
   showVisibility = false,
   showSavedBadge = false,
   showCollaborativeBadge = false,
   categoryGradient,
   priority = false,
   draggableProps,
}: ListCardProps) {
   const router = useRouter();
   const thumbnailUrl = useListThumbnail(watchlist);
   const editButtonRef = useRef<HTMLDivElement>(null);
   const deleteButtonRef = useRef<HTMLDivElement>(null);

   // Only add onClick handlers for draggable cards
   // Non-draggable cards use Link wrapper for navigation
   const handleClick = draggableProps
      ? (e: React.MouseEvent) => {
           e.stopPropagation();
           window.location.href = href;
        }
      : undefined;

   // Handle Tab navigation inside dropdown to alternate between Edit and Delete
   const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Tab") {
         e.preventDefault();
         e.stopPropagation();

         const editButton = editButtonRef.current;
         const deleteButton = deleteButtonRef.current;

         if (!editButton || !deleteButton) return;

         // Check which element currently has focus
         const activeElement = document.activeElement;

         if (activeElement === editButton || editButton.contains(activeElement)) {
            // Focus is on Edit, move to Delete
            deleteButton.focus();
         } else {
            // Focus is on Delete (or nowhere), move to Edit
            editButton.focus();
         }
      }
   };

   const cardContent = (
      <>
         {/* Cover Image */}
         {handleClick ? (
            <button
               type="button"
               onClick={handleClick}
               tabIndex={-1}
               className="bg-muted relative mb-3 aspect-square w-full cursor-pointer overflow-hidden rounded-md text-left"
            >
               {categoryGradient ? (
                  <div className="relative flex h-full w-full items-center justify-center p-4">
                     <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                     <span className="relative z-10 text-center text-lg font-bold text-white drop-shadow-lg">
                        {watchlist.name}
                     </span>
                  </div>
               ) : thumbnailUrl ? (
                  <Image
                     src={thumbnailUrl}
                     alt={watchlist.name}
                     fill
                     sizes="(max-width: 768px) 50vw, 25vw"
                     className="object-cover"
                     priority={priority}
                  />
               ) : (
                  <div className="flex h-full w-full items-center justify-center">
                     <Film strokeWidth={1.4} className="text-muted-foreground h-12 w-12" />
                  </div>
               )}
            </button>
         ) : (
            <div
               className="bg-muted relative mb-3 aspect-square w-full overflow-hidden rounded-md"
               style={categoryGradient ? { background: categoryGradient } : undefined}
            >
               {categoryGradient ? (
                  <div className="relative flex h-full w-full items-center justify-center p-4">
                     <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                     <span className="relative z-10 text-center text-lg font-bold text-white drop-shadow-lg">
                        {watchlist.name}
                     </span>
                  </div>
               ) : thumbnailUrl ? (
                  <Image
                     src={thumbnailUrl}
                     alt={watchlist.name}
                     fill
                     sizes="(max-width: 768px) 50vw, 25vw"
                     className="object-cover"
                     priority={priority}
                  />
               ) : (
                  <div className="flex h-full w-full items-center justify-center">
                     <Film strokeWidth={1} className="text-muted-foreground h-12 w-12" />
                  </div>
               )}
            </div>
         )}

         {/* Text Info */}
         <div className="flex items-center gap-1">
            {/* Saved Badge */}
            {showSavedBadge && (
               <Image
                  src="/checkGreenFull.svg"
                  alt="Suivi"
                  width={16}
                  height={16}
                  className="h-4 w-4 shrink-0"
               />
            )}

            {/* Collaborative Badge */}
            {showCollaborativeBadge && (
               <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[hsl(207.87deg_100%_34.92%_/57%)]">
                  <Image
                     src="/team.svg"
                     alt="Collaborative"
                     width={12}
                     height={12}
                     className="h-3 w-3 brightness-0 invert"
                  />
               </div>
            )}

            <h3 className="line-clamp-2 text-[14.5px] font-semibold text-white">
               {handleClick ? (
                  <button
                     type="button"
                     onClick={handleClick}
                     className="w-full cursor-pointer text-left"
                     tabIndex={-1}
                  >
                     {watchlist.name}
                  </button>
               ) : (
                  watchlist.name
               )}
            </h3>
         </div>

         {showOwner && (
            <p className="text-muted-foreground mt-1 text-xs">
               {"par "}
               {watchlist.owner?.username ? (
                  <button
                     type="button"
                     onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/user/${watchlist.owner!.username}`);
                     }}
                     className="cursor-pointer rounded-md text-white capitalize hover:underline"
                  >
                     {watchlist.owner.username}
                  </button>
               ) : (
                  <span className="capitalize">Anonyme</span>
               )}
            </p>
         )}

         {showVisibility && (
            <div className="text-muted-foreground mt-1 text-xs">
               {handleClick ? (
                  <button
                     type="button"
                     onClick={handleClick}
                     className="text-muted-foreground cursor-pointer"
                     tabIndex={-1}
                  >
                     {watchlist.isPublic ? content.watchlists.public : content.watchlists.private}
                  </button>
               ) : (
                  <span className="text-muted-foreground">
                     {watchlist.isPublic ? content.watchlists.public : content.watchlists.private}
                  </span>
               )}
            </div>
         )}

         <div className="text-muted-foreground mt-1 flex items-center justify-between text-xs">
            {handleClick ? (
               <button
                  type="button"
                  onClick={handleClick}
                  className="text-muted-foreground cursor-pointer"
                  tabIndex={-1}
               >
                  {watchlist.items?.length ?? 0}{" "}
                  {(watchlist.items?.length ?? 0) === 1
                     ? content.watchlists.item
                     : content.watchlists.items}
               </button>
            ) : (
               <span className="text-muted-foreground">
                  {watchlist.items?.length ?? 0}{" "}
                  {(watchlist.items?.length ?? 0) === 1
                     ? content.watchlists.item
                     : content.watchlists.items}
               </span>
            )}

            {/* More Menu */}
            {showMenu && onEdit && onDelete && (
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
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                           if (e.key === "Enter" || e.key === " ") {
                              e.stopPropagation();
                           }
                        }}
                        aria-label="Plus d'options"
                        className="ml-auto flex h-6 w-6 cursor-pointer items-center justify-center rounded opacity-0 transition-all group-hover:opacity-100 hover:brightness-125 hover:backdrop-brightness-150 focus-visible:opacity-100"
                     >
                        <MoreVertical className="h-4 w-4" />
                     </button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Portal>
                     <DropdownMenu.Content
                        className="border-border bg-popover z-50 min-w-[180px] overflow-hidden rounded-xl border p-1 shadow-md"
                        sideOffset={5}
                        onKeyDown={handleDropdownKeyDown}
                        onCloseAutoFocus={(e) => {
                           e.preventDefault();
                        }}
                     >
                        <DropdownMenu.Item
                           ref={editButtonRef}
                           className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex cursor-pointer items-center rounded-lg px-2 py-1.5 text-sm transition-colors outline-none select-none"
                           onSelect={() => onEdit(watchlist)}
                        >
                           <Edit className="mr-2 h-4 w-4" />
                           <span>{content.watchlists.edit}</span>
                        </DropdownMenu.Item>

                        <DropdownMenu.Item
                           ref={deleteButtonRef}
                           className="relative flex cursor-pointer items-center rounded-lg px-2 py-1.5 text-sm text-red-500 transition-colors outline-none select-none hover:bg-red-500/10 hover:text-red-500 focus:bg-red-500/10 focus:text-red-500"
                           onSelect={() => onDelete(watchlist)}
                        >
                           <Trash2 className="mr-2 h-4 w-4" />
                           <span>{content.watchlists.delete}</span>
                        </DropdownMenu.Item>
                     </DropdownMenu.Content>
                  </DropdownMenu.Portal>
               </DropdownMenu.Root>
            )}
         </div>
      </>
   );

   if (draggableProps) {
      return (
         <div
            ref={draggableProps.ref}
            style={draggableProps.style}
            {...draggableProps.attributes}
            {...draggableProps.listeners}
            tabIndex={0}
            onKeyDown={(e) => {
               if (e.key === "Enter" || e.key === " ") {
                  // Only navigate if Enter was pressed directly on the card, not on a child element
                  if (e.target !== e.currentTarget) return;
                  e.preventDefault();
                  window.location.href = href;
               }
            }}
            className="group cursor-pointer rounded-lg p-2 transition-colors hover:bg-[#36363780]"
         >
            {cardContent}
         </div>
      );
   }

   return (
      <Link
         href={href}
         className="group block cursor-pointer rounded-lg p-2 transition-colors hover:bg-[#36363780]"
      >
         {cardContent}
      </Link>
   );
}
