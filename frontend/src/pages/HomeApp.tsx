import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Film, Plus, Eye } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  tmdbAPI,
  watchlistAPI,
  type Watchlist,
  type WatchlistItem,
} from "@/lib/api-client";
import { WatchlistCard } from "@/components/Watchlist/WatchlistCard";
import { WatchlistCardSmall } from "@/components/Watchlist/WatchlistCardSmall";
import { MoviePoster } from "@/components/Movie/MoviePoster";
import { ItemDetailsModal } from "@/components/Watchlist/ItemDetailsModal";
import { useLanguageStore } from "@/store/language";
import { useAuth } from "@/context/auth-context";
import { WATCHLIST_CATEGORIES, getCategoryInfo } from "@/types/categories";

interface TrendingItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  media_type: "movie" | "tv";
  vote_average?: number;
  overview?: string;
}

interface FeaturedCategory {
  id: string;
  name: string;
  description: string;
  gradient?: string;
  itemCount: number;
  username: string;
}

export function HomeApp() {
  const { content } = useLanguageStore();
  const { user } = useAuth();

  const [userWatchlists, setUserWatchlists] = useState<Watchlist[]>([]);
  const [publicWatchlists, setPublicWatchlists] = useState<Watchlist[]>([]);
  const [recommendations, setRecommendations] = useState<TrendingItem[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    tmdbId: string;
    type: "movie" | "tv";
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch public watchlists
        const publicData = await watchlistAPI.getPublicWatchlists(10);
        setPublicWatchlists(publicData.watchlists || []);

        // Fetch user's watchlists first to get their items
        let userWatchlistsData: Watchlist[] = [];
        if (user) {
          const userData = await watchlistAPI.getMine();
          userWatchlistsData = userData.watchlists || [];
          setUserWatchlists(userWatchlistsData);
        } else {
          const localWatchlists = localStorage.getItem("watchlists");
          if (localWatchlists) {
            userWatchlistsData = JSON.parse(localWatchlists) as Watchlist[];
            setUserWatchlists(userWatchlistsData);
          }
        }

        // Collect all items from user's watchlists
        const allItems: { tmdbId: string; type: "movie" | "tv" }[] = [];
        userWatchlistsData.forEach((watchlist) => {
          watchlist.items.forEach((item) => {
            allItems.push({
              tmdbId: item.tmdbId,
              type: item.type,
            });
          });
        });

        // Fetch recommendations based on user's items or trending
        if (allItems.length > 0) {
          // Use similar items from random items in user's watchlists
          const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
          const randomItems = allItems
            .sort(() => Math.random() - 0.5)
            .slice(0, 3); // Pick 3 random items

          const similarPromises = randomItems.map(async (item) => {
            try {
              const response = await fetch(
                `https://api.themoviedb.org/3/${item.type}/${item.tmdbId}/similar?language=fr-FR&page=1`,
                {
                  headers: {
                    Authorization: `Bearer ${TMDB_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                },
              );
              const data = await response.json();
              return (data.results || []).map((result: any) => ({
                ...result,
                media_type: item.type,
              }));
            } catch (error) {
              console.error(`Failed to fetch similar items:`, error);
              return [];
            }
          });

          const similarResults = await Promise.all(similarPromises);
          const allSimilar = similarResults.flat();

          // Remove duplicates and limit to 5
          const uniqueSimilar = allSimilar.filter(
            (item, index, self) =>
              index === self.findIndex((t) => t.id === item.id),
          );

          setRecommendations(uniqueSimilar.slice(0, 5));
        } else {
          // Fallback to trending if no items in watchlists
          const trendingData = await tmdbAPI.getTrending("day");
          setRecommendations((trendingData.results || []).slice(0, 5));
        }

        // Fetch category counts for all categories
        const categoryIds = [
          "movies",
          "series",
          "netflix",
          "prime-video",
          "disney-plus",
        ];

        const counts: Record<string, number> = {};
        await Promise.all(
          categoryIds.map(async (categoryId) => {
            try {
              const data =
                await watchlistAPI.getWatchlistsByCategory(categoryId);
              counts[categoryId] = data.watchlists?.length || 0;
            } catch (error) {
              console.error(`Failed to fetch count for ${categoryId}:`, error);
              counts[categoryId] = 0;
            }
          }),
        );
        setCategoryCounts(counts);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleAddToWatchlist = async (
    watchlistId: string,
    item: TrendingItem,
  ) => {
    try {
      setAddingTo(item.id);

      if (user) {
        // Online mode: add via API
        await watchlistAPI.addItem(watchlistId, {
          tmdbId: item.id.toString(),
          type: item.media_type || "movie",
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
            // Fetch item details from TMDB
            const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
            const type = item.media_type || "movie";
            const response = await fetch(
              `https://api.themoviedb.org/3/${type}/${item.id}?language=fr-FR`,
              {
                headers: {
                  Authorization: `Bearer ${TMDB_API_KEY}`,
                  "Content-Type": "application/json",
                },
              },
            );

            if (response.ok) {
              const details = await response.json();
              const newItem = {
                tmdbId: item.id.toString(),
                title: details.title || details.name || "",
                posterUrl: details.poster_path
                  ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
                  : "",
                type: type as "movie" | "tv",
                platformList: [],
                addedAt: new Date().toISOString(),
              };

              // Check if item already exists
              const itemExists = watchlists[watchlistIndex].items.some(
                (existingItem) => existingItem.tmdbId === newItem.tmdbId,
              );

              if (!itemExists) {
                watchlists[watchlistIndex].items.push(newItem);
                localStorage.setItem("watchlists", JSON.stringify(watchlists));
                setUserWatchlists([...watchlists]);
              }
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

  const handleOpenDetails = (item: TrendingItem) => {
    setSelectedItem({
      tmdbId: item.id.toString(),
      type: item.media_type || "movie",
    });
    setDetailsModalOpen(true);
  };

  // Featured categories - using getCategoryInfo for translations
  const categories: FeaturedCategory[] = WATCHLIST_CATEGORIES.slice(0, 5).map(
    (categoryId) => {
      const categoryInfo = getCategoryInfo(categoryId, content);
      return {
        id: categoryId,
        name: categoryInfo.name,
        description: categoryInfo.description,
        gradient: categoryInfo.cardGradient,
        itemCount: categoryCounts[categoryId] || 0,
        username: "WatchlistHub",
      };
    },
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* My Watchlists - Library Section */}
      {userWatchlists.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {content.home.library.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {content.home.library.subtitle}
              </p>
            </div>
            <Link
              to={user ? "/account/watchlists" : "/local/watchlists"}
              className="rounded-full bg-muted/50 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              {content.home.library.seeAll}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {userWatchlists.slice(0, 8).map((watchlist) => (
              <WatchlistCardSmall
                key={watchlist._id}
                watchlist={watchlist}
                onClick={() => {
                  window.location.href = user
                    ? `/account/watchlist/${watchlist._id}`
                    : `/local/watchlist/${watchlist._id}`;
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {content.home.categories.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {content.home.categories.subtitle}
            </p>
          </div>
          <Link
            to="/categories"
            className="rounded-full bg-muted/50 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            {content.home.categories.seeMore}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => {
            const placeholderTimestamp = "1970-01-01T00:00:00.000Z";
            const placeholderItems: WatchlistItem[] = Array.from(
              { length: category.itemCount },
              (_, index) => ({
                tmdbId: `${category.id}-item-${index}`,
                title: category.name,
                posterUrl: "",
                type: "movie",
                platformList: [],
                addedAt: placeholderTimestamp,
              }),
            );

            const mockWatchlist: Watchlist = {
              _id: category.id,
              ownerId: {
                email: "featured@watchlisthub.app",
                username: category.username,
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
                key={category.id}
                watchlist={mockWatchlist}
                content={content}
                href={`/category/${category.id}`}
                showMenu={false}
                showOwner={false}
                categoryGradient={category.gradient}
              />
            );
          })}
        </div>
      </section>

      {/* Popular Watchlists Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {content.home.popularWatchlists.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {content.home.popularWatchlists.subtitle}
            </p>
          </div>
          <Link
            to="/community-watchlists"
            className="rounded-full bg-muted/50 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            {content.home.popularWatchlists.seeMore}
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="aspect-[1/1] animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : publicWatchlists.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {publicWatchlists.slice(0, 10).map((watchlist) => (
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
              {content.home.popularWatchlists.noWatchlists}
            </p>
          </div>
        )}
      </section>

      {/* Recommandations Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {content.home.recommendations.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {content.home.recommendations.subtitle}
            </p>
          </div>
          <Link
            to="/explore"
            className="rounded-full bg-muted/50 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            {content.home.recommendations.seeMore}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {recommendations.slice(0, 5).map((item) => (
            <div key={item.id} className="group relative">
              <MoviePoster
                id={item.id}
                title={item.title}
                name={item.name}
                posterPath={item.poster_path}
                voteAverage={item.vote_average}
                overview={item.overview}
              />

              {/* Action buttons */}
              <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                {/* Preview button */}
                <button
                  className="rounded-full bg-black/80 p-2 text-white backdrop-blur-sm hover:bg-black"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDetails(item);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </button>

                {/* Add button (only if authenticated) */}
                {user && (
                  <DropdownMenu.Root>
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
                        {userWatchlists.length > 0 ? (
                          userWatchlists.map((watchlist) => (
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
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

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
