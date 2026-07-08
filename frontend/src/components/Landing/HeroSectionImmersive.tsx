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
const padre = '/landing/movies/padre.webp';
const pulp = '/landing/movies/pulp.webp';
const western = 'landing/movies/western.webp';
const mercredi = 'landing/movies/mercredi.webp';
const bluetv = 'landing/movies/bluetv.webp';
const damon = 'landing/movies/damon.webp';
const agentsecret = 'landing/movies/007.webp';
const dicap = 'landing/movies/dicap.webp';
const gosling = 'landing/movies/ryangoslingcar.webp';
const brume2049 = 'landing/movies/brume2049.webp';
const taxidriver = 'landing/movies/taxidriver.webp';
const herFenetre = 'landing/movies/herFenetre.webp';
const furiosa = 'landing/movies/furiosa.webp';
const madmax = 'landing/movies/madmax.webp';
const oren = 'landing/movies/oren.webp';
const amelie = 'landing/movies/amelie.webp';
const driveHammer = 'landing/movies/driveHammer.webp';
const driveNeon = 'landing/movies/driveNeon.webp';
const lalaland = 'landing/movies/lalaland.webp';
const lalalandNight = 'landing/movies/lalalandNight.webp';
const whiplashOrange = 'landing/movies/whiplashOrange.webp';
const whiplashDrums = 'landing/movies/whiplashDrums.webp';
const budapestRouge = 'landing/movies/budapestRouge.webp';
const inTheMood = 'landing/movies/inTheMood.webp';
const inTheMoodRed = 'landing/movies/inTheMoodRed.webp';
const onceUpon = 'landing/movies/onceUpon.webp';
const dunePaul = 'landing/movies/dunePaul.webp';
const dune2Fire = 'landing/movies/dune2Fire.webp';
const oppenClouds = 'landing/movies/oppenClouds.webp';
const oppenBW = 'landing/movies/oppenBW.webp';
const guns = 'landing/movies/guns.webp';

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

// Passe à true le temps de placer tes images : ça coupe tous les fondus /
// assombrissements → la grille apparaît en pleine lumière, colonnes bien
// visibles. Remets false quand c'est fini.
// const DEBUG_HIDE_MASKS = true;
const DEBUG_HIDE_MASKS = false;

// new — colonnes ajoutées à GAUCHE, de gauche à droite à l'écran (ColG10
// touche les colonnes V1 Hero). Dans chaque colonne : de haut en bas.
// `visibleFrom` = largeur d'écran approx. à partir de laquelle la colonne
// entre dans le viewport — en dessous, elle est HORS ÉCRAN à gauche (modifier
// ses images ne change donc rien de visible, ce n'est pas un bug de refresh).
const EXTRA_COLUMNS_IMAGES = [
  {
    col: 'G6',
    visibleFrom: '~1600px',
    images: [amelie, whiplashOrange, driveHammer, lalalandNight, oppenBW, inTheMoodRed, dune2Fire],
  },
  {
    col: 'G7',
    visibleFrom: '~1150px',
    images: [furiosa, budapestRouge, lalaland, oren, whiplashDrums, dunePaul, madmax],
  },
  {
    col: 'G8',
    visibleFrom: 'tous les écrans',
    images: [brume2049, onceUpon, inTheMood, driveNeon, oppenClouds, taxidriver, herFenetre],
  },
  {
    col: 'G9',
    visibleFrom: 'tous les écrans',
    images: [blade2, blade2, dicap, saw, mercredi, western, blade2],
  },
  {
    col: 'G10',
    visibleFrom: 'tous les écrans (juste à gauche des colonnes V1 Hero)',
    images: [fenetre, bluetv, kb, damon, saw, pulp, blade2],
    // images: [blade2, blade2, blade2, blade2, blade2, blade2, blade2],
  },
];

// V1 Hero — les 15 images d'origine, dans le MÊME ordre que HeroSection classique :
// col1 = 0-4, col2 = 5-9, col3 = 10-14. Ces 3 colonnes gardent exactement
// leur emplacement d'avant (même wrapper ancré à droite, même rotation).
const FAMOUS_MOVIES = [
  { id: 1, title: 'Col1-Pos1', image: doa },
  { id: 2, title: 'Col1-Pos2', image: agentsecret },
  { id: 3, title: 'Col1-Pos3', image: joker },
  { id: 4, title: 'Col1-Pos4', image: jake },
  {
    id: 5,
    title: 'Col1-Pos5',
    image: hp1,
  },
  {
    id: 6,
    title: 'Col2-Pos1',
    image: padre,
  },
  { id: 7, title: 'Col2-Pos2', image: fenetre },
  { id: 8, title: 'Col2-Pos3', image: theFifth2 },
  { id: 9, title: 'Col2-Pos4', image: jinx },
  { id: 10, title: 'Col2-Pos5', image: gosling },
  { id: 11, title: 'Col3-Pos1', image: saw },
  { id: 12, title: 'Col3-Pos2', image: blade2 },
  { id: 13, title: 'Col3-Pos3', image: guns },
  { id: 14, title: 'Col3-Pos4', image: passion },
  { id: 15, title: 'Col3-Pos5', image: pdc },
];

