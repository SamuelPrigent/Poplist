'use client';

import { Img as Image } from '@/components/ui/Img';
import { Link } from '@/components/ui/Link';
import { cn } from '@/lib/utils';
import type { Content } from '@/types/content';

interface TrendingItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  media_type?: 'movie' | 'tv';
}

interface HeroSectionProps {
  content: Content;
  trending: TrendingItem[];
  watchlistsUrl: string;
}
const saw = '/landing/movies/saw3.webp';
const pdc = '/landing/movies/pdc2.webp';
const jinx = '/landing/movies/jinx.webp';
const doa = '/landing/movies/DOA.webp';
const blade2 = '/landing/movies/blade2.webp';
const kb = '/landing/movies/kb.webp';
const oceans = '/landing/movies/oceans.webp';
const jake = '/landing/movies/jake.webp';
const passion = '/landing/movies/passion.webp';
const theFifth2 = '/landing/movies/theFifth2.webp';
const joker = '/landing/movies/joker.webp';
const fenetre = '/landing/movies/fenetre.webp';
const hp1 = '/landing/movies/hp1.webp';
const pulp = '/landing/movies/pulp.webp';

const FAMOUS_MOVIES_MOBILE = [
  { id: 1, title: 'Col1-Pos1', image: doa },
  { id: 2, title: 'Col1-Pos2', image: oceans },
  { id: 3, title: 'Col1-Pos3', image: joker },
  { id: 4, title: 'Col1-Pos4', image: jake },
  { id: 6, title: 'Col2-Pos1', image: hp1 },
  { id: 7, title: 'Col2-Pos2', image: fenetre },
  { id: 8, title: 'Col2-Pos3', image: theFifth2 },
  { id: 9, title: 'Col2-Pos4', image: jinx },
  { id: 10, title: 'Col2-Pos5', image: kb },
  { id: 11, title: 'Col3-Pos1', image: saw },
  { id: 12, title: 'Col3-Pos2', image: blade2 },
  { id: 13, title: 'Col3-Pos3', image: pulp },
  { id: 14, title: 'Col3-Pos4', image: passion },
];

