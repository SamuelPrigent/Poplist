import { Img as Image } from '@/components/ui/Img';
import { cn } from '@/lib/cn';
import type { Content } from '@/types/content';
import { HeroCopy, type HeroCopyVariant } from './HeroCopy';
import { MOBILE_STRIP, V1_COLUMNS, V1_EXTRA_COLUMNS } from './posters';

/**
 * V1 — « Le mur d'affiches », raffiné.
 *
 * Ce qui ne bouge pas : l'ancrage à droite, la rotation -12°, le pas de
 * colonne, le rythme vertical 0 / -64 / +32, et l'ordre des images.
 *
 * Ce qui change :
 *  - 6 colonnes au lieu de 8. Les deux supprimées n'apparaissaient qu'au delà
 *    de ~1150px et ~1600px : ce sont elles qui remplissaient le fond derrière
 *    le texte sur grand écran.
 *  - le voile de lisibilité est ancré sur la COLONNE DE TEXTE, plus sur un
 *    pourcentage de viewport. C'est la cause du bug « ça va en 13 pouces, ça
 *    déborde en 27 pouces » : un dégradé à 35% du viewport couvre le texte à
 *    1440px et le laisse nu à 2560px.
 *  - plus de mot en dégradé, plus de `shadow-lg` générique (token `poster`).
 */

// Rythme vertical d'origine des colonnes : col1 = 0, col2 = -64px, col3 = +32px.
const COLUMN_OFFSETS = [0, -64, 32];
// La rotation -12° fait descendre les colonnes à mesure qu'on va vers la
// gauche (≈ sin(12°) × le pas horizontal). On les remonte d'autant.
const ROTATION_DROP_PER_COLUMN = 47;

const EXTRA_COLUMNS = V1_EXTRA_COLUMNS.map((images, i) => {
  // step = distance depuis col1 (1 → colonne juste à gauche de col1)
  const step = V1_EXTRA_COLUMNS.length - i;
  const cycleIndex = (3 - (step % 3)) % 3;
  return {
    key: `extra-${step}`,
    step,
    // -195px ≈ une vignette (175px) + gap (20px) : une rangée de plus en haut
    // pour couvrir le coin haut-gauche.
    top: COLUMN_OFFSETS[cycleIndex] - 195 - step * ROTATION_DROP_PER_COLUMN,
    images,
  };
});

const CELL =
  'relative w-[140px] md:w-[180px] lg:w-[200px] aspect-16/14 overflow-hidden ' +
  'rounded-poster border border-[lab(10_0_0)] shadow-poster';

const COLUMN = 'flex flex-col gap-3 md:gap-5';

function Cell({ src, eager = false }: { src: string; eager?: boolean }) {
  return (
    <div className={CELL}>
      <Image
        src={src}
        alt=""
        fill
        sizes="200px"
        className="object-cover"
        // Le bloc desktop est display:none sous 750px : un eager forcerait
        // quand même le téléchargement sur mobile.
        loading={eager ? 'eager' : 'lazy'}
      />
    </div>
  );
}

/** Bandeau mobile : une rangée qui défile en boucle (2 copies → sans couture). */
function MobileStrip() {
  return (
    <div className="mask-[linear-gradient(to_right,transparent,black_7%,black_93%,transparent)] overflow-hidden">
      <div className="animate-slide-right flex w-max gap-2.5">
        {[...MOBILE_STRIP, ...MOBILE_STRIP].map((src, index) => (
          <div
            key={`${src}-${index}`}
            className="rounded-poster relative aspect-16/14 h-[100px] shrink-0 overflow-hidden border border-[lab(10_0_0)]"
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="140px"
              className="object-cover"
              loading={index < 6 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroPosterField({
  content,
  ctaUrl,
  copyVariant = 'sobre',
}: {
  content: Content;
  ctaUrl: string;
  copyVariant?: HeroCopyVariant;
}) {
  return (
    <section className="bg-background relative min-h-[85vh] overflow-hidden max-[749px]:min-h-0">
      {/* ─────────────────────────── Confortable (≥750px) ─────────────────────── */}
      <div className="max-[749px]:hidden">
        {/* Fondus de bord : haut (sous la navbar) et bas (vers la section suivante) */}
        <div className="from-background pointer-events-none absolute inset-x-0 top-0 z-20 h-32 bg-linear-to-b to-transparent" />
        <div className="from-background via-background/90 pointer-events-none absolute inset-x-0 bottom-0 z-20 h-60 bg-linear-to-t to-transparent" />

        <div className="relative mx-auto max-w-[1800px] 2xl:max-w-[1600px]">
          <div className="absolute top-1/2 right-0 z-10 -translate-y-1/2 translate-x-[15%] opacity-40 sm:translate-x-[10%] sm:opacity-50 md:translate-x-[5%] md:opacity-70 lg:opacity-100 2xl:translate-x-0">
            <div className="-rotate-12 transform">
              {/* --colstep = largeur vignette + gap, par breakpoint */}
              <div className="relative flex gap-4 md:gap-7 [--colstep:156px] md:[--colstep:208px] lg:[--colstep:228px]">
                {EXTRA_COLUMNS.map((column) => (
                  <div
                    key={column.key}
                    className={cn('absolute hidden md:flex', COLUMN)}
                    style={{
                      left: `calc(${column.step} * var(--colstep) * -1)`,
                      top: column.top,
                    }}
                  >
                    {column.images.map((src, i) => (
                      <Cell key={`${column.key}-${i}`} src={src} />
                    ))}
                  </div>
                ))}

                <div className={cn('hidden sm:flex', COLUMN)}>
                  {V1_COLUMNS[0].map((src, i) => (
                    <Cell key={`c1-${i}`} src={src} />
                  ))}
                </div>
                <div className={cn('-mt-16', COLUMN)}>
                  {V1_COLUMNS[1].map((src, i) => (
                    <Cell key={`c2-${i}`} src={src} eager={i < 2} />
                  ))}
                </div>
                <div className={cn('mt-8 hidden md:flex', COLUMN)}>
                  {V1_COLUMNS[2].map((src, i) => (
                    <Cell key={`c3-${i}`} src={src} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-30 mx-auto flex min-h-[85vh] max-w-7xl items-center px-6 py-20 lg:px-8">
            {/* Voile de lisibilité ancré sur la colonne de texte : il commence
                hors écran à gauche et s'éteint au bord droit du bloc de texte,
                donc il suit la largeur du texte à toutes les résolutions. */}
            <div
              aria-hidden
              className="from-background via-background/94 pointer-events-none absolute inset-y-0 -left-[50vw] z-0 w-[calc(50vw+920px)] bg-linear-to-r from-62% via-92% to-transparent"
            />
            <HeroCopy
              content={content}
              ctaUrl={ctaUrl}
              variant={copyVariant}
              className="relative z-10 max-w-xl"
            />
          </div>
        </div>
      </div>

      {/* ──────────────────────────── Compact (<750px) ────────────────────────── */}
      <div className="relative min-[750px]:hidden">
        <div className="flex flex-col justify-center gap-9 py-14">
          <div className="relative">
            <MobileStrip />
            <div className="to-background pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-transparent" />
          </div>
          <HeroCopy
            content={content}
            ctaUrl={ctaUrl}
            variant={copyVariant}
            align="center"
            compact
            className="px-5"
          />
        </div>
      </div>
    </section>
  );
}
