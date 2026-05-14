import { Link as TSLink } from '@tanstack/react-router';
import type { ComponentProps } from 'react';

/**
 * Wrapper temporaire qui mime l'API de `next/link` (`href`) tout en utilisant
 * le `<Link>` de TanStack Router en interne.
 *
 * Pourquoi : TanStack Router type strictement la prop `to` via le routeTree
 * généré. Pendant la migration progressive (toutes les routes ne sont pas
 * encore définies), ce typing strict génère trop d'erreurs. Ce wrapper accepte
 * un `string` libre et cast en interne avec `as never`.
 *
 * À retirer une fois la migration des routes terminée — remplacer chaque
 * import par `import { Link } from '@tanstack/react-router'` et le compiler
 * fera respecter le typing strict des routes.
 */
type LinkProps = Omit<ComponentProps<typeof TSLink>, 'to'> & {
  to: string;
};

export function Link({ to, ...rest }: LinkProps) {
  return <TSLink to={to as never} {...rest} />;
}
