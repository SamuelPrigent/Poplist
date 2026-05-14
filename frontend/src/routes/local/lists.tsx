import { createFileRoute, redirect } from '@tanstack/react-router';
import { ListsOfflineContent } from '@/app/local/lists/ListsOfflineContent';
import { getAuthStatus } from '@/server/auth';

export const Route = createFileRoute('/local/lists')({
  beforeLoad: async () => {
    const { isAuthenticated } = await getAuthStatus();
    if (isAuthenticated) {
      // Auth → bascule sur la library serveur (les listes locales seraient
      // proposées en migration via le flow features/watchlists/localStorage)
      throw redirect({ to: '/account/lists' });
    }
  },
  head: () => ({
    meta: [
      { title: 'Mes listes (local) | Poplist' },
      { name: 'description', content: 'Gérez vos listes locales de films et séries' },
    ],
  }),
  component: ListsOfflineContent,
});
