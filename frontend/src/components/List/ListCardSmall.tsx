"use client";

import { Film } from "lucide-react";
import Image from "next/image";
import { useListThumbnail } from "@/hooks/useListThumbnail";
import type { Watchlist } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";

interface ListCardSmallProps {
   watchlist: Watchlist;
   onClick?: () => void;
}

export function ListCardSmall({ watchlist, onClick }: ListCardSmallProps) {
   const thumbnailUrl = useListThumbnail(watchlist);
   const { content } = useLanguageStore();

   return (
      <button
         type="button"
         onClick={onClick}
         className="group bg-muted/30 hover:bg-muted/50 flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-lg p-3 text-left transition-all"
      >
         {/* Thumbnail - Square */}
         <div className="bg-muted relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
            {thumbnailUrl ? (
               <Image
                  src={thumbnailUrl}
                  alt={watchlist.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                  loading="eager"
               />
            ) : (
               <div className="flex h-full w-full items-center justify-center">
                  <Film strokeWidth={1} className="text-muted-foreground h-8 w-8" />
               </div>
            )}
         </div>

         {/* Info */}
         <div className="flex min-w-0 flex-1 flex-col justify-center">
            <h3 className="line-clamp-1 text-sm font-semibold text-white">{watchlist.name}</h3>
            <p className="text-muted-foreground text-xs">
               {watchlist.items.length}{" "}
               {watchlist.items.length === 1 ? content.watchlists.item : content.watchlists.items}
            </p>
         </div>
      </button>
   );
}
