'use client';

import { Check, Link as LinkIcon, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Img as Image } from '@/components/ui/Img';
import { SectionHeading } from '@/components/Landing/primitives';
import { cn } from '@/lib/cn';
import type { Content } from '@/types/content';

/**
 * Section « Démarrez dans la seconde » — 2 versions switchables (bouton en
 * haut à droite) :
 *
 *  A. Poplist  — notre système (Bricolage à gauche, cartes filet 1px), sans
 *                numéros, avec la ligne lumineuse top des cartes Strix
 *                transposée sobrement.
 *  B. Template — reproduction fidèle du template Strix fourni par Samuel :
 *                titre centré en dégradé (`effect-font-gradient`,
 *                tracking-tighter, font-normal), cartes rounded-3xl à bordure
 *                filet du système sans bord bas, glow line top 150px,
 *                visuel 280px fondu vers le fond, h3 1.7rem font-normal.
 *
 * Les numéros 01/02/03 ont été retirés des deux versions (effet « IA »).
 */

const TMDB = 'https://image.tmdb.org/t/p';

/* ─────────── Visuels produit (partagés par les deux versions) ─────────── */

function StepVisualCreate() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 p-5">
      <span className="text-label text-muted-foreground">Nom de la liste</span>
      <span className="border-border bg-secondary/60 rounded-control text-body text-foreground flex h-10 items-center border px-3">
        Soirées d&apos;été
        <span className="bg-foreground/80 ml-px inline-block h-4 w-px animate-pulse" />
      </span>
      <span className="bg-primary text-background text-label rounded-control inline-flex h-9 w-fit items-center gap-1.5 px-3">
        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        Créer
      </span>
    </div>
  );
}

function StepVisualAdd() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5 p-5">
      <span className="border-border bg-secondary/60 rounded-control text-label text-muted-foreground flex h-9 items-center gap-2 border px-3">
        <Search className="h-3.5 w-3.5" strokeWidth={1.5} />
        Inception
      </span>
      <span className="flex items-center gap-2.5">
        <span className="rounded-poster relative h-11 w-[30px] shrink-0 overflow-hidden">
          <Image src={`${TMDB}/w92/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg`} alt="" fill sizes="30px" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-label text-foreground block truncate font-semibold">Inception</span>
          <span className="text-muted-foreground block text-xs">Film · 2010</span>
        </span>
        {/* Bordure transparente + mêmes paddings que le bouton « Ajouter »
            de la ligne 2 → les deux libellés sont alignés horizontalement. */}
        <span className="text-label text-foreground flex items-center gap-1 rounded-full border border-transparent px-2 py-0.5">
          <Check className="h-3.5 w-3.5" strokeWidth={2} />
          Ajouté
        </span>
      </span>
      <span className="flex items-center gap-2.5">
        <span className="rounded-poster relative h-11 w-[30px] shrink-0 overflow-hidden">
          <Image src={`${TMDB}/w92/l8CES84JndFlNfBNMxdLRYaLvI6.jpg`} alt="" fill sizes="30px" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-label text-foreground block truncate font-semibold">Alien</span>
          <span className="text-muted-foreground block text-xs">Film · 1979</span>
        </span>
        <span className="border-border text-label text-muted-foreground flex items-center gap-1 rounded-full border px-2 py-0.5">
          <Plus className="h-3 w-3" strokeWidth={2} />
          Ajouter
        </span>
      </span>
    </div>
  );
}

function StepVisualShare() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 p-5">
      <span className="border-border bg-secondary/60 rounded-control text-label text-muted-foreground flex h-10 items-center gap-2 border px-3">
        <LinkIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
        <span className="truncate">poplist.app/lists/soirees-d-ete</span>
        <span className="text-foreground ml-auto flex shrink-0 items-center gap-1">
          <Check className="h-3.5 w-3.5" strokeWidth={2} />
          Copié
        </span>
      </span>
      <span className="flex items-center">
        {['M', 'T', 'J'].map((initial, i) => (
          <span
            key={initial}
            className={cn(
              'border-background bg-secondary text-foreground flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold',
              i > 0 && '-ml-2',
            )}
          >
            {initial}
          </span>
        ))}
        <span className="text-label text-muted-foreground ml-2.5">3 collaborateurs</span>
      </span>
    </div>
  );
}

const STEPS = [
  { key: 'step1', Visual: StepVisualCreate, logos: [] },
  {
    key: 'step2',
    Visual: StepVisualAdd,
    logos: [
      '/watchProvider/netflix2.svg',
      '/watchProvider/primeVideo.svg',
      '/watchProvider/disneyplus.svg',
    ],
  },
  { key: 'step3', Visual: StepVisualShare, logos: [] },
] as const;

/* ─────────────────────── Version A — Poplist ─────────────────────── */

