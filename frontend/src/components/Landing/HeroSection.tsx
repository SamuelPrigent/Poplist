'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Content } from '@/types/content';

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
  watchlistsUrl: string;
}
import saw from '../../../public/landing/movies/saw3.jpg';
import pdc from '../../../public/landing/movies/pdc2.jpg';
import jinx from '../../../public/landing/movies/jinx.png';
import doa from '../../../public/landing/movies/DOA.jpg';
import blade2 from '../../../public/landing/movies/blade2.jpg';
import kb from '../../../public/landing/movies/kb.jpg';
import oceans from '../../../public/landing/movies/oceans.jpg';
import jake from '../../../public/landing/movies/jake.jpg';
import passion from '../../../public/landing/movies/passion.jpg';
import theFifth2 from '../../../public/landing/movies/theFifth2.jpg';
import joker from '../../../public/landing/movies/joker.jpg';
import fenetre from '../../../public/landing/movies/fenetre.jpg';

const FAMOUS_MOVIES = [
  // === COLONNE 1 (gauche) ===
  {
    id: 1,
    title: 'Col1-Pos1',
    image: doa,
  }, // Avatar
  {
    id: 2,
    title: 'Col1-Pos2',
    image: oceans,
  }, // Matrix
  {
    id: 3,
    title: 'Col1-Pos3',
    image: joker,
  }, // The Dark Knight
  {
    id: 4,
    title: 'Col1-Pos4',
    image: jake,
  }, // Shawshank
  {
    id: 5,
    title: 'Col1-Pos5',
    image: 'https://image.tmdb.org/t/p/w500/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
  }, // The Godfather

  // === COLONNE 2 (milieu) ===
  {
    id: 6,
    title: 'Col2-Pos1',
    image: 'https://image.tmdb.org/t/p/w500/hziiv14OpD73u9gAak4XDDfBKa2.jpg',
  }, // Harry Potter
  {
    id: 7,
    title: 'Col2-Pos2',
    image: fenetre,
  }, // Iron Man
  {
    id: 8,
    title: 'Col2-Pos3',
    image: theFifth2,
  }, // Dune
  {
    id: 9,
    title: 'Col2-Pos4',
    image: jinx,
  }, // Fight Club
  {
    id: 10,
    title: 'Col2-Pos5',
    image: kb,
  }, // Forrest Gump

  // === COLONNE 3 (droite) ===
  {
    id: 11,
    title: 'Col3-Pos1',
    image: saw,
  }, // Star Wars
  {
    id: 12,
    title: 'Col3-Pos2',
    image: blade2,
  }, // Avengers
  {
    id: 13,
    title: 'Col3-Pos3',
    image: 'https://image.tmdb.org/t/p/w500/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
  }, // Pulp Fiction
  {
    id: 14,
    title: 'Col3-Pos4',
    image: passion,
  }, // LOTR
  {
    id: 15,
    title: 'Col3-Pos5',
    image: pdc,
  }, // Inception
];

// Mots à mettre en gradient
const WORDS_TO_HIGHLIGHT = ['films', 'séries'];

const renderTitleWithGradient = (title: string) => {
  const words = title.split(' ');
  return words.map((word, index) => {
    const cleanWord = word.replace(/[.,!?]/g, '');
    const shouldHighlight = WORDS_TO_HIGHLIGHT.includes(cleanWord);
    return (
      <span key={index}>
        {shouldHighlight ? (
          <span className="bg-linear-to-r from-violet-400 from-10% to-blue-400 bg-clip-text text-transparent">
            {word}
          </span>
        ) : (
          word
        )}
        {index < words.length - 1 ? ' ' : ''}
      </span>
    );
  });
};

const renderSubtitleWithUnderline = (subtitle: string) => {
  const words = subtitle.split(' ');
  const underlineStart = 1;
  const underlineEnd = 2;

  return words.map((word, index) => {
    const isUnderlineStart = index === underlineStart;
    const isInUnderlineRange = index >= underlineStart && index <= underlineEnd;

    if (isUnderlineStart) {
      const underlinedWords = words.slice(underlineStart, underlineEnd + 1).join(' ');
      return (
        <span key={index}>
          <span className="relative inline-block">
            {underlinedWords}
            <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-linear-to-r from-violet-500/80 to-blue-500" />
          </span>
          {underlineEnd < words.length - 1 ? ' ' : ''}
        </span>
      );
    }

    if (isInUnderlineRange && !isUnderlineStart) {
      return null;
    }

    return (
      <span key={index}>
        {word}
        {index < words.length - 1 ? ' ' : ''}
      </span>
    );
  });
};

