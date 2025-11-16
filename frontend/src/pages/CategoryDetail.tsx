import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { watchlistAPI, type Watchlist } from "@/lib/api-client";
import { WatchlistCard } from "@/components/Watchlist/WatchlistCard";
import { useLanguageStore } from "@/store/language";
import { scrollToTop } from "@/lib/utils";
import { getCategoryInfo, type WatchlistCategory } from "@/types/categories";
import { Film, ArrowLeft } from "lucide-react";

export function CategoryDetail() {
  const { id } = useParams<{ id: string }>();
  const { content } = useLanguageStore();
  const navigate = useNavigate();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryInfo = id ? getCategoryInfo(id as WatchlistCategory, content) : null;

  useEffect(() => {
    scrollToTop();
  }, []);

  const handleBackClick = () => {
    navigate("/home");
    scrollToTop();
  };

  useEffect(() => {
    const fetchWatchlists = async () => {
      if (!id) return;

      try {
        const data = await watchlistAPI.getWatchlistsByCategory(id);
        setWatchlists(data.watchlists || []);
      } catch (error) {
        console.error("Failed to fetch category watchlists:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlists();
  }, [id]);

  if (!categoryInfo) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto px-4 py-12">
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">Catégorie non trouvée</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Immersive Header Banner */}
      <div className="relative w-full">
        <div
          className="relative h-[230px] w-full overflow-hidden"
          style={{ background: categoryInfo.gradient }}
        >
          {/* Progressive overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/15 via-30% to-background" />

          {/* Content */}
          <div className="container relative mx-auto flex h-full flex-col justify-end px-4 pb-12">
            {/* Back Button */}
            <div className="mb-6">
              <button
                onClick={handleBackClick}
                className="flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{content.watchlists.back}</span>
              </button>
            </div>

            {/* Title and Description */}
            <div>
              <h1 className="mb-3 text-5xl font-bold text-white drop-shadow-lg md:text-6xl">
                {categoryInfo.name}
              </h1>
              <p className="max-w-2xl text-lg text-white/90 drop-shadow-md">
                {categoryInfo.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Watchlists Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="aspect-[1/1] animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : watchlists.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {watchlists.map((watchlist) => (
              <WatchlistCard
                key={watchlist._id}
                watchlist={watchlist}
                content={content}
                href={`/account/watchlist/${watchlist._id}`}
                showMenu={false}
                showOwner={true}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <Film className="mx-auto h-16 w-16 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              Aucune watchlist dans cette catégorie pour le moment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
