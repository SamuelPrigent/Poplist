import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, ChevronLeft, ChevronRight, Star } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { watchlistAPI, type Watchlist } from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";
import { useLanguageStore } from "@/store/language";
import { getLocalWatchlistsWithOwnership } from "@/lib/localStorageHelpers";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemDetailsModal } from "@/components/Watchlist/ItemDetailsModal";
import { Button } from "@/components/ui/button";

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  media_type?: string;
  vote_average: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const GENRES = {
  movie: [
    { id: 28, name: "Action" },
    { id: 12, name: "Aventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comédie" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentaire" },
    { id: 18, name: "Drame" },
    { id: 10751, name: "Familial" },
    { id: 14, name: "Fantastique" },
    { id: 27, name: "Horreur" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Science-Fiction" },
    { id: 53, name: "Thriller" },
  ],
  tv: [
    { id: 10759, name: "Action & Aventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comédie" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentaire" },
    { id: 18, name: "Drame" },
    { id: 10751, name: "Familial" },
    { id: 10762, name: "Enfants" },
    { id: 9648, name: "Mystère" },
    { id: 10765, name: "Science-Fiction & Fantastique" },
    { id: 10766, name: "Feuilleton" },
    { id: 37, name: "Western" },
  ],
};

export function Explore() {
  const { content } = useLanguageStore();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params
  const mediaType = (searchParams.get("type") as "movie" | "tv") || "movie";
  const filterType =
    (searchParams.get("filter") as "trending" | "popular" | "top_rated") ||
    "trending";
  const selectedGenre = searchParams.get("genre")
    ? Number(searchParams.get("genre"))
    : null;
  const page = Number(searchParams.get("page")) || 1;

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    tmdbId: string;
    type: "movie" | "tv";
  } | null>(null);

  // Helper functions to update URL params
  const updateMediaType = (type: "movie" | "tv") => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("type", type);
    newParams.set("page", "1"); // Reset to page 1 when changing type
    setSearchParams(newParams);
  };

  const updateFilterType = (filter: "trending" | "popular" | "top_rated") => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("filter", filter);
    newParams.set("page", "1"); // Reset to page 1 when changing filter
    setSearchParams(newParams);
  };

  const updateGenre = (genre: number | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (genre === null) {
      newParams.delete("genre");
    } else {
      newParams.set("genre", genre.toString());
    }
    newParams.set("page", "1"); // Reset to page 1 when changing genre
    setSearchParams(newParams);
  };

  const updatePage = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", newPage.toString());
    setSearchParams(newParams);
  };

  // Scroll to top on mount and page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  // Fetch user watchlists (authenticated or offline)
  useEffect(() => {
    if (isAuthenticated) {
      watchlistAPI
        .getMine()
        .then((data) => {
          setWatchlists(data.watchlists);
        })
        .catch(console.error);
    } else {
      // Offline mode: get watchlists with ownership flags
      const localWatchlists = getLocalWatchlistsWithOwnership();
      setWatchlists(localWatchlists);
    }
  }, [isAuthenticated]);

  // Fetch media based on filters
  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      try {
        // Calculate actual TMDB pages needed (TMDB returns 20 per page)
        // We want to display 42 items (6 rows × 7 columns)
        // So we need to fetch multiple TMDB pages for each of our pages
        const itemsPerDisplayPage = 42;
        const itemsPerTMDBPage = 20;
        const startTMDBPage =
          Math.floor(((page - 1) * itemsPerDisplayPage) / itemsPerTMDBPage) + 1;
        const pagesNeeded = Math.ceil(itemsPerDisplayPage / itemsPerTMDBPage);

        let allResults: MediaItem[] = [];
        let totalPages = 1;

        for (let i = 0; i < pagesNeeded; i++) {
          const currentTMDBPage = startTMDBPage + i;
          let url = "";
          const params = new URLSearchParams({
            language: "fr-FR",
            page: currentTMDBPage.toString(),
          });

          if (filterType === "trending") {
            // Use backend cached trending endpoint (doesn't support genre filtering)
            url = `${API_URL}/tmdb/trending/day`;
            // Note: Trending always returns "all" (movies + TV), but we filter by mediaType on frontend
          } else if (selectedGenre) {
            // Use backend cached discover endpoint for genre filtering
            url = `${API_URL}/tmdb/discover/${mediaType}`;
            params.append("with_genres", selectedGenre.toString());

            // Set appropriate sort_by based on filter type
            if (filterType === "popular") {
              params.append("sort_by", "popularity.desc");
            } else if (filterType === "top_rated") {
              params.append("sort_by", "vote_average.desc");
              params.append("vote_count.gte", "200");
            }
          } else {
            // Use backend cached popular/top_rated endpoints when no genre filter
            url = `${API_URL}/tmdb/${mediaType}/${filterType}`;
          }

          // Use backend cached routes - no TMDB API key needed
          const response = await fetch(`${url}?${params}`);

          const data = await response.json();
          allResults = [...allResults, ...(data.results || [])];
          totalPages = data.total_pages || 1;
        }

        // Calculate the starting index for this display page
        const startIndex =
          ((page - 1) * itemsPerDisplayPage) % itemsPerTMDBPage;

        // Slice to get exactly 42 items for this page
        const displayResults = allResults.slice(
          startIndex,
          startIndex + itemsPerDisplayPage,
        );

        setMedia(displayResults);
        // Calculate total display pages based on TMDB total pages
        const totalDisplayPages = Math.ceil(
          (totalPages * itemsPerTMDBPage) / itemsPerDisplayPage,
        );
        setTotalPages(Math.min(totalDisplayPages, 500)); // TMDB limits to 500 pages
      } catch (error) {
        console.error("Failed to fetch media:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [mediaType, filterType, selectedGenre, page]);


  const handleAddToWatchlist = async (
    watchlistId: string,
    mediaItem: MediaItem,
  ) => {
    try {
      setAddingTo(mediaItem.id);

      if (isAuthenticated) {
        // Online mode: add via API
        await watchlistAPI.addItem(watchlistId, {
          tmdbId: mediaItem.id.toString(),
          type: mediaType,
          language: "fr-FR",
          region: "FR",
        });
      } else {
        // Offline mode: add to localStorage
        const localWatchlists = localStorage.getItem("watchlists");
        if (localWatchlists) {
          const watchlists: Watchlist[] = JSON.parse(localWatchlists);
          const watchlistIndex = watchlists.findIndex(
            (w) => w._id === watchlistId,
          );

          if (watchlistIndex !== -1) {
            // Check if item already exists
            const itemExists = watchlists[watchlistIndex].items.some(
              (item) => item.tmdbId === mediaItem.id.toString(),
            );

            if (!itemExists) {
              // Construct basic item
              const newItem = {
                tmdbId: mediaItem.id.toString(),
                title: mediaItem.title || mediaItem.name || "",
                posterUrl: mediaItem.poster_path
                  ? `https://image.tmdb.org/t/p/w500${mediaItem.poster_path}`
                  : "",
                type: mediaType,
                platformList: [],
                addedAt: new Date().toISOString(),
              };

              watchlists[watchlistIndex].items.push(newItem);
              watchlists[watchlistIndex].updatedAt = new Date().toISOString();
              localStorage.setItem("watchlists", JSON.stringify(watchlists));

              // Reload with ownership flags to maintain correct state
              const updatedWatchlists = getLocalWatchlistsWithOwnership();
              setWatchlists(updatedWatchlists);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
    } finally {
      setAddingTo(null);
    }
  };

  const handleItemClick = (item: MediaItem) => {
    setSelectedItem({
      tmdbId: item.id.toString(),
      type: mediaType,
    });
    setDetailsModalOpen(true);
  };

  return (
    <div className="mb-24 min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold text-white">{content.explore.title}</h1>
          <p className="text-lg text-muted-foreground">
            {content.explore.subtitle}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-6">
          {/* Media Type Filter */}
          <div className="flex justify-center">
            <Tabs
              value={mediaType}
              onValueChange={(v) => updateMediaType(v as "movie" | "tv")}
            >
              <TabsList>
                <TabsTrigger value="movie">{content.explore.filters.movies}</TabsTrigger>
                <TabsTrigger value="tv">{content.explore.filters.series}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Filter Type */}
          <div className="flex justify-center">
            <Tabs
              value={filterType}
              onValueChange={(v) => updateFilterType(v as typeof filterType)}
            >
              <TabsList>
                <TabsTrigger value="trending">{content.explore.filters.trending}</TabsTrigger>
                <TabsTrigger value="popular">{content.explore.sortBy.popular}</TabsTrigger>
                <TabsTrigger value="top_rated">{content.explore.filters.topRated}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Genre Filter - only show for non-trending */}
          {filterType !== "trending" && (
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => updateGenre(null)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  selectedGenre === null
                    ? "bg-white text-black"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {content.explore.filters.all}
              </button>
              {GENRES[mediaType].map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => updateGenre(genre.id)}
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${
                    selectedGenre === genre.id
                      ? "bg-white text-black"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Media Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
            {[...Array(42)].map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
              {media.map((item, index) => (
                <button
                  key={`${item.id}-${index}-${page}`}
                  className="group relative cursor-pointer overflow-hidden rounded-lg text-left transition-opacity"
                  onClick={() => handleItemClick(item)}
                >
                  {/* Poster */}
                  <div className="aspect-[2/3] overflow-hidden rounded-lg bg-muted">
                    {item.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                        alt={item.title || item.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        ?
                      </div>
                    )}
                  </div>

                  {/* Add button (if authenticated or has offline watchlists) */}
                  {(isAuthenticated || watchlists.length > 0) && (
                    <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <DropdownMenu.Root
                        onOpenChange={(open) => {
                          if (!open) {
                            setTimeout(() => {
                              if (document.activeElement instanceof HTMLElement) {
                                document.activeElement.blur();
                              }
                            }, 0);
                          }
                        }}
                      >
                        <DropdownMenu.Trigger asChild>
                          <button
                            className="rounded-full bg-black/80 p-2 text-white backdrop-blur-sm hover:bg-black"
                            disabled={addingTo === item.id}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            className="z-50 min-w-[200px] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-md"
                            sideOffset={5}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu.Label className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                              {content.watchlists.addToWatchlist}
                            </DropdownMenu.Label>
                            {watchlists.filter(w => w.isOwner || w.isCollaborator).length > 0 ? (
                              watchlists.filter(w => w.isOwner || w.isCollaborator).map((watchlist) => (
                                <DropdownMenu.Item
                                  key={watchlist._id}
                                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                                  onSelect={() =>
                                    handleAddToWatchlist(watchlist._id, item)
                                  }
                                >
                                  {watchlist.name}
                                </DropdownMenu.Item>
                              ))
                            ) : (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                {content.watchlists.noWatchlist}
                              </div>
                            )}
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>
                  )}

                  {/* Info overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <h3 className="line-clamp-2 text-sm font-semibold text-white">
                      {item.title || item.name}
                    </h3>
                    {item.vote_average > 0 && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-gray-300">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {item.vote_average.toFixed(1)}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updatePage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-sm text-muted-foreground">
                  {content.explore.pagination.pageOf
                    .replace("{page}", String(page))
                    .replace("{totalPages}", String(totalPages))}
                </span>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updatePage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <ItemDetailsModal
          open={detailsModalOpen}
          onOpenChange={(open) => {
            setDetailsModalOpen(open);
            if (!open) {
              setSelectedItem(null);
            }
          }}
          tmdbId={selectedItem.tmdbId}
          type={selectedItem.type}
        />
      )}
    </div>
  );
}
