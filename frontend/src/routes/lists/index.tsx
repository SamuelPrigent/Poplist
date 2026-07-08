import { createFileRoute } from '@tanstack/react-router';
import ListsContent from '@/app/lists/ListsContent';
import { watchlistsQueries } from '@/api/queries';
import { getAuthStatusFast } from '@/lib/auth-status';
import { getMineForSSR } from '@/server/watchlists';

export const Route = createFileRoute('/lists/')({
  beforeLoad: async () => {
    const { isAuthenticated } = await getAuthStatusFast();
    return { isAuthenticated };
  },
  loader: async ({ context: { queryClient, isAuthenticated } }) => {
    // Watchlists publiques (toujours) + mes watchlists (si auth) pour les
    // badges saved/collab. Await pour garantir un dehydrate cohérent.
    const tasks: Promise<unknown>[] = [
      queryClient.ensureQueryData(watchlistsQueries.publicFeatured(1000)),
    ];

    if (isAuthenticated) {
      tasks.push(
        getMineForSSR().then((mine) => {
          if (mine) queryClient.setQueryData(watchlistsQueries.mine().queryKey, mine);
        })
      );
    }

    await Promise.all(tasks);
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
