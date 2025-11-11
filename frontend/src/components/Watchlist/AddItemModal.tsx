import { useState, useRef, useEffect, useCallback } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Search } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { watchlistAPI } from "@/lib/api-client";
import type { Watchlist } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  watchlist: Watchlist;
  onSuccess: () => void;
  offline?: boolean;
}

interface SearchResult {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
}

export function AddItemModal({
  open,
  onOpenChange,
  watchlist,
  onSuccess,
  offline = false,
}: AddItemModalProps) {
  const { content, language } = useLanguageStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState<Set<number>>(new Set());
  const searchTimeoutRef = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get language code from store
  const languageCode = language === "fr" ? "fr-FR" : "en-US";
  const region = language === "fr" ? "FR" : "US";

  // Call onSuccess and clear state when modal closes (if items were added)
  useEffect(() => {
    if (!open) {
      // If items were added during this session, notify parent to refresh
      if (addedItemIds.size > 0) {
        onSuccess();
        setAddedItemIds(new Set());
      }
      // Clear search after a delay to avoid flickering
      const timer = setTimeout(() => {
        setSearchQuery("");
        setSearchResults([]);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, addedItemIds.size, onSuccess]);

  // Debounced search
  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await watchlistAPI.searchTMDB({
          query: query.trim(),
          language: languageCode,
          region,
        });
        setSearchResults(data.results);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    },
    [languageCode, region],
  );

  const onSearchChange = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 500);
  };

  // Virtualizer setup
  const virtualizer = useVirtualizer({
    count: searchResults.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  const isItemInWatchlist = (tmdbId: number) => {
    // Check both existing watchlist items and items added during this session
    return (
      watchlist.items.some((item) => item.tmdbId === tmdbId.toString()) ||
      addedItemIds.has(tmdbId)
    );
  };

  const handleAddItem = async (item: SearchResult) => {
    if (isItemInWatchlist(item.id)) return;

    try {
      if (offline) {
        // Offline mode: add to localStorage
        const STORAGE_KEY = "watchlists";
        const localWatchlists = localStorage.getItem(STORAGE_KEY);
        if (!localWatchlists) return;

        const watchlists: Watchlist[] = JSON.parse(localWatchlists);
        const watchlistIndex = watchlists.findIndex(
          (w) => w._id === watchlist._id,
        );

        if (watchlistIndex === -1) return;

        // Add item to watchlist
        watchlists[watchlistIndex].items.push({
          tmdbId: item.id.toString(),
          title: item.title || item.name || "",
          posterUrl: item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : "",
          type: item.media_type,
          platformList: [{ name: "Inconnu", logoPath: "" }], // Platform data not available in search results
          runtime: item.runtime,
          addedAt: new Date().toISOString(),
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlists));
      } else {
        // Online mode: add via API
        await watchlistAPI.addItem(watchlist._id, {
          tmdbId: item.id.toString(),
          type: item.media_type,
          language: languageCode,
          region,
        });
      }

      // Add to local state to immediately disable button
      setAddedItemIds((prev) => new Set(prev).add(item.id));

      // Don't call onSuccess() here - it will be called when modal closes
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const getYear = (item: SearchResult) => {
    const date = item.release_date || item.first_air_date;
    return date ? new Date(date).getFullYear() : null;
  };

  const buildPosterUrl = (path: string | null) => {
    if (!path) return "";
    return `https://image.tmdb.org/t/p/w200${path}`;
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-[1000px] translate-x-[-50%] translate-y-[-50%] rounded-lg border border-border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex max-h-[80vh] flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-6">
              <div>
                <DialogPrimitive.Title className="text-xl font-semibold">
                  {content.watchlists.addItem}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                  {content.watchlists.searchMoviesAndSeries}
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>

            {/* Search Bar */}
            <div className="p-6 pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={content.watchlists.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>

            {/* Results */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-6 pb-6"
              style={{ maxHeight: "calc(80vh - 200px)" }}
            >
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-sm text-muted-foreground">
                    {content.watchlists.searching}
                  </div>
                </div>
              )}

              {!loading && searchQuery && searchResults.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-sm text-muted-foreground">
                    {content.watchlists.noResults}
                  </div>
                </div>
              )}

              {!loading && !searchQuery && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-sm text-muted-foreground">
                    {content.watchlists.startSearching}
                  </div>
                </div>
              )}

              {!loading && searchResults.length > 0 && (
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualItem) => {
                    const item = searchResults[virtualItem.index];
                    const year = getYear(item);
                    const posterUrl = buildPosterUrl(item.poster_path);
                    const isInWatchlist = isItemInWatchlist(item.id);
                    const isDisabled = isInWatchlist;

                    return (
                      <div
                        key={virtualItem.key}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        <div
                          className={cn(
                            "group flex items-center gap-4 rounded-md p-3 transition-colors",
                            !isDisabled && "hover:bg-muted/50",
                          )}
                        >
                          {/* Poster */}
                          <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                            {posterUrl ? (
                              <img
                                src={posterUrl}
                                alt={item.title || item.name}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                N/A
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 space-y-1">
                            <h3 className="line-clamp-1 font-semibold">
                              {item.title || item.name}
                            </h3>

                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {year && <span>{year}</span>}
                              {item.runtime && <span>{item.runtime} min</span>}
                            </div>

                            {/* Platform bubbles - placeholder for now since search doesn't return platform data */}
                            {/* We would need to fetch this separately or include it in the backend search */}
                          </div>

                          {/* Add Button */}
                          <div className="flex-shrink-0">
                            <Button
                              variant="outline"
                              onClick={() => handleAddItem(item)}
                              disabled={isDisabled}
                              className={cn(
                                "transition-transform",
                                isDisabled
                                  ? "w-[84.04px] border-none bg-green-800/35 p-0 text-[#0bd42c]"
                                  : "",
                              )}
                            >
                              {isDisabled
                                ? content.watchlists.added
                                : content.watchlists.add}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
