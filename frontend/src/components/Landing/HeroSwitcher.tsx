'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { Content } from '@/types/content';
import { HeroPosterField } from './hero/HeroPosterField';
import {
  HERO_COPY_CARDS,
  HERO_COPY_REFERENCES,
  HERO_COPY_TEXTS,
  type HeroCopyVariant,
} from './hero/HeroCopy';
// Version « Produit » écartée (le mur d'affiches est retenu). Le composant
// reste dans hero/HeroProduct.tsx — décommenter l'import et l'entrée dans
// VERSIONS pour la comparer à nouveau.
// import { HeroProduct } from './hero/HeroProduct';

interface HeroSwitcherProps {
  content: Content;
  ctaUrl: string;
}

/**
 * Hero retenu : composition « Affiches » (le mur raffiné) + colonne texte
 * « Plateformes ». Tous les sélecteurs sont masqués.
 *
 * Rien n'est supprimé : les 4 traitements de carte et les 10 traitements de
 * texte vivent toujours dans `HeroCopy`. Repasser `SHOW_PICKERS` à `true`
 * fait réapparaître les trois barres pour recomparer.
 *
 * État en `useState` (pas de `localStorage`) : SSR-safe, aucune divergence
 * d'hydratation possible.
 */
const SHOW_PICKERS = false;

const VERSIONS = [
  { id: 'posters', label: 'Affiches', Component: HeroPosterField },
  // { id: 'product', label: 'Produit', Component: HeroProduct },
] as const;

type VersionId = (typeof VERSIONS)[number]['id'];

const PILL =
  'text-label rounded-md px-2.5 py-1 transition-colors duration-150 ease-out ' +
  'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2';
const PILL_ON = 'bg-secondary text-foreground';
const PILL_OFF = 'text-muted-foreground hover:text-foreground cursor-pointer';
const GROUP =
  'border-border bg-card/90 rounded-control flex gap-0.5 border p-1 backdrop-blur-sm';

export function HeroSwitcher({ content, ctaUrl }: HeroSwitcherProps) {
  const [active, setActive] = useState<VersionId>('posters');
  const [copyVariant, setCopyVariant] = useState<HeroCopyVariant>('plateformes');
  const Current = VERSIONS.find((version) => version.id === active)?.Component ?? HeroPosterField;

  return (
    <div className="relative">
      <Current content={content} ctaUrl={ctaUrl} copyVariant={copyVariant} />

      {SHOW_PICKERS ? (
      <div className="absolute top-5 right-5 z-40 flex flex-col items-end gap-2 max-[749px]:top-3 max-[749px]:right-3">
        {VERSIONS.length > 1 ? (
          <div className={GROUP} role="group" aria-label="Version du hero">
            {VERSIONS.map((version, index) => {
              const isActive = version.id === active;
              return (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => setActive(version.id)}
                  aria-pressed={isActive}
                  className={cn(PILL, isActive ? PILL_ON : PILL_OFF)}
                >
                  <span className="max-[749px]:hidden">{version.label}</span>
                  <span className="hidden max-[749px]:inline">{index + 1}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Deux groupes : les références conservées, puis les 6 cartes. */}
        {(
          [
            { key: 'ref', label: 'Références du hero', items: HERO_COPY_REFERENCES, offset: 0 },
            { key: 'card', label: 'Traitement de la carte', items: HERO_COPY_CARDS, offset: 2 },
            { key: 'text', label: 'Traitement du texte', items: HERO_COPY_TEXTS, offset: 6 },
          ] as const
        ).map((group) => (
          <div key={group.key} className={GROUP} role="group" aria-label={group.label}>
            {group.items.map((variant, index) => {
              const isActive = variant.id === copyVariant;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setCopyVariant(variant.id)}
                  aria-pressed={isActive}
                  className={cn(PILL, isActive ? PILL_ON : PILL_OFF)}
                >
                  <span className="max-[1400px]:hidden">{variant.label}</span>
                  <span className="hidden max-[1400px]:inline">{group.offset + index + 1}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      ) : null}
    </div>
  );
}
