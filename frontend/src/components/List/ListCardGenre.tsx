'use client';

import { motion } from 'motion/react';
import { Link } from '@/components/ui/Link';
import { cn } from '@/lib/cn';
import type { CSSProperties } from 'react';
import type { Watchlist } from '@/api';
import type { Content } from '@/types/content';

interface ListCardGenreProps {
  watchlist: Watchlist;
  content: Content;
  href: string;
  genreId?: string;
  showOwner?: boolean;
  index?: number;
  /** Label court pour mobile (< 750px). Absent → fallback sur le nom normal. */
  titleMobile?: string;
  /** Garde l'aspect quasi carré du desktop aussi sur mobile (carrousel home).
      Par défaut mobile = portrait 4/5 (page /categories). */
  desktopAspectOnMobile?: boolean;
  /** Nombre de listes du badge. `'pending'` = donnée pas encore chargée →
      badge masqué (la card, entièrement statique, s'affiche quand même).
      Absent → fallback sur watchlist.items.length (compat /categories). */
  itemCount?: number | 'pending';
}

interface CategoryVisuals {
  cutout: string;
}

// Illustration de catégorie. La couleur vient de l'illustration elle-même :
// la tuile, comme tout le mobilier du système, reste sur `surface` + filet
// (cf. DESIGN.md § « The One Room Rule » et « The Flat Interface Rule »).
export const CATEGORY_VISUALS: Record<string, CategoryVisuals> = {
  movies: { cutout: '/categories/avatar.webp' },
  series: { cutout: '/categories/friends.webp' },
  animation: { cutout: '/categories/spider.webp' },
  enfant: { cutout: '/categories/yeti.webp' },
  jeunesse: { cutout: '/categories/brian.webp' },
  documentaries: { cutout: '/categories/perroquet.webp' },
  anime: { cutout: '/categories/solo.webp' },
  action: { cutout: '/categories/action.webp' },
};

const DEFAULT_VISUALS: CategoryVisuals = CATEGORY_VISUALS.movies;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ListCardGenre({
  watchlist,
  content,
  href,
  genreId,
  titleMobile,
  desktopAspectOnMobile = false,
  index: _index = 0,
  itemCount: itemCountProp,
}: ListCardGenreProps) {
  const visuals = (genreId && CATEGORY_VISUALS[genreId]) || DEFAULT_VISUALS;
  // Prop explicite prioritaire ('pending' = chargement → badge masqué) ;
  // fallback sur items.length pour les usages sans prop (/categories).
  const itemCount = itemCountProp ?? watchlist.items.length;
  // Les originaux font jusqu'à 1920px de large pour un rendu à ~150px : on sert
  // les variantes 320/640 générées à côté (`<nom>-320.webp`, `<nom>-640.webp`).
  const cutoutBase = visuals.cutout.replace(/\.webp$/, '');

  const cutoutStyle: CSSProperties = {
    height: '100%',
    width: 'auto',
    objectFit: 'contain',
    objectPosition: 'center bottom',
    // Décalé de 3px vers le bas : l'overflow-hidden du conteneur clippe le bas
    // et évite la ligne/pixel transparent visible à certaines largeurs.
    transform: 'translateY(3px)',
  };

  return (
    <Link to={href} className="group block cursor-pointer">
      {/* `initial={false}` : pas de fade-in au montage. Avec initial opacity 0,
          le SSR rendait la card invisible jusqu'à l'hydratation (JS différé) —
          les cards catégories restaient blanches pendant que les skeletons des
          autres sections s'affichaient. La card est 100 % statique (surface,
          cutout, titre) : elle doit se peindre dès le premier paint SSR. */}
      <motion.div
        initial={false}
        className={cn(
          'bg-card border-border relative aspect-[21/20] w-full overflow-hidden rounded-card border',
          'transition-colors duration-200 group-hover:bg-secondary',
          !desktopAspectOnMobile && 'max-[749px]:aspect-[4/4.1]',
        )}
      >
        {/* Illustration, centrée en bas */}
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 flex h-[85%] items-end justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${cutoutBase}-320.webp`}
            srcSet={`${cutoutBase}-320.webp 320w, ${cutoutBase}-640.webp 640w`}
            sizes="(max-width: 749px) 128px, 200px"
            alt=""
            width={320}
            height={320}
            loading="lazy"
            decoding="async"
            style={cutoutStyle}
          />
        </div>

        {/* Voile de lisibilité, tiré du fond de carte (pas du noir) : le titre
            reste lisible quand l'illustration remonte derrière lui. */}
        <div className="from-card via-card/70 pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t to-transparent" />

        {/* Titre + comptage, en bas à gauche. Le comptage n'apparaît qu'une
            fois chargé ('pending' = masqué), pour éviter un « 0 listes »
            mensonger pendant le chargement. */}
        <div className="absolute inset-0 flex flex-col justify-end gap-0.5 px-4 pt-4 pb-4 max-[749px]:px-2.5 max-[749px]:pt-2.5 max-[749px]:pb-3">
          <h3 className="text-title text-foreground m-0">
            <span className="max-[749px]:hidden">{watchlist.name}</span>
            <span className="hidden max-[749px]:inline">{titleMobile ?? watchlist.name}</span>
          </h3>
          {itemCount !== 'pending' && (
            <p className="text-label text-muted-foreground m-0">
              {itemCount}{' '}
              {itemCount === 1 ? content.home.categories.list : content.home.categories.lists}
            </p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