/** Alternative conservée : réactiver son entrée dans VERSIONS pour comparer. */
// @ts-expect-error -- volontairement non monté, cf. VERSIONS plus bas.
function StepsPoplist({ content }: { content: Content }) {
  return (
    <>
      <SectionHeading>{content.landing.startInSeconds.title}</SectionHeading>

      <ol className="mt-12 grid gap-10 min-[750px]:grid-cols-3 min-[750px]:gap-6 max-[749px]:mt-8">
        {STEPS.map(({ key, Visual }) => {
          const step = content.landing.startInSeconds[key];
          return (
            <li key={key} className="relative">
              {/* La ligne lumineuse top, transposée du template en sobre */}
              <div
                aria-hidden
                className="pointer-events-none absolute top-0 left-1/2 h-px w-[150px] max-w-full -translate-x-1/2 -translate-y-1/2"
                style={{
                  // Papier (couleur système) en alpha : reste dans la palette.
                  background:
                    'linear-gradient(90deg, transparent 0%, hsl(210 25% 96% / 0.4) 50%, transparent 100%)',
                }}
              />
              <div
                aria-hidden
                className="border-border bg-card h-[190px] overflow-hidden rounded-lg border"
              >
                <Visual />
              </div>
              <div className="mt-5 px-2">
                <h3 className="text-title text-foreground">{step.title}</h3>
                <p className="text-body text-copy mt-1.5 max-w-[46ch] pr-5">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}

/* ─────────────────────── Version B — Template ─────────────────────── */

function StepsTemplate({ content }: { content: Content }) {
  return (
    <>
      <SectionHeading>{content.landing.startInSeconds.title}</SectionHeading>
      {/* Rôles du système plutôt qu'un hex en dur et une taille hors ramp :
          cette description, celle de la FAQ et les réponses partagent
          désormais exactement le même traitement. */}
      <p className="text-body text-copy mt-3 mb-8 max-w-2xl md:mb-12">
        {content.landing.startInSeconds.subtitle}
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {STEPS.map(({ key, Visual, logos }) => {
          const step = content.landing.startInSeconds[key];
          return (
            <div
              key={key}
              className="border-border relative flex flex-col rounded-3xl border border-b-0"
            >
              {/* Glow line top du template */}
              <div
                aria-hidden
                className="pointer-events-none absolute top-0 left-1/2 h-px w-[150px] max-w-full -translate-x-1/2 -translate-y-1/2"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, hsl(210 25% 96% / 0.4) 50%, transparent 100%)',
                }}
              />
              {/* Fondu du cadre vers le fond (le « border-b-0 » du template) */}
              {/* Le voile qui efface le cadre vers le bas : la bordure doit
                  disparaître AVANT le bas de la carte (valeurs du template). */}
              <div
                aria-hidden
                className="pointer-events-none absolute -top-0.5 -left-0.5 h-[calc(100%+4px)] w-[calc(100%+4px)]"
                style={{
                  background:
                    'linear-gradient(transparent 0%, var(--color-background) 60%, var(--color-background) 100%)',
                  borderRadius: '24px',
                }}
              />

              {/* Même gabarit que la version Poplist (190px), contenu près du
                  bord, et le visuel est posé DIRECTEMENT dans la carte — pas
                  de sous-carte bordée. */}
              <div aria-hidden className="relative z-10 h-[190px] overflow-hidden rounded-t-3xl px-2 pt-2">
                {/* Fondu du bas du visuel vers la carte. Réduit de 96 à 32px :
                    au-delà il mordait sur le bouton « Créer » et le grisait. */}
                <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 z-20 h-8 bg-linear-to-t to-transparent" />
                <Visual />
              </div>

              {/* pt-4 : +15% d'air entre le visuel et le titre. */}
              <div className="z-10 flex flex-col gap-2.5 px-6 pt-4 pb-7">
                <h3 className="text-title text-foreground font-normal">{step.title}</h3>
                <p className="text-body text-copy">{step.description}</p>
                {logos.length > 0 ? (
                  <div className="mt-1.5 flex items-center gap-3">
                    {logos.map((logo) => (
                      <Image
                        key={logo}
                        src={logo}
                        alt=""
                        width={24}
                        height={24}
                        className="h-6 w-6 object-contain"
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ─────────────────────────── Le sélecteur ─────────────────────────── */

/**
 * « Template » est la version retenue. `StepsPoplist` est conservé (il reste
 * une alternative documentée), mais le sélecteur est masqué : remettre les
 * deux entrées dans VERSIONS le fait réapparaître automatiquement.
 */
const VERSIONS = [
  { id: 'template', label: 'Template', Component: StepsTemplate },
  // { id: 'poplist', label: 'Poplist', Component: StepsPoplist },
] as const;

type VersionId = (typeof VERSIONS)[number]['id'];

export function StepsShowcase({ content }: { content: Content }) {
  const [active, setActive] = useState<VersionId>('template');
  const Current = VERSIONS.find((version) => version.id === active)?.Component ?? StepsTemplate;

  return (
    <section className="py-24 max-[749px]:py-14">
      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-8 max-[749px]:px-4">
        {VERSIONS.length > 1 ? (
          <div
            className="border-border bg-card/90 rounded-control absolute -top-10 right-6 z-40 flex gap-0.5 border p-1 backdrop-blur-sm lg:right-8 max-[749px]:right-4"
            role="group"
            aria-label="Version des étapes"
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
