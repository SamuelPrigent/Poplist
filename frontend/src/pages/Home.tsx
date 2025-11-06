import { useEffect, useState } from "react";
import { tmdbAPI } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";

interface TrendingItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  media_type: string;
  vote_average: number;
}

export function Home() {
  const { content } = useLanguageStore();
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const data = await tmdbAPI.getTrending("day");
        setTrending(data.results?.slice(0, 12) || []);
      } catch (error) {
        console.error("Failed to fetch trending:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-white md:text-6xl lg:text-7xl">
          {content.home.hero.title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          {content.home.hero.subtitle}
        </p>
      </section>

      {/* Trending Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-8 text-3xl font-bold text-white">
          {content.home.trending.title}
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {trending.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-lg transition-transform hover:scale-105"
              >
                {item.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                    alt={item.title || item.name || "Movie poster"}
                    className="aspect-[2/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[2/3] items-center justify-center bg-muted">
                    <span className="text-sm text-muted-foreground">
                      {content.home.trending.noImage}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="absolute bottom-0 p-3">
                    <h3 className="line-clamp-2 text-sm font-semibold text-white">
                      {item.title || item.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-300">
                      <span className="capitalize">{item.media_type}</span>
                      <span>⭐ {item.vote_average.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