// Version desktop — rétablie depuis l'historique git (état d'avant les
// derniers commits) : les remaniements récents ne concernaient que le mobile
// (cf. FAMOUS_MOVIES_MOBILE ci-dessus).
const FAMOUS_MOVIES = [
  { id: 1, title: 'Col1-Pos1', image: doa },
  { id: 2, title: 'Col1-Pos2', image: oceans },
  { id: 3, title: 'Col1-Pos3', image: joker },
  { id: 4, title: 'Col1-Pos4', image: jake },
  { id: 5, title: 'Col1-Pos5', image: 'https://image.tmdb.org/t/p/w500/tmU7GeKVybMWFButWEGl2M4GeiP.jpg' },
  { id: 6, title: 'Col2-Pos1', image: 'https://image.tmdb.org/t/p/w500/hziiv14OpD73u9gAak4XDDfBKa2.jpg' },
  { id: 7, title: 'Col2-Pos2', image: fenetre },
  { id: 8, title: 'Col2-Pos3', image: theFifth2 },
  { id: 9, title: 'Col2-Pos4', image: jinx },
  { id: 10, title: 'Col2-Pos5', image: kb },
  { id: 11, title: 'Col3-Pos1', image: saw },
  { id: 12, title: 'Col3-Pos2', image: blade2 },
  { id: 13, title: 'Col3-Pos3', image: 'https://image.tmdb.org/t/p/w500/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg' },
  { id: 14, title: 'Col3-Pos4', image: passion },
  { id: 15, title: 'Col3-Pos5', image: pdc },
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
          <span className="bg-[linear-gradient(48deg,lab(100_0_0),#38c7ff_70%)] bg-clip-text text-transparent">
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
            <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-[linear-gradient(48deg,lab(22_22.17_-40.1/0.41),#38c7ff_60%)]" />
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

// Masque de fondu horizontal (bords gauche/droite) du bandeau mobile.
const MASK_X = 'mask-[linear-gradient(to_right,transparent,black_7%,black_93%,transparent)]';

/** Une rangée de posters qui défile en boucle (2 copies → boucle sans couture). */
function PosterRow({
  heightClass = 'h-[104px]',
  className,
}: {
  heightClass?: string;
  className?: string;
}) {
  return (
    <div className={cn('overflow-hidden', className)}>
      <div className="flex w-max animate-slide-right gap-2.5">
        {[...FAMOUS_MOVIES_MOBILE, ...FAMOUS_MOVIES_MOBILE].map((movie, index) => (
          <div
            key={`${movie.id}-${index}`}
            className={cn(
              'relative aspect-16/14 shrink-0 overflow-hidden rounded-lg border border-[lab(10_0_0)]',
              heightClass,
            )}
          >
            <Image
              src={movie.image}
              alt=""
              fill
              sizes="140px"
              className="object-cover"
              loading="eager"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroSection({ content }: HeroSectionProps) {
  const handleScrollToFeatures = () => {
    document.querySelector('#ensavoirplus')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const col1 = FAMOUS_MOVIES.slice(0, 5);
  const col2 = FAMOUS_MOVIES.slice(5, 10);
  const col3 = FAMOUS_MOVIES.slice(10, 15);

  return (
    <section className="relative overflow-hidden bg-background min-h-[85vh] max-[749px]:min-h-0">
      {/* ============================ DESKTOP (>= 750px) ============================ */}
      <div className="max-[749px]:hidden">
        <div className="pointer-events-none absolute inset-0 z-20 bg-linear-to-r from-background from-0% via-background/90 via-30% to-transparent to-70%" />
        <div className="pointer-events-none absolute inset-0 z-20 bg-linear-to-r from-background/80 from-0% to-transparent to-50% md:from-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-60 bg-linear-to-t from-background via-background/90 to-transparent" />

        <div className="relative mx-auto max-w-[1800px] 2xl:max-w-[1600px]">
          <div className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-[15%] opacity-40 sm:translate-x-[10%] sm:opacity-50 md:translate-x-[5%] md:opacity-70 lg:opacity-100 2xl:translate-x-0">
            <div className="-rotate-12 transform">
              <div className="flex gap-4 md:gap-7">
                <div className="hidden sm:flex flex-col gap-3 md:gap-5">
                  {col1.map((movie) => (
                    <div
                      key={movie.id}
                      className="relative w-[140px] md:w-[180px] lg:w-[200px] aspect-16/14 overflow-hidden rounded-lg border border-[lab(10_0_0)]"
                    >
                      <Image
                        src={movie.image}
                        alt={movie.title}
                        fill
                        sizes="200px"
                        className="object-cover"
                        loading="eager"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3 md:gap-5 -mt-16">
                  {col2.map((movie) => (
                    <div
                      key={movie.id}
                      className="relative w-[140px] md:w-[180px] lg:w-[200px] aspect-16/14 overflow-hidden rounded-lg border border-[lab(10_0_0)] shadow-lg"
                    >
                      <Image
                        src={movie.image}
                        alt={movie.title}
                        fill
                        sizes="200px"
                        className="object-cover"
                        loading="eager"
                      />
                    </div>
                  ))}
                </div>
                <div className="hidden md:flex flex-col gap-3 md:gap-5 mt-8">
                  {col3.map((movie) => (
                    <div
                      key={movie.id}
                      className="relative w-[140px] md:w-[180px] lg:w-[200px] aspect-16/14 overflow-hidden rounded-lg border border-[lab(10_0_0)] shadow-lg"
                    >
                      <Image
                        src={movie.image}
                        alt={movie.title}
                        fill
                        sizes="200px"
                        className="object-cover"
                        loading="eager"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 relative z-30 mx-auto flex min-h-[85vh] max-w-7xl items-center justify-center px-6 py-20 md:justify-start lg:px-8">
            <div className="flex w-full flex-col items-center text-center md:w-auto md:max-w-xl md:items-start md:text-left">
              <h1 className="mb-6 text-[40px] leading-[1.15] font-semibold tracking-tight text-white sm:text-5xl lg:text-[61px] lg:leading-[1.1]">
                {renderTitleWithGradient(content.landing.hero.title)}
              </h1>
              <p className="mb-8 max-w-md text-lg text-gray-200">
                {renderSubtitleWithUnderline(content.landing.hero.subtitle)}
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-3 md:justify-start">
                <Link
                  to="/home"
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
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400 md:justify-start">
                <span className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span> Sans carte bancaire
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span> Application 100% gratuite
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================ MOBILE (< 750px) ============================ */}
      <div className="relative min-[750px]:hidden">
        <div className="flex flex-col justify-center gap-9 py-14">
          {/* Bandeau de posters défilant + fondu immersif vers le bas */}
          <div className="relative">
            <PosterRow heightClass="h-[100px]" className={MASK_X} />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
          </div>

          <div className="flex flex-col items-center px-5 text-center">
            <h1 className="mb-4 text-[32px] leading-[1.15] font-semibold tracking-tight text-white">
              {renderTitleWithGradient(content.landing.hero.titleMobile)}
            </h1>
            <p className="mb-7.5 max-w-md text-base text-gray-200">
              {renderSubtitleWithUnderline(content.landing.hero.subtitleMobile)}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/home"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-black transition-all hover:bg-gray-200"
              >
                {content.home.hero.cta}
              </Link>
              <button
                type="button"
                onClick={handleScrollToFeatures}
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-medium text-gray-300 transition-all hover:bg-white/5 hover:text-white"
              >
                {content.home.hero.ctaSecondary}
              </button>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="text-cyan-400">✓</span> Sans carte bancaire
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-cyan-400">✓</span> Application 100% gratuite
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
