'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
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

// Mapping des catégories vers les images iconiques
const categoryImages: Record<string, string> = {
  anime: '/categories/spider.webp',
  enfant: '/categories/yeti.webp',
  movies: '/categories/avatar.webp',
  series: '/categories/friends.webp',
  documentaries: '/categories/perroquet.webp',
  jeunesse: '/categories/brian.webp',
  action: '/categories/neo.webp',
};

// Base colors for border
const baseColors = { from: '#4A90E2', to: '#667EEA', accent: '#7B68EE' };

// Color variation function to create unique colors per card
function varyColor(baseColor: string, index: number): string {
  const r = Number.parseInt(baseColor.slice(1, 3), 16);
  const g = Number.parseInt(baseColor.slice(3, 5), 16);
  const b = Number.parseInt(baseColor.slice(5, 7), 16);

  const variation = (index * 35) % 360;
  const hsl = rgbToHsl(r, g, b);
  hsl[0] = (hsl[0] + variation) % 360;
  hsl[1] = hsl[1] * 0.75; // Reduce saturation

  const rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
  return `#${rgb.map(x => Math.round(x).toString(16).padStart(2, '0')).join('')}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r * 255, g * 255, b * 255];
}

export function ListCardGenre({ watchlist, href, genreId, index = 0 }: ListCardGenreProps) {
  const colors = {
    from: varyColor(baseColors.from, index),
    to: varyColor(baseColors.to, index),
    accent: varyColor(baseColors.accent, index),
  };

  const [isHovered, setIsHovered] = useState(false);
  const categoryImage = genreId ? categoryImages[genreId] : undefined;
  const itemCount = watchlist.items.length;

  return (
    <Link
      href={href}
      className="group block cursor-pointer rounded-lg p-2 transition-colors hover:bg-[#36363780]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative aspect-32/29 w-full overflow-hidden rounded-xl"
      >
        {/* Animated gradient border */}
        <motion.div
          className="absolute inset-0 rounded-xl opacity-75"
          style={{
            background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
            padding: '2px',
          }}
        >
          {/* Body background color */}
          <div className="h-full w-full rounded-xl bg-[hsl(222.2,84%,4.9%)]" />
        </motion.div>

        {/* Content */}
        <div className="absolute inset-[2px] overflow-hidden rounded-xl bg-[hsl(222.2,84%,6%)]">
          {/* Glass overlay - lighter than V2 */}
          <div className="absolute inset-0 z-0 bg-[#0a1222] opacity-40" />

          {/* Color gradient from bottom - behind image */}
          <div
            className="absolute inset-0 z-1"
            style={{
              background: `linear-gradient(to top, ${colors.from}02 30%, transparent 70%)`,
            }}
          />

          {/* Background image */}
          {categoryImage && (
            <div className="absolute inset-0 z-2 flex items-end justify-center">
              <Image
                src={categoryImage}
                alt=""
                width={300}
                height={400}
                className="h-[85%] w-auto object-contain opacity-75"
                style={{ objectPosition: 'center bottom' }}
                loading="eager"
                priority
              />
            </div>
          )}

          {/* Dark gradient overlay - top */}
          <div
            className="absolute inset-0 z-3"
            style={{
              background: 'linear-gradient(to bottom, rgba(10, 18, 34, 0.4) 0%, transparent 35%)',
            }}
          />

          {/* Dark gradient overlay - bottom for text readability */}
          <div
            className="absolute inset-0 z-3"
            style={{
              background: 'linear-gradient(to top, rgba(10, 18, 34, 0.85) 0%, transparent 40%)',
            }}
          />

          {/* Gradient accent line - only on hover */}
          {isHovered && (
            <motion.div
              className="absolute top-0 right-0 left-0 z-4 h-0.5 opacity-40"
              style={{
                background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
              }}
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'linear',
              }}
            />
          )}

          {/* Genre name + count - inside card */}
          <div className="absolute inset-0 z-4 flex flex-col justify-end p-5">
            <h3 className="text-[20px] font-bold tracking-tight text-white drop-shadow-lg">
              {watchlist.name}
            </h3>
            <span className="text-muted-foreground mt-1 text-xs drop-shadow-lg">
              {itemCount} {itemCount === 1 ? 'liste' : 'listes'}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
