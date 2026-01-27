"use client";

import { ArrowLeft, Copy, Film, Pencil, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useListThumbnail } from "@/hooks/useListThumbnail";
import type { Collaborator, Watchlist } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";

interface ListHeaderProps {
   watchlist: Watchlist;
   actionButton?: React.ReactNode;
   menuButton?: React.ReactNode;
   onEdit?: () => void;
   onImageClick?: () => void;
   onShare?: () => void;
   onSave?: () => void;
   isSaved?: boolean;
   showSaveButton?: boolean;
   onDuplicate?: () => void;
   showDuplicateButton?: boolean;
   collaboratorButton?: React.ReactNode;
}

export const LIST_HEADER_BUTTON_CLASS =
   "group relative flex h-[80%] items-center justify-center rounded-lg p-3 transition-all cursor-pointer  hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

export const LIST_HEADER_ICON_CLASS = "h-6 w-6 transition-all opacity-60 group-hover:opacity-100";

export function ListHeader({
   watchlist,
   actionButton,
   menuButton,
   onEdit,
   onImageClick,
   onShare,
   onSave,
   isSaved = false,
   showSaveButton = false,
   onDuplicate,
   showDuplicateButton = false,
   collaboratorButton,
}: ListHeaderProps) {
   const router = useRouter();
   const { content } = useLanguageStore();
   const [showSaveAnimation, setShowSaveAnimation] = useState(false);

   // Get cover image (custom or auto-generated thumbnail)
   const generatedThumbnail = useListThumbnail(watchlist);
   const coverImage = watchlist.imageUrl || generatedThumbnail;

   const itemCount = watchlist.items.length;
   const ownerUsername = watchlist.owner?.username || watchlist.owner?.email || null;
   const ownerAvatarUrl = watchlist.owner?.avatarUrl || null;

   return (
      <div className="relative w-full overflow-hidden">
         {/* Background Gradient - same as category pages */}
         <div
            className="absolute inset-0"
            style={{
               background: "linear-gradient(to bottom, #0c273775, transparent 60%)",
            }}
         />

         <div className="relative container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 pt-8">
            {/* Back Button */}
            <div className="mb-8">
               <button
                  type="button"
                  onClick={() => router.back()}
                  className="text-muted-foreground flex cursor-pointer items-center gap-2 rounded text-sm transition-colors hover:text-white"
               >
                  <ArrowLeft className="h-4 w-4" />
                  <span>{content.watchlists.back}</span>
               </button>
            </div>

            <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-8">
               {/* Cover Image */}
               <div className="shrink-0">
                  {onImageClick ? (
                     <button
                        type="button"
                        className="group relative h-56 w-56 cursor-pointer overflow-hidden rounded-lg shadow-2xl"
                        onClick={onImageClick}
                     >
                        {coverImage ? (
                           <>
                              <Image
                                 src={coverImage}
                                 alt={watchlist.name}
                                 fill
                                 sizes="224px"
                                 className="object-cover"
                                 priority
                              />
                              {/* Hover Overlay */}
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                                 <Pencil className="h-10 w-10 text-white" />
                                 <span className="mt-2 text-sm font-medium text-white">
                                    {"Sélectionner une photo"}
                                 </span>
                              </div>
                           </>
                        ) : (
                           <div className="bg-muted/50 flex h-full w-full items-center justify-center">
                              <Film strokeWidth={1.2} className="text-muted-foreground h-24 w-24" />
                           </div>
                        )}
                     </button>
                  ) : (
                     <div className="group relative h-56 w-56 overflow-hidden rounded-lg shadow-2xl">
                        {coverImage ? (
                           <Image
                              src={coverImage}
                              alt={watchlist.name}
                              fill
                              sizes="224px"
                              className="object-cover"
                              priority
                           />
                        ) : (
                           <div className="bg-muted/50 flex h-full w-full items-center justify-center">
                              <Film strokeWidth={1.2} className="text-muted-foreground h-24 w-24" />
                           </div>
                        )}
                     </div>
                  )}
               </div>

               {/* Info */}
               <div className="flex flex-1 flex-col justify-end space-y-4">
                  {watchlist.isPublic && (
                     <span className="text-muted-foreground text-sm font-normal">
                        {content.watchlists.headerPublic}
                     </span>
                  )}

                  <h1 className="text-4xl font-bold text-white md:text-7xl">
                     {onEdit ? (
                        <button
                           type="button"
                           onClick={onEdit}
                           className="hover:text-primary cursor-pointer rounded-lg text-left transition-colors"
                        >
                           {watchlist.name}
                        </button>
                     ) : (
                        watchlist.name
                     )}
                  </h1>

                  {watchlist.description && (
                     <p className="text-muted-foreground text-[14px]">{watchlist.description}</p>
                  )}

                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                     {ownerUsername && (
                        <>
                           <div className="flex items-center gap-2">
                              <div className="flex items-center">
                                 <div className="flex items-center gap-1">
                                    <div className="bg-muted flex h-6 w-6 items-center justify-center overflow-hidden rounded-full">
                                       {ownerAvatarUrl ? (
                                          <Image
                                             src={ownerAvatarUrl}
                                             alt=""
                                             width={24}
                                             height={24}
                                             className="h-full w-full object-cover"
                                          />
                                       ) : (
                                          <User className="text-muted-foreground h-3.5 w-3.5" />
                                       )}
                                    </div>
                                    <button
                                       type="button"
                                       onClick={() => router.push(`/user/${ownerUsername}`)}
                                       className="cursor-pointer rounded-lg font-semibold text-white capitalize hover:underline"
                                    >
                                       {ownerUsername}
                                    </button>
                                 </div>
                                 {watchlist.collaborators && watchlist.collaborators.length > 0 && (
                                    <div>,</div>
                                 )}
                              </div>
                              {/* Collaborator Avatars - overlapping */}
                              {watchlist.collaborators &&
                                 watchlist.collaborators.length > 0 &&
                                 Array.isArray(watchlist.collaborators) && (
                                    <div className="flex -space-x-2">
                                       {(watchlist.collaborators as Collaborator[])
                                          .filter(
                                             (c): c is Collaborator =>
                                                typeof c === "object" && c !== null
                                          )
                                          .slice(0, 3)
                                          .map((collaborator) => (
                                             <div
                                                key={collaborator.id}
                                                className="bg-muted ring-background flex h-6 w-6 items-center justify-center overflow-hidden rounded-full ring-2"
                                                title={collaborator.username}
                                             >
                                                {(
                                                   collaborator as Collaborator & {
                                                      avatarUrl?: string;
                                                   }
                                                ).avatarUrl ? (
                                                   <Image
                                                      src={
                                                         (
                                                            collaborator as Collaborator & {
                                                               avatarUrl?: string;
                                                            }
                                                         ).avatarUrl || ""
                                                      }
                                                      alt=""
                                                      width={24}
                                                      height={24}
                                                      className="h-full w-full object-cover"
                                                   />
                                                ) : (
                                                   <User className="text-muted-foreground h-3.5 w-3.5" />
                                                )}
                                             </div>
                                          ))}
                                       {(watchlist.collaborators as Collaborator[]).filter(
                                          (c): c is Collaborator =>
                                             typeof c === "object" && c !== null
                                       ).length > 3 && (
                                          <div
                                             className="bg-muted ring-background flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ring-2"
                                             title={`+${(watchlist.collaborators as Collaborator[]).filter((c): c is Collaborator => typeof c === "object" && c !== null).length - 3} collaborateurs`}
                                          >
                                             +
                                             {(watchlist.collaborators as Collaborator[]).filter(
                                                (c): c is Collaborator =>
                                                   typeof c === "object" && c !== null
                                             ).length - 3}
                                          </div>
                                       )}
                                    </div>
                                 )}
                           </div>
                           <span>•</span>
                        </>
                     )}
                     <span>
                        {itemCount}{" "}
                        {itemCount === 1 ? content.watchlists.item : content.watchlists.items}
                     </span>
                     {watchlist.likedBy && watchlist.likedBy.length >= 1 && (
                        <>
                           <span>•</span>
                           <span>
                              {watchlist.likedBy.length}{" "}
                              {watchlist.likedBy.length === 1 ? "sauvegarde" : "sauvegardes"}
                           </span>
                        </>
                     )}
                  </div>
               </div>
            </div>

            {/* Action Buttons Row - Below Header */}
            {(() => {
               const hasLeftButtons =
                  showSaveButton ||
                  showDuplicateButton ||
                  onShare ||
                  collaboratorButton ||
                  menuButton;

               return (
                  <div
                     className={`mt-6 flex items-center ${hasLeftButtons ? "justify-between" : "justify-end"}`}
                  >
                     {/* Left: Icon Buttons */}
                     {hasLeftButtons && (
                        <div className="flex min-h-[50px] items-center justify-center gap-1">
                           {showSaveButton && onSave && (
                              <button
                                 type="button"
                                 onClick={async () => {
                                    setShowSaveAnimation(true);
                                    setTimeout(() => setShowSaveAnimation(false), 200);
                                    await onSave();
                                 }}
                                 className={LIST_HEADER_BUTTON_CLASS}
                                 title={
                                    isSaved
                                       ? content.watchlists.tooltips.unsave
                                       : content.watchlists.tooltips.save
                                 }
                              >
                                 <div className="relative h-6 w-6">
                                    <Image
                                       src="/plus2.svg"
                                       alt="Save"
                                       width={24}
                                       height={24}
                                       className={`absolute inset-0 h-6 w-6 transition-opacity ${
                                          isSaved
                                             ? "opacity-0"
                                             : showSaveAnimation
                                               ? "opacity-100"
                                               : "opacity-60 brightness-0 invert group-hover:opacity-100"
                                       }`}
                                       style={{
                                          transitionDuration: isSaved ? "0ms" : "200ms",
                                       }}
                                    />
                                    <Image
                                       src="/checkGreenFull.svg"
                                       alt="Saved"
                                       width={24}
                                       height={24}
                                       className={`absolute inset-0 h-6 w-6 transition-opacity ${
                                          isSaved
                                             ? showSaveAnimation
                                                ? "opacity-100"
                                                : "opacity-100"
                                             : "opacity-0"
                                       }`}
                                       style={{
                                          transitionDuration: !isSaved ? "0ms" : "200ms",
                                       }}
                                    />
                                 </div>
                              </button>
                           )}
                           {collaboratorButton && collaboratorButton}

                           {showDuplicateButton && onDuplicate && (
                              <button
                                 type="button"
                                 onClick={onDuplicate}
                                 className={LIST_HEADER_BUTTON_CLASS}
                                 title={content.watchlists.tooltips.duplicate}
                              >
                                 <Copy className={`${LIST_HEADER_ICON_CLASS} text-white`} />
                              </button>
                           )}
                           {onShare && (
                              <button
                                 type="button"
                                 onClick={onShare}
                                 className={LIST_HEADER_BUTTON_CLASS}
                                 title={content.watchlists.tooltips.share}
                              >
                                 <Image
                                    src="/share.svg"
                                    alt="Share"
                                    width={24}
                                    height={24}
                                    className={`${LIST_HEADER_ICON_CLASS} brightness-0 invert`}
                                 />
                              </button>
                           )}
                           {menuButton && menuButton}
                        </div>
                     )}

                     {/* Right: Action Button (e.g., Add Item) */}
                     {actionButton && <div className="shrink-0">{actionButton}</div>}
                  </div>
               );
            })()}
         </div>
      </div>
   );
}
