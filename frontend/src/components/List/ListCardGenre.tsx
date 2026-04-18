'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { Watchlist } from '@/lib/api-client';
import type { Content } from '@/types/content';

interface ListCardGenreProps {
  watchlist: Watchlist;
  content: Content;
  href: string;
  genreId?: string;
  showOwner?: boolean;
  index?: number;
}

interface CategoryVisuals {
  bg: string;
  accent: string;
  svg: string; // path inside /public
  svgSize?: string; // CSS mask-size override (default '75%')
}

// Deep, desaturated palette tuned for the slate/dark aesthetic.
// Each entry maps to one Figma SVG in /public/categories/.
const CATEGORY_VISUALS: Record<string, CategoryVisuals> = {
  movies: { bg: '#0D1A2E', accent: '#3B6FC8', svg: '/categories/petanque.svg', svgSize: '74%' },
  series: { bg: '#2A0A14', accent: '#A82649', svg: '/categories/squares.svg', svgSize: '62%' },
  anime: { bg: '#2C0D23', accent: '#B73680', svg: '/categories/cone.svg' },
  jeunesse: { bg: '#1D0A42', accent: '#7148C2', svg: '/categories/square-line.svg' },
  enfant: { bg: '#2A1E0B', accent: '#A27A28', svg: '/categories/tube-line.svg' },
  documentaries: { bg: '#0D2A1C', accent: '#2D8A4B', svg: '/categories/petanque2.svg' },
  action: { bg: '#32100F', accent: '#B52929', svg: '/categories/double-sphere.svg' },
};

const DEFAULT_VISUALS: CategoryVisuals = CATEGORY_VISUALS.movies;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ListCardGenre({ watchlist, href, genreId, index = 0 }: ListCardGenreProps) {
  const visuals = (genreId && CATEGORY_VISUALS[genreId]) || DEFAULT_VISUALS;
  const itemCount = watchlist.items.length;

  // Background fades from the category color (bottom) to transparent (top),
  // tilted -7° counter-clockwise so the colored area leans slightly.
  const cardBgStyle: CSSProperties = {
    backgroundImage: `linear-gradient(-7deg, ${visuals.bg} 0%, transparent 100%)`,
  };

  // The Figma SVG is used as a CSS mask so that any color can be applied
  // (here: the per-category accent). The SVG's internal alpha gradient
  // (Figma exports use stop-opacity 0→1) is preserved as a soft fade.
  const maskedShapeStyle: CSSProperties = {
    backgroundColor: visuals.accent,
    maskImage: `url(${visuals.svg})`,
    WebkitMaskImage: `url(${visuals.svg})`,
    maskSize: visuals.svgSize || '75%',
    WebkitMaskSize: visuals.svgSize || '75%',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
  };

  return (
    <Link
      href={href}
      className="group block cursor-pointer rounded-lg p-2 transition-colors hover:bg-muted/50"
    >
      <div className="bg-background rounded-2xl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative aspect-square w-full overflow-hidden rounded-2xl"
          style={cardBgStyle}
        >
          {/* Centered Figma SVG, colored via mask-image with per-category accent */}
          <div className="pointer-events-none absolute inset-0" style={maskedShapeStyle} />

          {/* Bottom gradient for text readability */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
            }}
          />

          {/* Subtle inner border for definition */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/4" />

          {/* Genre name + count — identical to V1 */}
          <div className="absolute inset-0 flex flex-col justify-end p-5">
            <h3 className="text-[20px] font-bold tracking-tight text-white drop-shadow-lg">
              {watchlist.name}
            </h3>
            <span className="text-muted-foreground mt-1 text-xs drop-shadow-lg">
              {itemCount} {itemCount === 1 ? 'liste' : 'listes'}
            </span>
          </div>

          {/* White bottom accent line — same decoration as V1 */}
          <div className="absolute right-5 bottom-0 left-5 flex justify-center">
            <div className="h-[2.7px] w-full rounded-full bg-white/80" />
          </div>
        </motion.div>
      </div>
    </Link>
  );
}
