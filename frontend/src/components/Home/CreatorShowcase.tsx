'use client';

import { useState } from 'react';
import { User } from 'lucide-react';
import { Img as Image } from '@/components/ui/Img';
import { Link } from '@/components/ui/Link';
import { UserCard } from '@/components/User/UserCard';
import { cn } from '@/lib/cn';
import { getTMDBImageUrl } from '@/lib/utils';
import { CREATOR_CELL, CreatorTasteCard } from '@/components/User/CreatorTasteCard';

export interface CreatorTile {
  id: string;
  username: string;
  avatarUrl?: string;
  listCount: number;
  /** Affiches tirées de ses listes publiques : ce qu'il curate, pas juste son nom. */
  posters: string[];
}

type CreatorContent = { userProfile: { watchlist: string; watchlists: string } };

interface VariantProps {
  creators: CreatorTile[];
  content: CreatorContent;
}

const countOf = (creator: CreatorTile, content: CreatorContent) =>
  `${creator.listCount} ${
    creator.listCount === 1 ? content.userProfile.watchlist : content.userProfile.watchlists
  }`;

const hrefOf = (creator: CreatorTile) => `/user/${creator.username}`;

/** Carrousel compact commun : sous 750px tout défile horizontalement. */
const RAIL =
  'max-[749px]:-mx-4 max-[749px]:flex max-[749px]:gap-2 max-[749px]:overflow-x-auto ' +
  'max-[749px]:px-4 max-[749px]:pb-1 max-[749px]:[&::-webkit-scrollbar]:hidden ' +
  'max-[749px]:[scrollbar-width:none] max-[749px]:[&>*]:shrink-0';

function Avatar({ creator, className }: { creator: CreatorTile; className?: string }) {
  return (
    <div className={cn('bg-secondary relative shrink-0 overflow-hidden rounded-full', className)}>
      {creator.avatarUrl ? (
        <Image src={creator.avatarUrl} alt="" fill sizes="96px" className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <User className="text-muted-foreground h-1/2 w-1/2" strokeWidth={1.5} />
        </div>
      )}
    </div>
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

// ───────────────────────── Base (inchangée) ─────────────────────────

/** Rendu actuel de la section, tel quel : `UserCard` en mode carrousel. */
function CreatorsBase({ creators, content }: VariantProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap justify-start gap-x-6 gap-y-4 min-[750px]:[&>*]:w-[104px]',
        RAIL,
        'max-[749px]:flex-nowrap max-[749px]:[&>*]:w-[92px]',
      )}
    >
      {creators.map((creator) => (
        <UserCard
          key={creator.id}
          user={creator}
          listCount={creator.listCount}
          content={content}
          carousel
        />
      ))}
    </div>
  );
}

// ───────────────────────────── Fond ─────────────────────────────

