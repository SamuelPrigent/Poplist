import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { WATCHLIST_CATEGORIES, getCategoryInfo } from "@/types/categories";
import { WatchlistCard } from "@/components/Watchlist/WatchlistCard";
import { useLanguageStore } from "@/store/language";
import { scrollToTop } from "@/lib/utils";
import { watchlistAPI, type Watchlist, type WatchlistItem } from "@/lib/api-client";

export function Categories() {
  const { content } = useLanguageStore();
  const navigate = useNavigate();
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scrollToTop();
  }, []);

  useEffect(() => {
    const fetchCategoryCounts = async () => {
      try {
        const categoryIds = [
          "movies",
          "series",
          "netflix",
          "prime-video",
          "disney-plus",
          "jeunesse",
          "enfant",
          "action",
          "anime",
          "documentaries",
        ];

        const counts: Record<string, number> = {};
        await Promise.all(
          categoryIds.map(async (categoryId) => {
            try {
              const data = await watchlistAPI.getWatchlistsByCategory(categoryId);
              counts[categoryId] = data.watchlists?.length || 0;
            } catch (error) {
              console.error(`Failed to fetch count for ${categoryId}:`, error);
              counts[categoryId] = 0;
            }
          })
        );
        setCategoryCounts(counts);
      } catch (error) {
        console.error("Failed to fetch category counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryCounts();
  }, []);

  const handleBackClick = () => {
    navigate("/home");
    scrollToTop();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={handleBackClick}
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
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="aspect-[1/1] animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {WATCHLIST_CATEGORIES.map((categoryId) => {
              const category = getCategoryInfo(categoryId, content);
              const itemCount = categoryCounts[categoryId] || 0;
              const placeholderTimestamp = "1970-01-01T00:00:00.000Z";
              const placeholderItems: WatchlistItem[] = Array.from(
                { length: itemCount },
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
                likedBy: [],
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
                  categoryGradient={category.cardGradient}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
