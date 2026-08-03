import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge ne connaît que l'échelle de tailles par défaut (`text-sm`,
 * `text-lg`, …). Nos rôles typographiques custom (`--text-display`,
 * `--text-headline`, … déclarés dans `styles.css`) seraient sinon classés
 * comme des couleurs de texte : `cn('text-title', 'text-foreground')`
 * supprimerait `text-title`.
 *
 * On déclare donc les 5 rôles dans le groupe `font-size`. Cf. DESIGN.md
 * § Typography — toute nouvelle taille doit être ajoutée ici aussi.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display', 'headline', 'section', 'title', 'body', 'label'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