export function HeroSection({ content, watchlistsUrl }: HeroSectionProps) {
  const handleScrollToFeatures = () => {
    const featuresSection = document.querySelector('#ensavoirplus');
    featuresSection?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  // Split movies into 3 columns
  const col1 = FAMOUS_MOVIES.slice(0, 5);
  const col2 = FAMOUS_MOVIES.slice(5, 10);
  const col3 = FAMOUS_MOVIES.slice(10, 15);

  return (
    <section className="relative min-h-[85vh] overflow-hidden bg-background">
      {/* Gradient overlay from left - full width, smooth fade */}
      <div className="pointer-events-none absolute inset-0 z-20 bg-linear-to-r from-background from-0% via-background/90 via-30% to-transparent to-70%" />

      {/* Additional gradient for text readability on small screens */}
      <div className="pointer-events-none absolute inset-0 z-20 bg-linear-to-r from-background/80 from-0% to-transparent to-50% md:from-transparent" />

      {/* Gradient overlay from bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-60 bg-linear-to-t from-background via-background/90 to-transparent" />

      {/* Max-width container for large screens */}
      <div className="relative mx-auto max-w-[1800px] 2xl:max-w-[2000px]">
        {/* Right: Tilted Poster Grid - responsive columns */}
        <div className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-[15%] opacity-40 sm:translate-x-[10%] sm:opacity-50 md:translate-x-[5%] md:opacity-70 lg:opacity-100">
          <div className="-rotate-12 transform">
            <div className="flex gap-4 md:gap-7">
              {/* Column 1 - hidden on very small screens */}
              <div className="hidden sm:flex flex-col gap-3 md:gap-5">
                {col1.map(movie => (
                  <div
                    key={movie.id}
                    className="relative w-[140px] md:w-[180px] lg:w-[200px] aspect-16/14 overflow-hidden rounded-lg border border-white/10"
                  >
                    <Image
                      src={movie.image}
                      alt={movie.title}
                      fill
                      sizes="(max-width: 768px) 140px, (max-width: 1024px) 180px, 200px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* Column 2 - offset up, always visible */}
              <div className="flex flex-col gap-3 md:gap-5 -mt-16">
                {col2.map(movie => (
                  <div
                    key={movie.id}
                    className="relative w-[140px] md:w-[180px] lg:w-[200px] aspect-16/14 overflow-hidden rounded-lg border border-white/10 shadow-lg"
                  >
                    <Image
                      src={movie.image}
                      alt={movie.title}
                      fill
                      sizes="(max-width: 768px) 140px, (max-width: 1024px) 180px, 200px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* Column 3 - offset down, hidden on small screens */}
              <div className="hidden md:flex flex-col gap-3 md:gap-5 mt-8">
                {col3.map(movie => (
                  <div
                    key={movie.id}
                    className="relative w-[140px] md:w-[180px] lg:w-[200px] aspect-16/14 overflow-hidden rounded-lg border border-white/10 shadow-lg"
                  >
                    <Image
                      src={movie.image}
                      alt={movie.title}
                      fill
                      sizes="(max-width: 768px) 140px, (max-width: 1024px) 180px, 200px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Text content - centered on mobile, left on desktop */}
        <div className="mt-3 relative z-30 mx-auto flex min-h-[85vh] max-w-7xl items-center justify-center px-6 py-20 md:justify-start lg:px-8">
          <div className="flex w-full flex-col items-center text-center md:w-auto md:max-w-xl md:items-start md:text-left">
            {/* Main Title */}
            <h1 className="mb-6 text-[40px] leading-[1.15] font-semibold tracking-tight text-white sm:text-5xl lg:text-[61px] lg:leading-[1.1]">
              {renderTitleWithGradient(content.landing.hero.title)}
            </h1>

            {/* Subtitle */}
            <p className="mb-8 max-w-md text-lg text-gray-200">
              {renderSubtitleWithUnderline(content.landing.hero.subtitle)}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mt-3 md:justify-start">
              <Link
                href={watchlistsUrl}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-black transition-all hover:bg-gray-200"
              >
                {content.home.hero.cta}
              </Link>
              <button
                type="button"
                onClick={handleScrollToFeatures}
                className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl border border-white/20 px-6 text-sm font-medium text-gray-300 transition-all hover:bg-white/5 hover:text-white"
              >
                {content.home.hero.ctaSecondary}
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400 md:justify-start">
              <span className="flex items-center gap-2">
                <span className="text-violet-400">✓</span> Sans carte bancaire
              </span>
              <span className="flex items-center gap-2">
                <span className="text-violet-400">✓</span> Application 100% gratuite
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
