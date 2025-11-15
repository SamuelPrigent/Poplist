import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ListChecks, Users, Share2 } from "lucide-react";
import type { Content } from "@/types/content";

interface TrendingItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  media_type: string;
}

interface HeroSection4Props {
  content: Content;
  trending: TrendingItem[];
}

export function HeroSection4({ content }: HeroSection4Props) {
  return (
    <section className="border-b border-border bg-background py-12">
      <div className="container mx-auto px-4">
        {/* Compact Header */}
        <div className="mx-auto max-w-4xl">
          {/* Feature Pills - Inline */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ListChecks className="h-3.5 w-3.5" />
              <span>Organisez</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Share2 className="h-3.5 w-3.5" />
              <span>Partagez</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>Découvrez</span>
            </div>
          </div>

          {/* Main Title - Compact */}
          <h1 className="mb-4 text-center text-3xl font-bold text-white md:text-4xl">
            {content.home.hero.title}
          </h1>

          {/* Subtitle - Short */}
          <p className="mb-6 text-center text-sm text-muted-foreground md:text-base">
            {content.home.hero.subtitle}
          </p>

          {/* CTA Button - White */}
          <div className="flex justify-center">
            <Link to="/account/watchlists">
              <Button
                size="default"
                className="bg-white font-semibold text-black transition-colors hover:bg-gray-100"
              >
                {content.home.hero.cta}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
