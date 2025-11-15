import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { watchlistAPI, type Watchlist } from "@/lib/api-client";
import { WatchlistCard } from "@/components/Watchlist/WatchlistCard";
import { useLanguageStore } from "@/store/language";
import { scrollToTop } from "@/lib/utils";
import { Film, ArrowLeft } from "lucide-react";

export function CommunityWatchlists() {
  const { content } = useLanguageStore();
  const navigate = useNavigate();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scrollToTop();
  }, []);

  useEffect(() => {
    const fetchWatchlists = async () => {
      try {
        // Use the same endpoint as HomeApp but without limit to get all public watchlists
        const data = await watchlistAPI.getPublicWatchlists();
        setWatchlists(data.watchlists || []);
      } catch (error) {
        console.error("Failed to fetch community watchlists:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlists();
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
            Watchlists de la communauté
          </h1>
          <p className="text-lg text-muted-foreground">
            Découvrez les collections partagées par nos utilisateurs
          </p>
        </div>

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
              Aucune watchlist publique pour le moment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
