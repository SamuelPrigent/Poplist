'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { useState, type CSSProperties } from 'react';
import type { Watchlist } from '@/api';
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
  vivid: string;
  deep: string;
  cutout: string;
}

// Card genre color
const CATEGORY_VISUALS: Record<string, CategoryVisuals> = {
  movies: { vivid: '#005ef4', deep: '#24a7cf', cutout: '/categories/avatar.webp' },
  series: { vivid: '#ffb700', deep: '#e5e22a', cutout: '/categories/friends.webp' },
  animation: { vivid: '#ff0c49', deep: '#e02076', cutout: '/categories/spider.webp' },
  enfant: { vivid: '#0b6dff', deep: '#0e8dc8', cutout: '/categories/yeti.webp' },
  jeunesse: { vivid: '#00d0ff', deep: '#33a261', cutout: '/categories/brian.webp' },
  documentaries: { vivid: '#0055FF', deep: '#076498', cutout: '/categories/perroquet.webp' },
  anime: { vivid: '#451ee5', deep: '#ba5df0', cutout: '/categories/solo.webp' },
  action: { vivid: '#00ba28', deep: '#32e058', cutout: '/categories/action.webp' },
};

const DEFAULT_VISUALS: CategoryVisuals = CATEGORY_VISUALS.movies;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ListCardGenre({ watchlist, href, genreId, index = 0 }: ListCardGenreProps) {
  const visuals = (genreId && CATEGORY_VISUALS[genreId]) || DEFAULT_VISUALS;
  const itemCount = watchlist.items.length;
  const [hover, setHover] = useState(false);

  const cardStyle: CSSProperties = {
    aspectRatio: '21 / 20',
    background: `linear-gradient(160deg, ${visuals.vivid} 0%, ${visuals.deep} 100%)`,
    transform: hover ? 'translateY(-2px)' : 'translateY(0)',
    transition: 'transform 220ms cubic-bezier(.2,.8,.2,1), box-shadow 220ms',
    boxShadow: hover ? '0 18px 36px -14px rgba(0,0,0,0.55)' : '0 8px 22px -14px rgba(0,0,0,0.4)',
  };

  const cutoutStyle: CSSProperties = {
    height: '100%',
    width: 'auto',
    objectFit: 'contain',
    objectPosition: 'center bottom',
    transform: hover ? 'translateY(0px) scale(1.02)' : 'scale(1)',
    transition: 'transform 380ms cubic-bezier(.2,.8,.2,1)',
    filter: 'drop-shadow(0 12px 18px rgba(0,0,0,0.30))',
  };

  return (
    <Link
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group block cursor-pointer"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full overflow-hidden rounded-xl"
        style={cardStyle}
      >
        {/* Top dark gradient (top→transparent at 40%) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, transparent 40%)',
          }}
        />

        {/* Cutout image, centered bottom, 85% height */}
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 flex h-[85%] items-end justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={visuals.cutout} alt="" style={cutoutStyle} />
        </div>

        {/* Bottom dark gradient (bottom→transparent at 40%) for text readability */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(0deg, rgba(0,0,0,0.32) 0%, transparent 40%)',
          }}
        />

        {/* Count badge — top right, backdrop-blur */}
        <div
          className="absolute top-3 right-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white/95"
          style={{
            background: 'rgba(0,0,0,0.30)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {itemCount} {itemCount === 1 ? 'liste' : 'listes'}
        </div>

        {/* Title bottom-left */}
        <div className="absolute inset-0 flex flex-col justify-end px-[18px] pt-[18px] pb-[22px]">
          <h3
            className="m-0 text-[22px] leading-none font-bold tracking-tight text-white"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
          >
            {watchlist.name}
          </h3>
        </div>
      </motion.div>
    </Link>
  );
}
