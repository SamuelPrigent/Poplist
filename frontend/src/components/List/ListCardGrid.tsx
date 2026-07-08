import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Grille responsive canonique pour les listes de `ListCard` (mes listes,
 * communauté, profil user, catégorie…). Centralise les breakpoints de colonnes
 * pour ne plus recopier la longue chaîne de classes sur chaque page.
 *
 * Colonnes : 2 (<350px) → 3 (mobile) → 3 (sm) → 4 (md) → 5 (lg) → 6 (xl).
 * Gap par défaut : 8px (16px vertical sur mobile). Surchargeable via
 * `className` — `cn`/twMerge résout le conflit en faveur de la surcharge
 * (utile pour un gap spécifique ou un modificateur type
 * `max-[749px]:[&>*:nth-child(n+7)]:hidden`).
 */
export function ListCardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-[repeat(auto-fill,minmax(85px,1fr))] gap-2 max-[749px]:grid-cols-3 max-[749px]:gap-y-4 max-[349px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
        className,
      )}
    >
      {children}
    </div>
  );
}
