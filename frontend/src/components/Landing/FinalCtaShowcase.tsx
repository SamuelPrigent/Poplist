'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';
import { Img as Image } from '@/components/ui/Img';
import { CtaPrimary, SectionHeading } from '@/components/Landing/primitives';
import { cn } from '@/lib/cn';
import type { Content } from '@/types/content';
import { STILL } from './hero/posters';

/**
 * CTA final — version « Amphi » retenue : une double couronne d'affiches
 * coupée par le fold, la seconde rangée en retrait, sur un horizon grainé.
 * (Défilé, Projecteur, Ticket, Orbites, Pipeline, Globe, Réseau et Arche ont
 * été écartés au fil des passes.)
 *
 * Géométrie : les vignettes sont placées à chevauchement CONSTANT, en tenant
 * compte de l'empreinte réelle d'une vignette tournée — un pas angulaire
 * régulier ferait exploser le recouvrement aux extrémités. Cf. `archAngles`.
 */

/* ─────────────────────────── Noyau commun ─────────────────────────── */

function CtaCore({
  content,
  ctaUrl,
  align = 'center',
  className,
}: {
  content: Content;
  ctaUrl: string;
  align?: 'center' | 'start';
  className?: string;
}) {
  const centered = align === 'center';
  return (
    <div
      className={cn(
        'relative z-10 flex flex-col',
        centered ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      <SectionHeading align={align} className="max-w-[20ch]">
        <span className="max-[749px]:hidden">{content.landing.finalCta.title}</span>
        <span className="hidden max-[749px]:inline">{content.landing.finalCta.titleMobile}</span>
      </SectionHeading>
      <div className="mt-8">
        {/* Même libellé que le CTA du hero : les deux mènent à /home, ils
            doivent annoncer la même chose. Le titre au-dessus ne change pas. */}
        <CtaPrimary to={ctaUrl} withArrow>
          {content.home.hero.cta}
        </CtaPrimary>
      </div>
      <Disclaimer content={content} className={cn('mt-5', !centered && 'justify-start')} />
    </div>
  );
}

function Disclaimer({ content, className }: { content: Content; className?: string }) {
  return (
    <p
      className={cn(
        'text-label text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-1',
        className,
      )}
    >
      {content.landing.finalCta.disclaimer.split('•').map((part) => (
        <span key={part} className="flex items-center gap-1.5">
          <Check strokeWidth={1.5} className="h-4 w-4 shrink-0" aria-hidden />
          {part.trim()}
        </span>
      ))}
    </p>
  );
}

type VersionProps = { content: Content; ctaUrl: string };

/* ──────────────────────────── Arche ─────────────────────────────────── */

/**
 * 9 vignettes (et non 11) : à rayon 500 et ouverture 56°, l'arc entre deux
 * centres vaut ~122px pour des vignettes de 104px → ~18px d'air entre
 * chacune. Avec 11 elles se chevauchaient.
 */
/**
 * Uniquement des PLANS de films (cadrage large), jamais des affiches
 * verticales : la vignette est en 16:14, une affiche 2:3 y rentre écrasée.
 * C'est ce qui rendait Harry Potter et Le Parrain mauvais dans l'arche.
 */
const ARCH_STILLS = [
  STILL.taxidriver, STILL.driveNeon, STILL.lalalandNight, STILL.joker,
  STILL.budapestRouge, STILL.jake, STILL.dunePaul, STILL.whiplashOrange,
  STILL.onceUpon,
];

function ArchHorizon() {
  return (
    <>
      <div
        className="absolute inset-x-0 bottom-0 h-64"
        style={{
          background:
            'radial-gradient(60% 90% at 50% 115%, rgb(56 199 255 / 0.22) 0%, transparent 70%)',
        }}
      />
      <div className="hero-grain absolute inset-x-0 bottom-0 h-64 opacity-45" />
    </>
  );
}

/**
 * Empreinte horizontale d'une vignette une fois tournée : c'est elle qui
 * détermine le chevauchement réel, pas la largeur brute. Une vignette à 55°
 * occupe ~135px alors qu'elle en fait 104.
 */
function footprint(angleDeg: number, width: number) {
  const rad = (Math.abs(angleDeg) * Math.PI) / 180;
  return width * Math.cos(rad) + width * (14 / 16) * Math.sin(rad);
}

/**
 * Place les vignettes en partant du centre, en résolvant à chaque pas
 * l'angle qui laisse exactement `overlap` pixels de recouvrement avec la
 * voisine. Un pas angulaire CONSTANT donnerait un chevauchement qui explose
 * vers les extrémités (l'empreinte grandit avec la rotation).
 */
function archAngles(count: number, width: number, radius: number, overlap: number) {
  const angles = new Array<number>(count).fill(0);
  const middle = Math.floor((count - 1) / 2);

  for (let i = middle + 1; i < count; i++) {
    const previous = angles[i - 1];
    let angle = previous;
    // 5 itérations suffisent : la suite converge en 3.
    for (let step = 0; step < 5; step += 1) {
      const arc = (footprint(previous, width) + footprint(angle, width)) / 2 - overlap;
      angle = previous + ((arc / radius) * 180) / Math.PI;
    }
    angles[i] = angle;
  }
  for (let i = middle; i >= 0; i -= 1) angles[i] = -angles[count - 1 - i];

  return angles;
}

function ArchRow({
  stills,
  radius,
  overlap,
  width,
  top,
  dim = 0,
  tileClassName,
}: {
  stills: string[];
  radius: number;
  /** Recouvrement voulu entre deux vignettes voisines, en pixels. */
  overlap: number;
  width: number;
  top: number;
  dim?: number;
  /** Classes posées sur chaque vignette (ex. masquer la rangée en compact). */
  tileClassName?: string;
}) {
  const count = stills.length;
  const angles = archAngles(count, width, radius, overlap);
  const spread = angles[count - 1] || 1;
  return (
    <>
      {stills.map((src, i) => {
        const angle = angles[i];
        const distance = Math.abs(angle) / spread;
        return (
          <div
            key={`${src}-${i}`}
            className={cn(
              'rounded-poster absolute left-1/2 aspect-16/14 overflow-hidden border border-[lab(10_0_0)]',
              // L'opacité passe par une variable CSS et NON par le style
              // inline : un `style.opacity` écraserait toute classe
              // responsive (c'est ce qui laissait la rangée intérieure
              // visible en compact malgré `max-[749px]:opacity-0`).
              'opacity-(--tile-opacity)',
              tileClassName,
            )}
            style={
              {
                width,
                top,
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px)`,
                '--tile-opacity': (1 - distance * 0.55) * (1 - dim),
                filter: dim > 0 ? 'brightness(0.6)' : undefined,
                // Paquet de cartes : chaque vignette passe AU-DESSUS de sa
                // voisine de gauche. L'ordre du DOM suffirait, on l'explicite.
                zIndex: i,
              } as React.CSSProperties
            }
          >
            <Image
              src={src}
              alt=""
              fill
              sizes={`${width}px`}
              className="object-cover"
              loading="lazy"
            />
          </div>
        );
      })}
    </>
  );
}

/* ──────────────────────────── Amphi ─────────────────────────────────── */

/**
 * 5 vignettes, rayon 370, ouverture 36° → arc ~116px pour 84px de large
 * (32px d'air entre elles) et 130px d'écart radial avec la couronne
 * extérieure (contre 82px de demi-hauteurs cumulées, donc ~48px de vide).
 * L'ouverture est plus serrée que la couronne extérieure : la rangée
 * intérieure reste haute, ne croise pas le titre, et se love dans l'arc.
 */
const AMPHI_INNER = [
  STILL.oren, STILL.oppenClouds, STILL.lalaland, STILL.driveHammer, STILL.herFenetre,
];

function CtaAmphi({ content, ctaUrl }: VersionProps) {
  return (
    // Même règle que l'Arche : pb-0 pour que l'horizon rejoigne le footer.
    <div className="relative -mx-6 overflow-hidden pt-10 pb-0 lg:-mx-8">
      {/* Zone purement décorative : ni lue, ni cliquable, ni animée. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Couronne extérieure, puis une seconde rangée en retrait, plus
            sombre : l'amphithéâtre. 130px d'écart radial entre les deux
            rangées (contre 82px de demi-hauteurs cumulées) → elles ne se
            touchent pas. */}
        <ArchHorizon />
        <ArchRow stills={ARCH_STILLS} radius={500} overlap={9} width={104} top={572} />
        <ArchRow
          stills={AMPHI_INNER}
          radius={370}
          overlap={7}
          width={84}
          top={572}
          dim={0.25}
          // En compact la rangée intérieure encombre et pousse le titre trop
          // bas : on la retire (opacité 0, elle garde sa place dans le flux
          // absolu donc rien d'autre ne se décale).
          tileClassName="max-[749px]:opacity-0"
        />
      </div>
      {/* pt plus généreux que l'Arche : le titre doit passer SOUS la rangée
          intérieure, pas se superposer à elle. */}
      <CtaCore
        content={content}
        ctaUrl={ctaUrl}
        // En compact la rangée intérieure est masquée : le titre peut donc
        // remonter nettement plus près de la couronne extérieure.
        className="pt-[16.9rem] pb-24 max-[749px]:pt-[8.2rem] max-[749px]:pb-16"
      />
    </div>
  );
}

/* ─────────────────────────── Le sélecteur ───────────────────────────── */

const VERSIONS = [
  // `bleedBottom` : la version gère son propre bas de section. Sans ça le
  // `pb` du <section> laisse une bande noire entre la fin du dégradé et le
  // footer — c'est ce qui coupait l'horizon de l'arche.
  { id: 'amphi', label: 'Amphi', Component: CtaAmphi, bleedBottom: true },
] as const;

type VersionId = (typeof VERSIONS)[number]['id'];

export function FinalCtaShowcase({ content, ctaUrl }: VersionProps) {
  const [active, setActive] = useState<VersionId>('amphi');
  const current = VERSIONS.find((version) => version.id === active) ?? VERSIONS[0];
  const Current = current.Component;

  return (
    <section
      className={cn(
        'relative pt-24 max-[749px]:pt-14',
        current.bleedBottom ? 'pb-0' : 'pb-32 max-[749px]:pb-20',
      )}
    >
      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-8 max-[749px]:px-4">
        {VERSIONS.length > 1 ? (
        <div
          className="border-border bg-card/90 rounded-control absolute -top-8 right-6 z-40 flex gap-0.5 border p-1 backdrop-blur-sm lg:right-8 max-[749px]:right-4"
          role="group"
          aria-label="Version du CTA final"
        >
          {VERSIONS.map((version, index) => {
            const isActive = version.id === active;
            return (
              <button
                key={version.id}
                type="button"
                onClick={() => setActive(version.id)}
                aria-pressed={isActive}
                className={cn(
                  'text-label rounded-md px-2.5 py-1 transition-colors duration-150 ease-out',
                  'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2',
                  isActive
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground cursor-pointer',
                )}
              >
                <span className="max-[899px]:hidden">{version.label}</span>
                <span className="hidden max-[899px]:inline">{index + 1}</span>
              </button>
            );
          })}
        </div>
        ) : null}

        <Current content={content} ctaUrl={ctaUrl} />
      </div>
    </section>
  );
}
