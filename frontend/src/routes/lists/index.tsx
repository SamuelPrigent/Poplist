import { createFileRoute } from '@tanstack/react-router';
import ListsContent from '@/app/lists/ListsContent';
import { watchlistsQueries } from '@/api/queries';
import { getAuthStatus } from '@/server/auth';

export const Route = createFileRoute('/lists/')({
  // Lit le cookie d'auth côté serveur pour décider si on doit aussi prefetch
  // `mine` (route mixed : accessible auth et anon).
  beforeLoad: async () => {
    const { isAuthenticated } = await getAuthStatus();
    return { isAuthenticated };
  },
  loader: ({ context: { queryClient, isAuthenticated } }) => {
    // Prefetch non-bloquant : watchlists publiques (toujours) + mes
    // watchlists (si auth) pour les badges saved/collab.
    queryClient.prefetchQuery(watchlistsQueries.publicFeatured(1000));
    if (isAuthenticated) {
      queryClient.prefetchQuery(watchlistsQueries.mine());
    }
  },
  head: () => ({
    meta: [
      { title: 'Listes | Poplist' },
      {
        name: 'description',
        content: 'Découvrez les listes de films et séries partagées par la communauté.',
      },
    ],
  }),
  component: ListsContent,
});
