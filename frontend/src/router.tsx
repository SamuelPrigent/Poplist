import { dehydrate, hydrate, QueryClientProvider } from '@tanstack/react-query';
import { createRouter as createTanStackRouter, Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { getQueryClient } from '@/lib/query-client';
import { CardGridPending } from '@/components/skeletons/RoutePending';
import { routeTree } from './routeTree.gen';

function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-foreground mb-3 text-3xl font-bold">404</h1>
      <p className="text-muted-foreground mb-6">
        Cette page n'existe pas ou a été déplacée.
      </p>
      <Link
        to="/"
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium transition-colors"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}

// Parse/stringify des search params via URLSearchParams (au lieu du défaut
// TanStack qui passe par JSON.stringify, ce qui produit `?page="2"` avec des
// guillemets autour des strings au lieu de `?page=2` propre).
//
// Avec ce parseur, tous les `useSearch()` retournent des `Record<string, string>`,
// les consumers doivent caster eux-mêmes en number/boolean si besoin.
function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  const str = params.toString();
  return str ? `?${str}` : '';
}

function parseSearch(searchStr: string): Record<string, string> {
  const params = new URLSearchParams(searchStr);
  const obj: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    obj[key] = value;
  }
  return obj;
}

export function getRouter() {
  const queryClient = getQueryClient();
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 30_000,
    // Réseau lent : si un loader n'a pas résolu après 100 ms de navigation,
    // on bascule sur le skeleton de la route (pendingComponent) au lieu de
    // rester figé sur l'ancienne page. `pendingMinMs` évite le flash : une
    // fois affiché, le skeleton reste au moins 300 ms. Sur bonne connexion /
    // cache hit (preload), le seuil de 100 ms n'est jamais atteint → ressenti
    // instantané inchangé.
    defaultPendingMs: 100,
    defaultPendingMinMs: 300,
    defaultPendingComponent: CardGridPending,
    defaultNotFoundComponent: NotFoundPage,
    context: { queryClient },
    parseSearch,
    stringifySearch,
    // Wrap garantit qu'on partage le MÊME QueryClient entre le loader (qui
    // tourne via le router context) et le React tree (qui rend via le
    // Provider). Sans ça, le loader set des data dans une instance et le
    // composant lit une autre instance vide.
    Wrap: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    // dehydrate/hydrate : sérialise le state du QueryClient côté serveur,
    // restore côté client. Sans ça, le loader SSR fait setQueryData() dans
    // un cache qui n'arrive pas au client, donc useQuery renvoie isPending
    // sur le first paint client alors que le SSR renvoyait les données
    // résolues → hydration mismatch React #418.
    // Le typage strict de TanStack Router sur la sérialisabilité refuse
    // `DehydratedState` à cause de ses `unknown` internes. On force le type
    // avec `as never` — runtime la serialisation marche (TQ génère du JSON
    // valide), c'est juste le checker statique qui rejette.
    dehydrate: () =>
      ({
        queryClientState: dehydrate(queryClient),
      }) as never,
    hydrate: (dehydrated: { queryClientState: ReturnType<typeof dehydrate> }) => {
      hydrate(queryClient, dehydrated.queryClientState);
    },
  });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
