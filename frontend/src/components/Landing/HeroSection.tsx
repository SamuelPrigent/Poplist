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
    image: 'https://image.tmdb.org/t/p/w500/zqkmTXzjkAgXmEWLRsY4UpTWCeo.jpg',
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
    image: kb,
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
          <span className="bg-linear-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
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
    // const featuresSection = document.querySelector('section:nth-of-type(3)');
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
      {/* Blur glow shapes */}
      <div className="pointer-events-none absolute left-0 top-1/4 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-[350px] w-[350px] rounded-full bg-blue-600/10 blur-[120px]" />

      {/* Gradient overlay from left - covers part of the grid */}
      <div
        className="pointer-events-none absolute inset-0 z-20 bg-linear-to-r from-background via-background/80 to-transparent"
        style={{ width: '50%' }}
      />

      {/* Gradient overlay from bottom - more imposing */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-60 bg-linear-to-t from-background via-background/90 to-transparent" />

      {/* Right: Tilted Poster Grid - 3 columns with stagger */}
      <div className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-[5%]">
        <div className="-rotate-12 transform">
          <div className="flex gap-7">
            {/* Column 1 - no offset */}
            <div className="flex flex-col gap-5">
              {col1.map(movie => (
                <div
                  key={movie.id}
                  className="relative w-[200px] aspect-16/14 overflow-hidden rounded-lg border border-white/10"
                >
                  <Image
                    src={movie.image}
                    alt={movie.title}
                    fill
                    sizes="220px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Column 2 - offset up */}
            <div className="flex flex-col gap-5 -mt-16">
              {col2.map(movie => (
                <div
                  key={movie.id}
                  className="relative w-[200px] aspect-16/14 overflow-hidden rounded-lg border border-white/10 shadow-lg"
                >
                  <Image
                    src={movie.image}
                    alt={movie.title}
                    fill
                    sizes="220px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Column 3 - offset down */}
            <div className="flex flex-col gap-5 mt-8">
              {col3.map(movie => (
                <div
                  key={movie.id}
                  className="relative w-[200px] aspect-16/14 overflow-hidden rounded-lg border border-white/10 shadow-lg"
                >
                  <Image
                    src={movie.image}
                    alt={movie.title}
                    fill
                    sizes="220px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Left: Text content */}
      <div className="mt-3 relative z-30 mx-auto flex min-h-[85vh] max-w-7xl items-center px-6 py-20">
        <div className="flex max-w-xl flex-col items-start text-left">
          {/* Main Title */}
          <h1 className="mb-6 text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-[61px] lg:leading-[1.1]">
            {renderTitleWithGradient(content.landing.hero.title)}
          </h1>

          {/* Subtitle */}
          <p className="mb-8 max-w-md text-lg text-gray-200">
            {renderSubtitleWithUnderline(content.landing.hero.subtitle)}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 mt-3">
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
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <span className="text-violet-400">✓</span> Sans carte bancaire
            </span>
            <span className="flex items-center gap-2">
              <span className="text-violet-400">✓</span> Application 100% gratuite
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