/** Ce qu'il curate devient le fond de sa carte. */
function CreatorsBackdrop({ creators, content }: VariantProps) {
  return (
    <div className={cn('grid grid-cols-4 gap-3 max-[1099px]:grid-cols-2', RAIL)}>
      {creators.slice(0, 8).map((creator) => (
        <Link
          key={creator.id}
          to={hrefOf(creator)}
          className="group border-border rounded-card relative block overflow-hidden border max-[749px]:w-[220px]"
        >
          <div className="absolute inset-0 flex opacity-45 transition-opacity duration-300 group-hover:opacity-70">
            {creator.posters.slice(0, 4).map((path, i) => (
              <span key={`${path}-${i}`} className="block h-full flex-1 overflow-hidden">
                <Poster path={path} />
              </span>
            ))}
          </div>
          <div className="from-background via-background/80 absolute inset-0 bg-linear-to-r to-transparent" />
          <div className="relative flex items-center gap-3 p-4">
            <Avatar creator={creator} className="h-12 w-12" />
            <span className="flex min-w-0 flex-col">
              <span className="text-title text-foreground truncate">{creator.username}</span>
              <span className="text-label text-muted-foreground">{countOf(creator, content)}</span>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─────────────────────── Famille « Goût » ───────────────────────
// Une seule coquille, deux façons d'afficher les affiches. Le reste de la
// cellule ne bouge jamais : zone d'images de 64px de haut, puis l'avatar,
// le nom et le comptage. Seul l'espacement des affiches change, ce qui rend
// les deux versions directement comparables.

/** Largeur de cellule commune : ~7 créateurs par ligne en confortable. */
const TASTE_WRAP = 'flex flex-wrap gap-x-6 gap-y-6';
const TASTE_CELL = 'w-[132px] max-[749px]:w-[120px]';

type TasteImagery = 'eventail' | 'alignees';

/**
 * Les deux traitements partagent les mêmes affiches : seul l'espacement
 * diffère. Posées côte à côte, ou chevauchées et qui s'ouvrent au survol.
 */
function TasteImages({ creator, imagery }: { creator: CreatorTile; imagery: TasteImagery }) {
  return (
    <span
      className={cn(
        'flex h-full',
        imagery === 'alignees'
          ? 'gap-1'
          : '[&>*:not(:first-child)]:-ml-7 group-hover:[&>*:not(:first-child)]:-ml-5 [&>*]:transition-[margin] [&>*]:duration-300',
      )}
    >
      {creator.posters.slice(0, 3).map((path, i) => (
        <span
          key={`${path}-${i}`}
          className="rounded-poster border-border block h-full w-10 shrink-0 overflow-hidden border"
        >
          <Poster path={path} />
        </span>
      ))}
    </span>
  );
}

/**
 * Version retenue. Elle délègue à `CreatorTasteCard`, partagée avec la page
 * /users : les deux endroits doivent rester rigoureusement identiques.
 */
function CreatorsTasteFan({ creators, content }: VariantProps) {
  return (
    <>
      {/* Desktop : la carte « Goût », l'éventail d'affiches. */}
      <div className={cn(TASTE_WRAP, 'max-[749px]:hidden')}>
        {creators.map((creator) => (
          <CreatorTasteCard
            key={creator.id}
            creator={creator}
            content={content}
            className={CREATOR_CELL}
          />
        ))}
      </div>

      {/* Mobile : le rail d'avatars ronds, tel qu'il était en production.
          L'éventail d'affiches passe mal en colonne étroite. */}
      <div
        className={cn(
          'hidden max-[749px]:flex max-[749px]:flex-nowrap max-[749px]:[&>*]:w-[92px]',
          RAIL,
        )}
      >
        {creators.map((creator) => (
          <UserCard
            key={creator.id}
            user={creator}
            listCount={creator.listCount}
            content={content}
            carousel
          />
        ))}
      </div>
    </>
  );
}

const tasteList = (imagery: TasteImagery) =>
  function TasteList({ creators, content }: VariantProps) {
    return (
      <div className={cn(TASTE_WRAP, RAIL)}>
        {creators.map((creator) => (
          <Link
            key={creator.id}
            to={hrefOf(creator)}
            className={cn('group flex min-w-0 flex-col gap-2.5', TASTE_CELL)}
          >
            <span className="flex h-16 items-start">
              <TasteImages creator={creator} imagery={imagery} />
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <Avatar creator={creator} className="h-7 w-7" />
              <span className="flex min-w-0 flex-col">
                <span className="text-label text-foreground truncate">{creator.username}</span>
                <span className="text-label text-muted-foreground truncate">
                  {countOf(creator, content)}
                </span>
              </span>
            </span>
          </Link>
        ))}
      </div>
    );
  };

// ───────────────────────────── Switcher ─────────────────────────────

const VERSIONS = [
  { id: 'eventail', label: 'Éventail', Component: CreatorsTasteFan },
  { id: 'fond', label: 'Fond', Component: CreatorsBackdrop },
  { id: 'alignees', label: 'Alignées', Component: tasteList('alignees') },
  { id: 'base', label: 'Base', Component: CreatorsBase },
] as const;

type VersionId = (typeof VERSIONS)[number]['id'];

const PILL =
  'text-label rounded-md px-2.5 py-1 transition-colors duration-150 ease-out ' +
  'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2';
const PILL_ON = 'bg-secondary text-foreground';
const PILL_OFF = 'text-muted-foreground hover:text-foreground cursor-pointer';
const GROUP = 'border-border bg-card/90 rounded-control flex gap-0.5 border p-1 backdrop-blur-sm';

/**
 * Version retenue : « Éventail ». Le sélecteur est masqué, mais rien n'est
 * supprimé — Fond, Alignées et Base vivent toujours dans ce fichier. Repasser
 * `SHOW_PICKER` à `true` fait réapparaître la barre pour les recomparer.
 */
const SHOW_PICKER = false;

/**
 * Banc d'essai des cartes créateur. « Base » est le rendu actuel, intact et
 * actif par défaut ; les trois autres montrent ce que la personne curate
 * plutôt qu'un simple nom suivi d'un nombre.
 *
 * État local en `useState`, donc SSR-safe.
 */
export function CreatorShowcase({ creators, content }: VariantProps) {
  const [active, setActive] = useState<VersionId>('eventail');
  const Current = VERSIONS.find((v) => v.id === active)?.Component ?? VERSIONS[0].Component;

  return (
    <div className="relative">
      {SHOW_PICKER && (
        <div className="mb-4 flex justify-end">
          <div className={cn(GROUP, 'flex-wrap')} role="group" aria-label="Version des créateurs">
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
                  <span className="max-[1200px]:hidden">{version.label}</span>
                  <span className="hidden max-[1200px]:inline">{index + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Current creators={creators} content={content} />
    </div>
  );
}
