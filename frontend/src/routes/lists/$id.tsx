import { createFileRoute } from '@tanstack/react-router';
import ListDetailPage from '@/app/lists/[id]/page';
import { watchlistsQueries } from '@/api/queries';
import { getAuthStatus } from '@/server/auth';
import { getAuthWatchlistForMeta, getPublicWatchlistForMeta } from '@/server/watchlists';

export const Route = createFileRoute('/lists/$id')({
  // `beforeLoad` lit le cookie d'auth côté serveur (server fn) pour déterminer
  // `isAuthenticated` de manière déterministe SSR + client (même cookie, même
  // valeur). On évite la divergence localStorage qu'on avait avec `useAuth()`.
  beforeLoad: async () => {
    const { isAuthenticated } = await getAuthStatus();
    return { isAuthenticated };
  },
  loader: async ({ params, context: { queryClient, isAuthenticated } }) => {
    // Une seule query selon l'auth state → pas de 2e render quand l'autre
    // query résout. Le composant lit la même via `useQuery` depuis le cache.
    if (isAuthenticated) {
      const result = await getAuthWatchlistForMeta({ data: { id: params.id } });
      const fallback = result ?? (await getPublicWatchlistForMeta({ data: { id: params.id } }));
      if (fallback) {
        // Si l'auth fetch a réussi, on hydrate la `byId` query (avec flags).
        // Sinon (auth invalide ou non-owner sur liste publique), on hydrate
        // la `publicById` pour ne pas perdre l'affichage.
        if (result) {
          queryClient.setQueryData(
            watchlistsQueries.byId(params.id).queryKey,
            result
          );
        } else {
          queryClient.setQueryData(
            watchlistsQueries.publicById(params.id).queryKey,
            fallback
          );
        }
      }
      return fallback;
    }
    // Non-auth : seulement la public query
    const result = await getPublicWatchlistForMeta({ data: { id: params.id } });
    if (result) {
      queryClient.setQueryData(
        watchlistsQueries.publicById(params.id).queryKey,
        result
      );
    }
    return result;
  },
  head: ({ loaderData }) => {
    // loaderData peut être un GetWatchlistByIdResponse (auth) OU un
    // GetPublicWatchlistResponse (public), les deux ont `.watchlist`.
    const watchlist = (loaderData as { watchlist?: { name?: string; description?: string | null; thumbnailUrl?: string | null } } | null)?.watchlist;
    const title = watchlist?.name ? `${watchlist.name} | Poplist` : 'Watchlist | Poplist';
    const description = watchlist?.description ?? 'Watchlist Poplist';
    const ogImage = watchlist?.thumbnailUrl ?? '/preview/watchlists1.webp';

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: watchlist?.name ?? 'Poplist' },
        { property: 'og:description', content: description },
        { property: 'og:image', content: ogImage },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: watchlist?.name ?? 'Poplist' },
        { name: 'twitter:image', content: ogImage },
      ],
    };
  },
  component: ListDetailPage,
});
