import { useLocation } from '@tanstack/react-router';
import { useMemo } from 'react';

/**
 * Wrapper temporaire qui mime l'API `useSearchParams` de `next/navigation`
 * (qui retourne un `URLSearchParams`-like avec `.get(key)` et `.toString()`).
 *
 * Implémenté en lecture-seule. Pour mettre à jour les search params, utiliser
 * `navigate({ to: path, search: { ... } })` du `useNavigate` TanStack.
 *
 * Stabilité de référence : on dérive de `location.searchStr` (primitive string)
 * que TanStack Router garde stable tant que l'URL ne change pas. Le `useMemo`
 * ne re-construit donc l'URLSearchParams que sur un vrai changement d'URL.
 * Indispensable pour éviter que les useEffect/useMemo des consumers refire en
 * boucle (re-render loop si l'instance instable est dans leurs deps).
 *
 * À retirer une fois les routes typées propres : remplacer chaque usage par
 * `Route.useSearch()` (typé par route) ou `useSearch({ strict: false })`.
 */
export function useSearchParamsCompat(): URLSearchParams {
  const searchStr = useLocation({ select: (l) => l.searchStr });
  return useMemo(() => new URLSearchParams(searchStr ?? ''), [searchStr]);
}
