import { ArrowRight } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { Link } from '@/components/ui/Link';
import { cn } from '@/lib/cn';

/**
 * Primitives de la landing — cf. `frontend/DESIGN.md`.
 *
 * Règle du système : une seule action primaire par écran de défilement, et
 * l'action secondaire n'a jamais de bordure. Deux boutons bordés côte à côte,
 * c'est deux actions primaires, donc aucune.
 *
 * Ces composants sont volontairement scopés à la landing pour l'instant. Quand
 * les pages produit passeront à leur tour, ils remonteront dans `ui/button`.
 */

type Size = 'md' | 'sm';

const PRIMARY_BASE =
  'inline-flex items-center justify-center gap-2 rounded-control bg-primary text-label ' +
  'text-background whitespace-nowrap transition-colors duration-150 ease-out ' +
  'hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-primary';

const GHOST_BASE =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-control ' +
  'text-label text-muted-foreground transition-colors duration-150 ease-out ' +
  'hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-primary';

const SIZES: Record<Size, string> = {
  md: 'h-11 px-5',
  sm: 'h-10 px-4',
};

const GHOST_SIZES: Record<Size, string> = {
  md: 'h-11 px-3',
  sm: 'h-10 px-2',
};

/** Flèche fine. Seule décoration autorisée sur un bouton. */
function Arrow() {
  return <ArrowRight strokeWidth={1.5} className="h-4 w-4" aria-hidden />;
}

export function CtaPrimary({
  to,
  children,
  withArrow = false,
  size = 'md',
  className,
  ...rest
}: {
  to: string;
  children: ReactNode;
  withArrow?: boolean;
  size?: Size;
} & Omit<ComponentProps<typeof Link>, 'to' | 'children'>) {
  return (
    <Link to={to} className={cn(PRIMARY_BASE, SIZES[size], className)} {...rest}>
      {children}
      {withArrow ? <Arrow /> : null}
    </Link>
  );
}

export function CtaGhostLink({
  to,
  children,
  size = 'md',
  className,
  ...rest
}: {
  to: string;
  children: ReactNode;
  size?: Size;
} & Omit<ComponentProps<typeof Link>, 'to' | 'children'>) {
  return (
    <Link to={to} className={cn(GHOST_BASE, GHOST_SIZES[size], className)} {...rest}>
      {children}
    </Link>
  );
}

export function CtaGhostButton({
  children,
  size = 'md',
  className,
  ...rest
}: {
  children: ReactNode;
  size?: Size;
} & ComponentProps<'button'>) {
  return (
    <button type="button" className={cn(GHOST_BASE, GHOST_SIZES[size], className)} {...rest}>
      {children}
    </button>
  );
}

/**
 * Rythme vertical unique de la page : 96px en confortable, 56px en compact.
 * Aucune section ne porte de fond propre (The One Room Rule).
 *
 * Conteneur harmonisé avec le hero : même `max-w-7xl px-6 lg:px-8` que la
 * colonne de texte du hero → le bord gauche des titres de section est aligné
 * au pixel avec le h1. Seul le FOND du hero a le droit d'être plus large.
 */
export function Section({
  children,
  className,
  ...rest
}: ComponentProps<'section'>) {
  return (
    <section className={cn('py-24 max-[749px]:py-14', className)} {...rest}>
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8 max-[749px]:px-4">{children}</div>
    </section>
  );
}

/**
 * En-tête de section — le style « Template » validé puis généralisé :
 * Instrument Sans 400, tracking serré, dégradé vertical blanc → gris
 * (`.effect-font-gradient`), aligné à gauche par défaut.
 */
export function SectionHeading({
  children,
  align = 'start',
  className,
}: {
  children: ReactNode;
  align?: 'start' | 'center';
  className?: string;
}) {
  return (
    <h2
      className={cn(
        'effect-font-gradient font-sans text-section',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </h2>
  );
}
