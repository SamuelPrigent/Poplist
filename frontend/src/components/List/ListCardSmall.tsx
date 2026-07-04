"use client";

import { Film } from "lucide-react";
import { Img as Image } from "@/components/ui/Img";
import { Link } from "@/components/ui/Link";
import { PosterGrid } from "@/components/List/PosterGrid";
import type { Watchlist } from "@/api";
import { useLanguageStore } from "@/store/language";

interface ListCardSmallProps {
   watchlist: Watchlist;
   to: string;
}

export function ListCardSmall({ watchlist, to }: ListCardSmallProps) {
   const { content } = useLanguageStore();

   return (
      <Link
         to={to}
         className="group bg-muted/30 hover:bg-muted/50 flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-lg p-3 text-left transition-all max-[414px]:bg-transparent max-[414px]:p-0 max-[414px]:hover:bg-transparent"
      >
         {/* Thumbnail - Square */}
         <div className="bg-muted relative h-16 w-16 shrink-0 overflow-hidden rounded-md max-[414px]:h-14 max-[414px]:w-14">
            {watchlist.imageUrl ? (
               <Image
                  src={watchlist.imageUrl}
                  alt={watchlist.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                  loading="eager"
                  unoptimized
               />
            ) : watchlist.items?.length > 0 ? (
               <PosterGrid items={watchlist.items} alt={watchlist.name} imageSize="w92" />
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
      </Link>
   );
}
