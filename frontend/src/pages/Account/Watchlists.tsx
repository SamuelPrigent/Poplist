import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { watchlistAPI } from "@/lib/api-client";
import type { Watchlist } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLanguageStore } from "@/store/language";

export function Watchlists() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { content } = useLanguageStore();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWatchlists = async () => {
      if (authLoading) return;

      try {
        if (isAuthenticated) {
          // Fetch from API
          const data = await watchlistAPI.getMine();
          setWatchlists(data.watchlists);
        } else {
          // Load from localStorage
          const localWatchlists = localStorage.getItem("watchlists");
          if (localWatchlists) {
            setWatchlists(JSON.parse(localWatchlists));
          }
        }
      } catch (error) {
        console.error("Failed to fetch watchlists:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlists();
  }, [isAuthenticated, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-white">
          {content.watchlists.title}
        </h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">
            {content.watchlists.loading}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 mt-9 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">
          {content.watchlists.title}
        </h1>
        <Button>
          <Plus className="h-4 w-4" />
          {content.watchlists.createWatchlist}
        </Button>
      </div>

      {!isAuthenticated && (
        <div className="mb-6 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-500">
          {content.watchlists.notLoggedInWarning}
        </div>
      )}

      {watchlists.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/50 p-12 text-center">
          <p className="text-[16px] text-muted-foreground">
            {content.watchlists.noWatchlists}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {watchlists.map((watchlist) => (
            <div
              key={watchlist._id}
              className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/50"
            >
              <h3 className="text-lg font-semibold text-white">
                {watchlist.name}
              </h3>
              {watchlist.description && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {watchlist.description}
                </p>
              )}
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {watchlist.items.length}{" "}
                  {watchlist.items.length === 1
                    ? content.watchlists.item
                    : content.watchlists.items}
                </span>
                {watchlist.isPublic && (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                    {content.watchlists.public}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
