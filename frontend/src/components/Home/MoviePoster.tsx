"use client";

import { Eye, Film, Star } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface MoviePosterProps {
   id: number;
   title?: string;
   name?: string;
   posterPath?: string;
   voteAverage?: number;
   releaseDate?: string;
   overview?: string;
   onClick?: () => void;
}

export function MoviePoster({ title, name, posterPath, voteAverage, onClick }: MoviePosterProps) {
   const displayTitle = title || name;
   const [imageError, setImageError] = useState(false);

   const content = (
      <>
         <div className="bg-muted relative mb-3 aspect-2/3 overflow-hidden rounded-lg shadow-lg">
            {/* Image with zoom on hover */}
            {posterPath && !imageError ? (
               <Image
                  src={`https://image.tmdb.org/t/p/w342${posterPath}`}
                  alt={displayTitle || "Movie poster"}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={() => setImageError(true)}
               />
            ) : (
               <div className="flex h-full items-center justify-center">
                  <Film strokeWidth={1} className="text-muted-foreground h-16 w-16" />
               </div>
            )}

            {/* Dark overlay with centered eye icon on hover */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/50">
               <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <Eye className="h-7 w-7 text-white" />
               </div>
            </div>

            {/* Bottom gradient - always visible, darker at bottom */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

            {/* Rating badge */}
            {voteAverage && voteAverage > 0 && (
               <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 backdrop-blur-sm">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-white">{voteAverage.toFixed(1)}</span>
               </div>
            )}
         </div>
         <h3 className="line-clamp-2 text-base font-semibold text-white">{displayTitle}</h3>
      </>
   );

   if (onClick) {
      return (
         <button type="button" onClick={onClick} className="group w-full cursor-pointer text-left">
            {content}
         </button>
      );
   }

   return <div className="group">{content}</div>;
}