// ─── Colonnes supplémentaires vers la GAUCHE ───────────────────────────────
// Elles sont rendues en position absolue À L'INTÉRIEUR du bloc roté d'origine :
// elles ne changent donc ni la taille ni le pivot de rotation du bloc → les
// 3 colonnes d'origine restent au pixel près, et les extras suivent le même
// plan incliné en débordant du bord gauche de l'écran (comme la maquette).
// Rythme vertical d'origine : col1 = 0, col2 = -64px (-mt-16), col3 = +32px
// (mt-8). On prolonge ce cycle vers la gauche pour un motif continu.
const COLUMN_OFFSETS = [0, -64, 32];
// La rotation -12° fait "descendre" les colonnes à mesure qu'on va vers la
// gauche (≈ sin(12°) ≈ 0.208 × le pas horizontal). On remonte chaque colonne
// d'autant pour rester dans la bande visible de l'écran.
const ROTATION_DROP_PER_COLUMN = 47; // ≈ 228px (largeur+gap lg) × 0.208

// Seul le POSITIONNEMENT est calculé ici — les images viennent telles quelles
// de EXTRA_COLUMNS_IMAGES (contrôle manuel, emplacement par emplacement).
const EXTRA_COLUMNS = EXTRA_COLUMNS_IMAGES.map((column, i) => {
  // j = distance depuis col1 (j=1 → colonne juste à gauche de col1)
  const j = EXTRA_COLUMNS_IMAGES.length - i;
  // Cycle inversé vers la gauche : ..., 0, -64, +32 | col1(0), col2(-64), col3(+32)
  const cycleIndex = (3 - (j % 3)) % 3;
  return {
    key: `extra-${column.col}`,
    step: j,
    // -195px ≈ un poster (175px) + gap (20px) : une rangée de plus en haut
    // pour couvrir le coin haut-gauche.
    top: COLUMN_OFFSETS[cycleIndex] - 195 - j * ROTATION_DROP_PER_COLUMN,
    images: column.images.map((image, r) => ({ key: `extra-${column.col}-${r}`, image })),
  };
});

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

export function HeroSectionImmersive({ content }: HeroSectionProps) {
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
        {/* --- Masques de lisibilité (au-dessus des posters, sous le texte) --- */}
        {!DEBUG_HIDE_MASKS && (
          <>
            {/* Assombrissement global léger pour homogénéiser l'ensemble */}
            <div className="pointer-events-none absolute inset-0 z-20 bg-background/30" />
            {/* Dégradé gauche → droite : zone texte bien lisible à gauche */}
            <div className="pointer-events-none absolute inset-0 z-20 bg-linear-to-r from-background from-0% via-background/85 via-35% to-transparent to-75%" />
            {/* Fondu haut (sous la navbar) et bas (transition vers la section suivante) */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-32 bg-linear-to-b from-background to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-60 bg-linear-to-t from-background via-background/90 to-transparent" />
          </>
        )}

        <div className="relative mx-auto max-w-[1800px] 2xl:max-w-[1600px]">
          {/* Bloc posters : STRICTEMENT identique à HeroSection (ancrage droite,
              rotation, colonnes) → les 3 colonnes d'origine ne bougent pas. */}
          <div className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-[15%] opacity-40 sm:translate-x-[10%] sm:opacity-50 md:translate-x-[5%] md:opacity-70 lg:opacity-100 2xl:translate-x-0">
            <div className="-rotate-12 transform">
              {/* --colstep = largeur poster + gap, par breakpoint (140+16 / 180+28 / 200+28) */}
              <div className="relative flex gap-4 md:gap-7 [--colstep:156px] md:[--colstep:208px] lg:[--colstep:228px]">
                {/* Colonnes supplémentaires vers la gauche, dans le même plan
                    incliné, en absolu → zéro impact sur les colonnes d'origine */}
                {EXTRA_COLUMNS.map((col) => (
                  <div
                    key={col.key}
                    className="absolute hidden md:flex flex-col gap-3 md:gap-5"
                    style={{
                      left: `calc(${col.step} * var(--colstep) * -1)`,
                      top: col.top,
                    }}
                  >
                    {col.images.map((cell) => (
                      <div
                        key={cell.key}
                        className="relative w-[140px] md:w-[180px] lg:w-[200px] aspect-16/14 overflow-hidden rounded-lg border border-[lab(10_0_0)] shadow-lg"
                      >
                        <Image
                          src={cell.image}
                          alt=""
                          fill
                          sizes="200px"
                          className="object-cover"
                          loading="eager"
                        />
                      </div>
                    ))}
                  </div>
                ))}

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
