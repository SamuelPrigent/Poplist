"use client";

import { ArrowLeft, Film } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ListCard } from "@/components/List/ListCard";
import { PageReveal } from "@/components/ui/PageReveal";
import { useAuth } from "@/context/auth-context";
import { useRegisterSection } from "@/hooks/usePageReady";
import { type Watchlist, watchlistAPI } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";
import { type GenreCategory, getCategoryInfo } from "@/types/categories";

// Unified header color - blue for all categories
const CATEGORY_HEADER_COLOR = "#11314475";

function CategoryDetailPageInner() {
   const params = useParams();
   const id = params.id as string;
   const { content } = useLanguageStore();
   const { user } = useAuth();
   const router = useRouter();
   const { markReady } = useRegisterSection('category-watchlists');

   const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
   const [userWatchlists, setUserWatchlists] = useState<Watchlist[]>([]);
   const [loading, setLoading] = useState(true);

   const categoryInfo = id ? getCategoryInfo(id as GenreCategory, content) : null;

   useEffect(() => {
      window.scrollTo(0, 0);
   }, []);

   useEffect(() => {
      const fetchData = async () => {
         if (!id) return;

         try {
            // Fetch genre watchlists
            const data = await watchlistAPI.getWatchlistsByGenre(id);
            setWatchlists(data.watchlists || []);

            // Fetch user's watchlists if authenticated
            if (user) {
               try {
                  const userData = await watchlistAPI.getMine();
                  setUserWatchlists(userData.watchlists || []);
               } catch (error) {
                  console.error("Failed to fetch user watchlists:", error);
               }
            }
         } catch (error) {
            console.error("Failed to fetch category watchlists:", error);
         } finally {
            setLoading(false);
            markReady();
         }
      };

      fetchData();
   }, [id, user, markReady]);

   if (!categoryInfo) {
      return (
         <div className="bg-background min-h-screen pb-20">
            <div className="container mx-auto max-w-(--maxWidth) px-4 py-12">
               <div className="border-border bg-card rounded-lg border p-12 text-center">
                  <p className="text-muted-foreground">Catégorie non trouvée</p>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="bg-background min-h-screen pb-20">
         {/* Header with subtle gradient */}
         <div className="relative w-full">
            <div
               className="relative h-[165px] w-full overflow-hidden"
               style={{
                  background: `linear-gradient(to bottom, ${CATEGORY_HEADER_COLOR}, transparent 60%)`,
               }}
            >
               {/* Content */}
               <div className="relative container mx-auto flex h-full w-(--sectionWidth) max-w-(--maxWidth) flex-col justify-start px-10 pt-[1.7rem]">
                  {/* Back Button */}
                  <div className="mb-4">
                     <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex cursor-pointer items-center gap-2 text-sm text-white/80 transition-colors hover:text-white"
                     >
                        <ArrowLeft className="h-4 w-4" />
                        <span>{content.watchlists.back}</span>
                     </button>
                  </div>

                  {/* Title and Description */}
                  <div>
                     <h1 className="mb-2 text-5xl font-bold text-white drop-shadow-lg">
                        {categoryInfo.name}
                     </h1>
                     <p className="text-muted-foreground max-w-2xl text-base">
                        {categoryInfo.description}
                     </p>
                  </div>
               </div>
            </div>
         </div>

         {/* Watchlists section without gradient */}
         <div className="relative w-full">
            <div className="container mx-auto min-h-[75vh] w-(--sectionWidth) max-w-(--maxWidth) px-10 py-4">
               {/* Watchlists Grid */}
               {loading ? null : watchlists.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                     {watchlists.map((watchlist) => {
                        // Calculate isOwner by comparing user email with watchlist owner email
                        const ownerEmail = watchlist.owner?.email || null;
                        const isOwner = user?.email === ownerEmail;

                        // Check if this watchlist is in user's watchlists
                        const userWatchlist = userWatchlists.find((uw) => uw.id === watchlist.id);
                        const isCollaborator = userWatchlist?.isCollaborator === true;
                        const isSaved = userWatchlist && !userWatchlist.isOwner && !isCollaborator;
                        const showSavedBadge = !isOwner && isSaved;
                        const showCollaborativeBadge = isCollaborator;

                        return (
                           <ListCard
                              key={watchlist.id}
                              watchlist={watchlist}
                              content={content}
                              href={`/lists/${watchlist.id}`}
                              showMenu={false}
                              showOwner={true}
                              showSavedBadge={showSavedBadge}
                              showCollaborativeBadge={showCollaborativeBadge}
                           />
                        );
                     })}
                  </div>
               ) : (
                  <div className="border-border bg-card rounded-lg border p-12 text-center">
                     <Film strokeWidth={1.4} className="text-muted-foreground mx-auto h-16 w-16" />
                     <p className="text-muted-foreground mt-4">
                        Aucune watchlist dans cette catégorie pour le moment
                     </p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}

export default function CategoryDetailPage() {
   return (
      <PageReveal timeout={3000} minLoadingTime={100} revealDuration={0.3}>
         <CategoryDetailPageInner />
      </PageReveal>
   );
}
