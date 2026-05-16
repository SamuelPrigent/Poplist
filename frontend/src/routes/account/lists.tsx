import { createFileRoute, redirect } from '@tanstack/react-router';
import { ListsContent } from '@/app/account/lists/ListsContent';
import { watchlistsQueries } from '@/api/queries';
import { getAuthStatus } from '@/server/auth';
import { getMineForSSR } from '@/server/watchlists';

export const Route = createFileRoute('/account/lists')({
  beforeLoad: async () => {
    const { isAuthenticated } = await getAuthStatus();
    if (!isAuthenticated) {
      // Pas auth → bascule sur l'équivalent localStorage
      throw redirect({ to: '/local/lists' });
    }
  },
  loader: async ({ context: { queryClient } }) => {
    // À ce stade, beforeLoad a confirmé l'auth. On prefetch `mine` via la
    // server fn pour forwarder le cookie (sinon apiFetch côté SSR → 401).
    const mine = await getMineForSSR();
    if (mine) {
      queryClient.setQueryData(watchlistsQueries.mine().queryKey, mine);
    }
  },
  head: () => ({
    meta: [
      { title: 'Mes listes | Poplist' },
      { name: 'description', content: 'Gérez vos listes de films et séries' },
    ],
  }),
  component: ListsContent,
});
