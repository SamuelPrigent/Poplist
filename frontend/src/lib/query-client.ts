import { QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 1,
      },
      dehydrate: {
        // SSR: par défaut TanStack Query ne déshydrate que les queries
        // 'success'. Pour les loaders qui prefetch puis Suspense côté
        // client, on déshydrate aussi les queries 'pending' (avec leur
        // promise) pour éviter un waterfall.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  });
}

let browserClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // SSR: nouvelle instance par requête pour isoler les caches inter-utilisateurs.
    return makeQueryClient();
  }
  if (!browserClient) {
    browserClient = makeQueryClient();
  }
  return browserClient;
}
