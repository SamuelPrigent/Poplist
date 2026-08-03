'use client';

import { useState } from 'react';
import { Img as Image } from '@/components/ui/Img';
import { SectionHeading } from '@/components/Landing/primitives';
import { cn } from '@/lib/cn';
import type { Content } from '@/types/content';

/**
 * « Apprécié par les passionnés » — 2 versions.
 *
 * Les deux partagent l'habillage de la section « Démarrez dans la seconde » :
 * cadre `rounded-3xl` au filet du système (`border`), filet lumineux de
 * 150px centré sur l'arête haute, citation aux rôles `body` / `muted`.
 *
 *  Défilé — deux bandes en boucle continue, sens opposés, masquées aux bords
 *  Mur    — trois colonnes en quinconce, hauteurs libres
 *
 * La contrainte de départ tient toujours : la section précédente est déjà
 * trois blocs de même ratio alignés, il faut casser cette grille ici.
 */

const TESTIMONIALS = [
  { key: 'testimonial1', avatar: '/landing/avatar/marie.webp' },
  { key: 'testimonial2', avatar: '/landing/avatar/thomas.webp' },
  { key: 'testimonial3', avatar: '/landing/avatar/julie.webp' },
  { key: 'testimonial4', avatar: '/landing/avatar/karim.jpg' },
  { key: 'testimonial5', avatar: '/landing/avatar/lea.jpg' },
  { key: 'testimonial6', avatar: '/landing/avatar/antoine.jpg' },
] as const;

type TestimonialKey = (typeof TESTIMONIALS)[number]['key'];
type VersionProps = { content: Content };

/* ─────────────────────────── La carte commune ─────────────────────────── */

/**
 * Reprise fidèle du cadre du template : pas de fond, une bordure très claire
 * à faible alpha, et le filet lumineux posé à cheval sur l'arête haute.
 */
function TemplateCard({
  content,
  itemKey,
  avatar,
  className,
}: {
  content: Content;
  itemKey: TestimonialKey;
  avatar: string;
  className?: string;
}) {
  const testimonial = content.landing.testimonials[itemKey];
  return (
    <figure
      className={cn(
        'border-border relative flex flex-col justify-between rounded-3xl border p-6',
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 h-px w-[150px] max-w-full -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, hsl(210 25% 96% / 0.4) 50%, transparent 100%)',
        }}
      />
      <blockquote className="text-body text-copy">{testimonial.text}</blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <Image
          src={avatar}
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-medium text-[#fcfdff]/90">{testimonial.author}</p>
          <p className="text-label text-muted-foreground">{testimonial.pseudo}</p>
        </div>
      </figcaption>
    </figure>
  );
}

function Heading({ content }: VersionProps) {
  return (
    <SectionHeading>
      <span className="max-[749px]:hidden">{content.landing.testimonials.title}</span>
      <span className="hidden max-[749px]:inline">{content.landing.testimonials.titleMobile}</span>
    </SectionHeading>
  );
}

/* ───────────────────────────── V1 — Défilé ────────────────────────────── */

/**
 * Boucle : la liste est doublée et la bande translate de -50%, donc la
 * seconde copie arrive pile là où la première a commencé. L'écart entre
 * cartes est porté par `mr-*` et NON par `gap` — avec `gap`, la moitié de la
 * largeur totale tombe au milieu d'un espacement et la boucle dérive.
 */
const MARQUEE_ROWS = [
  { items: TESTIMONIALS, animation: 'motion-safe:animate-slide-right', duration: '64s' },
  {
    items: [...TESTIMONIALS].reverse(),
    animation: 'motion-safe:animate-slide-left',
    duration: '78s',
  },
];

/** Fondu progressif sur les côtés : sans lui, l'overflow coupe au couteau. */
const EDGE_MASK = {
  maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
  WebkitMaskImage:
    'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
} as const;

function Defile({ content }: VersionProps) {
  return (
    <>
      <Heading content={content} />

      {/* -mx-6 : les bandes filent jusqu'aux bords de la page. */}
      <div className="mt-12 -mx-6 flex flex-col gap-5 lg:-mx-8 max-[749px]:mt-8">
        {MARQUEE_ROWS.map((row) => (
          <div key={row.duration} className="group overflow-hidden" style={EDGE_MASK}>
            <div
              className={cn(
                'flex w-max',
                row.animation,
                'group-hover:[animation-play-state:paused]',
              )}
              style={{ animationDuration: row.duration }}
            >
              {[...row.items, ...row.items].map((item, index) => (
                <TemplateCard
                  key={`${item.key}-${index}`}
                  content={content}
                  itemKey={item.key}
                  avatar={item.avatar}
                  className="mr-5 w-[360px] shrink-0 max-[749px]:w-[300px]"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ────────────────────────────── V2 — Mur ──────────────────────────────── */

/**
 * Trois colonnes en quinconce : les cartes n'ont pas la même hauteur et les
 * colonnes sont décalées verticalement. C'est ce décalage qui rompt avec la
 * grille régulière de la section du dessus.
 */
const WALL_COLUMNS: { items: TestimonialKey[]; offset: string }[] = [
  { items: ['testimonial1', 'testimonial4'], offset: '' },
  { items: ['testimonial2', 'testimonial5'], offset: 'min-[750px]:mt-12' },
  { items: ['testimonial3', 'testimonial6'], offset: 'min-[750px]:mt-5' },
];

/** Alternative conservée : réactiver son entrée dans VERSIONS pour comparer. */
// @ts-expect-error -- volontairement non monté, cf. VERSIONS plus bas.
function Mur({ content }: VersionProps) {
  return (
    <>
      <Heading content={content} />
      <div className="mt-12 grid gap-6 min-[750px]:grid-cols-3 max-[749px]:mt-8 max-[749px]:gap-4">
        {WALL_COLUMNS.map((column) => (
          <div key={column.items[0]} className={cn('flex flex-col gap-6', column.offset)}>
            {column.items.map((key) => {
              const item = TESTIMONIALS.find((entry) => entry.key === key);
              if (!item) return null;
              return (
                <TemplateCard
                  key={key}
                  content={content}
                  itemKey={key}
                  avatar={item.avatar}
                />
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

/* ─────────────────────────── Le sélecteur ─────────────────────────────── */

/**
 * « Défilé » est la version retenue. `Mur` est conservé : remettre son entrée
 * dans VERSIONS fait réapparaître le sélecteur automatiquement.
 */
const VERSIONS = [
  { id: 'defile', label: 'Défilé', Component: Defile },
  // { id: 'mur', label: 'Mur', Component: Mur },
] as const;

type VersionId = (typeof VERSIONS)[number]['id'];

export function TestimonialsShowcase({ content }: VersionProps) {
  const [active, setActive] = useState<VersionId>('defile');
  const Current = VERSIONS.find((version) => version.id === active)?.Component ?? Defile;

  return (
    <section className="py-24 max-[749px]:py-14">
      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-8 max-[749px]:px-4">
        {VERSIONS.length > 1 ? (
        <div
          className="border-border bg-card/90 rounded-control absolute -top-10 right-6 z-40 flex gap-0.5 border p-1 backdrop-blur-sm lg:right-8 max-[749px]:right-4"
          role="group"
          aria-label="Version des témoignages"
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

        <Current content={content} />
      </div>
    </section>
  );
}
