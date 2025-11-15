import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { Content } from "@/types/content";

interface TrendingItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  media_type: string;
}

interface HeroSectionProps {
  content: Content;
  trending: TrendingItem[];
}

export function HeroSection({ content, trending }: HeroSectionProps) {
  return (
    <section className="relative h-[70vh] overflow-hidden">
      {/* Animated Mosaic Background */}
      <div className="absolute inset-0">
        {/* First row - slides right - positioned at top */}
        <div className="animate-slide-right absolute left-0 right-0 top-[10%] flex gap-2">
          {trending.slice(0, 60).map((item, i) => (
            <div
              key={`row1-${i}`}
              className="aspect-[2/3] h-48 flex-shrink-0 overflow-hidden rounded"
            >
              {item.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {trending.slice(0, 60).map((item, i) => (
            <div
              key={`row1-dup-${i}`}
              className="aspect-[2/3] h-48 flex-shrink-0 overflow-hidden rounded"
            >
              {item.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          ))}
        </div>

        {/* Second row - slides left (right to left, opposite direction) - positioned at bottom */}
        <div className="animate-slide-left absolute bottom-[10%] left-0 right-0 flex gap-2">
          {/* Duplicate first for right-to-left animation */}
          {trending.slice(60, 120).map((item, i) => (
            <div
              key={`row2-dup-${i}`}
              className="aspect-[2/3] h-48 flex-shrink-0 overflow-hidden rounded"
            >
              {item.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          ))}
          {/* Original content follows */}
          {trending.slice(60, 120).map((item, i) => (
            <div
              key={`row2-${i}`}
              className="aspect-[2/3] h-48 flex-shrink-0 overflow-hidden rounded"
            >
              {item.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          ))}
        </div>

        {/* TV Halo effect - darker edges, brighter center */}
        <div className="pointer-events-none absolute inset-0">
          {/* Radial vignette - less opaque at center, more opaque at edges */}
          <div className="bg-gradient-radial absolute inset-0 from-background/80 via-background/40 to-background"></div>
          {/* Horizontal vignette - opaque quickly on sides for TV glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/0 to-background"></div>
          {/* Additional subtle overlay for text readability */}
          <div className="absolute inset-0 bg-background/30"></div>
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex h-[70vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-6 max-w-4xl text-5xl font-bold leading-tight text-white md:text-7xl">
          {content.home.hero.title}
        </h1>
        <p className="mb-12 max-w-2xl text-lg text-muted-foreground md:text-xl">
          {content.home.hero.subtitle}
        </p>
        <Link to="/account/watchlists">
          <Button size="lg" className="bg-white text-black hover:bg-gray-200">
            {content.home.hero.cta}
          </Button>
        </Link>
      </div>
    </section>
  );
}
