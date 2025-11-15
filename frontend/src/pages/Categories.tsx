import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { WATCHLIST_CATEGORIES, CATEGORY_INFO } from "@/types/categories";
import { WatchlistCard } from "@/components/Watchlist/WatchlistCard";
import { useLanguageStore } from "@/store/language";
import { scrollToTop } from "@/lib/utils";
import type { Watchlist, WatchlistItem } from "@/lib/api-client";

export function Categories() {
  const { content } = useLanguageStore();
  const navigate = useNavigate();

  useEffect(() => {
    scrollToTop();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{content.watchlists.back}</span>
          </button>
        </div>

        {/* Header */}
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold text-white">
            Toutes les catégories
          </h1>
          <p className="text-lg text-muted-foreground">
            Explorez nos collections thématiques
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {WATCHLIST_CATEGORIES.map((categoryId) => {
            const category = CATEGORY_INFO[categoryId];
            const placeholderTimestamp = "1970-01-01T00:00:00.000Z";
            const placeholderItems: WatchlistItem[] = Array.from(
              { length: 10 },
              (_, index) => ({
                tmdbId: `${categoryId}-item-${index}`,
                title: category.name,
                posterUrl: "",
                type: "movie",
                platformList: [],
                addedAt: placeholderTimestamp,
              })
            );

            const mockWatchlist: Watchlist = {
              _id: categoryId,
              ownerId: {
                email: "featured@watchlisthub.app",
                username: "WatchlistHub",
              },
              name: category.name,
              description: category.description,
              imageUrl: "",
              isPublic: true,
              collaborators: [],
              items: placeholderItems,
              createdAt: placeholderTimestamp,
              updatedAt: placeholderTimestamp,
            };

            return (
              <WatchlistCard
                key={categoryId}
                watchlist={mockWatchlist}
                content={content}
                href={`/category/${categoryId}`}
                showMenu={false}
                showOwner={false}
                showVisibility={false}
                categoryGradient={category.gradient}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
