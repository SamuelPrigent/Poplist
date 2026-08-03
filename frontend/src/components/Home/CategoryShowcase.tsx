'use client';

import { useState } from 'react';
import { Link } from '@/components/ui/Link';
import { cn } from '@/lib/cn';
import { getTMDBImageUrl } from '@/lib/utils';
import { CategoryList, type CategoryTile } from '@/components/List/CategoryList';

export type { CategoryTile };

interface VariantProps {
  tiles: CategoryTile[];
  /** « 3 listes » / « 1 liste » — accordé par l'appelant. */
  countLabel: (count: number) => string;
}

function Cutout({ tile }: { tile: CategoryTile }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${tile.cutout}-320.webp`}
      srcSet={`${tile.cutout}-320.webp 320w, ${tile.cutout}-640.webp 640w`}
      sizes="(max-width: 749px) 128px, 200px"
      alt=""
      width={320}
      height={320}
      loading="lazy"
      decoding="async"
      style={{
        height: '100%',
        width: 'auto',
        objectFit: 'contain',
        objectPosition: 'center bottom',
        transform: 'translateY(3px)',
      }}
    />
  );
}

function Poster({ path, className }: { path: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getTMDBImageUrl(path, 'w185') ?? ''}
      alt=""
      loading="lazy"
      decoding="async"
      className={cn('h-full w-full object-cover', className)}
    />
  );
}

// ───────────────────────────── Filet ─────────────────────────────

/** La carte d'origine : surface + filet 1px, illustration, titre, comptage. */
function FiletGrid({ tiles, countLabel }: VariantProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-[14px] max-[749px]:-mx-4 max-[749px]:flex max-[749px]:gap-3 max-[749px]:overflow-x-auto max-[749px]:px-4 max-[749px]:pb-1 max-[749px]:[&::-webkit-scrollbar]:hidden max-[749px]:[scrollbar-width:none] max-[749px]:[&>*]:w-[128px] max-[749px]:[&>*]:shrink-0 md:grid-cols-4 lg:grid-cols-6">
      {tiles.map((tile) => (
        <Link key={tile.id} to={tile.href} className="group block cursor-pointer">
          <div className="bg-card border-border rounded-card group-hover:bg-secondary relative aspect-[21/20] w-full overflow-hidden border transition-colors duration-200">
            <div className="pointer-events-none absolute right-0 bottom-0 left-0 flex h-[85%] items-end justify-center">
              <Cutout tile={tile} />
            </div>
            <div className="from-card via-card/70 pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end gap-0.5 px-4 pt-4 pb-4 max-[749px]:px-2.5 max-[749px]:pt-2.5 max-[749px]:pb-3">
              <h3 className="text-title text-foreground m-0">
                <span className="max-[749px]:hidden">{tile.name}</span>
                <span className="hidden max-[749px]:inline">{tile.nameMobile ?? tile.name}</span>
              </h3>
              {tile.count !== undefined && (
                <p className="text-label text-muted-foreground m-0">{countLabel(tile.count)}</p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/** Fond : les affiches remplissent la ligne en arrière-plan, révélées au survol. */
function ListBackdrop({ tiles, countLabel }: VariantProps) {
  return (
    <ul className="border-border grid grid-cols-2 gap-x-10 border-t max-[749px]:grid-cols-1">
      {tiles.map((tile) => (
        <li key={tile.id} className="group/row border-border relative overflow-hidden border-b">
          <div className="pointer-events-none absolute inset-y-0 right-0 flex w-2/3 justify-end opacity-35 transition-opacity duration-300 group-hover/row:opacity-60">
            {tile.posters.slice(0, 4).map((path, i) => (
              <span key={`${path}-${i}`} className="block h-full w-24 shrink-0 overflow-hidden">
                <Poster path={path} />
              </span>
            ))}
          </div>
          <div className="from-background via-background/85 pointer-events-none absolute inset-0 bg-linear-to-r to-transparent" />
          <Link to={tile.href} className="relative flex items-center gap-4 py-5">
            <span className="text-title text-foreground min-w-0 flex-1 truncate">{tile.name}</span>
            {tile.count !== undefined && (
              <span className="text-label text-muted-foreground shrink-0 tabular-nums">
                {countLabel(tile.count)}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ──────────────────────────── Rangées ────────────────────────────
// Même squelette pour les quatre, et toutes sur deux colonnes : le nom à
// gauche, le nombre de listes tout à droite en face de lui, un filet de
// séparation, puis les affiches DESSOUS. Seul le traitement des affiches
// change d'une version à l'autre.

type Imagery = 'vignettes' | 'fond';

function StackedRow({
  tile,
  countLabel,
  imagery,
  posterCount,
}: {
  tile: CategoryTile;
  countLabel: (count: number) => string;
  imagery: Imagery;
  posterCount: number;
}) {
  const posters = tile.posters.slice(0, posterCount);

  return (
    <li>
      <Link to={tile.href} className="group/row block py-4">
        {/* Nom à gauche, comptage tout à droite, sur la même ligne de base. */}
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-title text-foreground min-w-0 truncate">{tile.name}</span>
          {tile.count !== undefined && (
            <span className="text-label text-muted-foreground shrink-0 tabular-nums">
              {countLabel(tile.count)}
            </span>
          )}
        </div>

        {/* Le séparateur, puis les affiches dessous. */}
        <div className="border-border mt-3 border-t" />

        {posters.length > 0 && (
          <div className="mt-3 h-16 overflow-hidden">
            {imagery === 'vignettes' ? (
              <div className="flex h-full gap-1.5">
                {posters.map((path, i) => (
                  <span
                    key={`${path}-${i}`}
                    className="rounded-poster block h-full w-11 shrink-0 overflow-hidden opacity-60 transition-opacity duration-200 group-hover/row:opacity-100"
                  >
                    <Poster path={path} />
                  </span>
                ))}
              </div>
            ) : (
              <div className="relative h-full">
                <div className="flex h-full opacity-45 transition-opacity duration-300 group-hover/row:opacity-70">
                  {posters.map((path, i) => (
                    <span
                      key={`${path}-${i}`}
                      className="block h-full w-20 shrink-0 overflow-hidden"
                    >
                      <Poster path={path} />
                    </span>
                  ))}
                </div>
                <div className="from-background pointer-events-none absolute inset-0 bg-linear-to-r via-transparent to-transparent" />
              </div>
            )}
          </div>
        )}
      </Link>
    </li>
  );
}

const stackedList = (imagery: Imagery, posterCount: number) =>
  function StackedList({ tiles, countLabel }: VariantProps) {
    return (
      <ul className="grid grid-cols-2 gap-x-12 max-[749px]:grid-cols-1">
        {tiles.map((tile) => (
          <StackedRow
            key={tile.id}
            tile={tile}
            countLabel={countLabel}
            imagery={imagery}
            posterCount={posterCount}
          />
        ))}
      </ul>
    );
  };

/**
 * Version retenue. Elle délègue à `CategoryList`, partagée avec /categories :
 * les deux endroits doivent rester rigoureusement identiques.
 */
function SharedList({ tiles, countLabel }: VariantProps) {
  return (
    // En compact la home n'en montre que 5 : les 8 mangeaient l'écran, et
    // « Voir tout » est juste au-dessus. La page /categories, elle, les
    // affiche toutes — d'où le plafond ici et pas dans `CategoryList`.
    <CategoryList
      tiles={tiles}
      countLabel={countLabel}
      className="max-[749px]:[&>*:nth-child(n+6)]:hidden"
    />
  );
}

// ───────────────────────────── Switcher ─────────────────────────────

const VERSIONS = [
  { id: 'liste', label: 'Liste', Component: SharedList },
  { id: 'rangee', label: 'Rangée', Component: stackedList('vignettes', 5) },
  { id: 'rangee-fond', label: 'Rangée fond', Component: stackedList('fond', 5) },
  { id: 'fond', label: 'Fond', Component: ListBackdrop },
  { id: 'filet', label: 'Filet', Component: FiletGrid },
] as const;

type VersionId = (typeof VERSIONS)[number]['id'];

const PILL =
  'text-label rounded-md px-2.5 py-1 transition-colors duration-150 ease-out ' +
  'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2';
const PILL_ON = 'bg-secondary text-foreground';
const PILL_OFF = 'text-muted-foreground hover:text-foreground cursor-pointer';
const GROUP = 'border-border bg-card/90 rounded-control flex gap-0.5 border p-1 backdrop-blur-sm';

/**
 * Version retenue : « Liste ». Le sélecteur est masqué, mais rien n'est
 * supprimé — Rangée, Rangée fond, Fond et Filet vivent toujours dans ce
 * fichier. Repasser `SHOW_PICKER` à `true` fait réapparaître la barre.
 */
const SHOW_PICKER = false;

/**
 * Banc d'essai des tuiles « Listes par catégorie ». « Liste » est la version
 * de référence : première du sélecteur et active par défaut.
 *
 * Les quatre « Rangée » partagent un squelette strictement identique — nom à
 * gauche, comptage tout à droite en face, filet de séparation, affiches
 * dessous — et ne diffèrent que par le traitement des affiches et le nombre
 * de colonnes.
 *
 * Même dispositif que le sélecteur du hero de la landing : état local en
 * `useState`, donc SSR-safe, aucune divergence d'hydratation.
 */
export function CategoryShowcase({ tiles, countLabel }: VariantProps) {
  const [active, setActive] = useState<VersionId>('liste');
  const Current = VERSIONS.find((v) => v.id === active)?.Component ?? VERSIONS[0].Component;

  return (
    <div className="relative">
      {/* Barre statique plutôt qu'ancrée en absolu : ancrée en haut à droite,
          elle recouvrait le « Voir tout » de l'en-tête de section. */}
      {SHOW_PICKER && (
        <div className="mb-4 flex justify-end">
          <div className={cn(GROUP, 'flex-wrap')} role="group" aria-label="Version des catégories">
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
                  <span className="max-[1000px]:hidden">{version.label}</span>
                  <span className="hidden max-[1000px]:inline">{index + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Current tiles={tiles} countLabel={countLabel} />
    </div>
  );
}
