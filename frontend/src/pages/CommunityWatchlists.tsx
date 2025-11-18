import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { watchlistAPI, type Watchlist } from "@/lib/api-client";
import { WatchlistCard } from "@/components/Watchlist/WatchlistCard";
import { useLanguageStore } from "@/store/language";
import { useAuth } from "@/context/auth-context";
import { scrollToTop } from "@/lib/utils";
import { Film, ArrowLeft } from "lucide-react";

export function CommunityWatchlists() {
  const { content } = useLanguageStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [userWatchlists, setUserWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scrollToTop();
  }, []);

  const handleBackClick = () => {
    navigate("/home");
    scrollToTop();
  };

  const fetchWatchlists = async () => {
    try {
      // Fetch all public watchlists with higher limit for community page
      const data = await watchlistAPI.getPublicWatchlists(1000);
      setWatchlists(data.watchlists || []);
    } catch (error) {
      console.error("Failed to fetch community watchlists:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      // Fetch public watchlists
      await fetchWatchlists();

      // Fetch user's watchlists if authenticated
      if (user) {
        try {
          const userData = await watchlistAPI.getMine();
          setUserWatchlists(userData.watchlists || []);
        } catch (error) {
          console.error("Failed to fetch user watchlists:", error);
        }
      }
    };

    fetchData();
  }, [user]);

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
            {watchlists.map((watchlist) => {
              // Calculate isOwner by comparing user email with watchlist owner email
              const ownerEmail =
                typeof watchlist.ownerId === "string"
                  ? null
                  : watchlist.ownerId?.email;
              const isOwner = user?.email === ownerEmail;

              // Check if this watchlist is in user's saved watchlists
              const isSaved = userWatchlists.some(
                (uw) => uw._id === watchlist._id && !uw.isOwner
              );
              const showSavedBadge = !isOwner && isSaved;

              return (
                <WatchlistCard
                  key={watchlist._id}
                  watchlist={watchlist}
                  content={content}
                  href={`/account/watchlist/${watchlist._id}`}
                  showMenu={false}
                  showOwner={true}
                  showSavedBadge={showSavedBadge}
                />
              );
            })}
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
