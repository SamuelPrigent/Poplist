'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ListCardGenre({ watchlist, href, genreId, index = 0 }: ListCardGenreProps) {
  const categoryImage = genreId ? categoryImages[genreId] : undefined;
  const itemCount = watchlist.items.length;

  return (
    <Link
      href={href}
      className="group block cursor-pointer rounded-lg p-2 transition-colors hover:bg-muted/30"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative aspect-32/29 w-full overflow-hidden rounded-xl bg-[hsl(218,41.33%,15.51%)]/30"
      >
        {/* Background image */}
        {categoryImage && (
          <div className="absolute inset-0 flex items-end justify-center">
            <Image
              src={categoryImage}
              alt=""
              width={300}
              height={400}
              className="h-[85%] w-auto object-contain opacity-80 saturate-[0.95]"
              style={{ objectPosition: 'center bottom' }}
              loading="eager"
              priority
            />
          </div>
        )}

        {/* Dark gradient overlay - top */}
        <div className="absolute inset-0 bg-linear-to-b from-background/40 to-transparent to-35%" />

        {/* Dark gradient overlay - bottom for text readability */}
        <div className="absolute inset-0 bg-linear-to-t from-[var(--genre-card-gradient)] to-transparent to-45%" />

        {/* Genre name + count */}
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <h3 className="text-[20px] font-bold tracking-tight text-white drop-shadow-lg">
            {watchlist.name}
          </h3>
          <span className="text-muted-foreground mt-1 text-xs drop-shadow-lg">
            {itemCount} {itemCount === 1 ? 'liste' : 'listes'}
          </span>
        </div>

        {/* White bottom line */}
        <div className="absolute right-5 bottom-0 left-5 flex justify-center">
          <div className="h-[2.7px] w-full rounded-full bg-white/80" />
        </div>
      </motion.div>
    </Link>
  );
}
