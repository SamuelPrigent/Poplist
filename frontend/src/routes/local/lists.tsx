import { createFileRoute, redirect } from '@tanstack/react-router';
import { ListsOfflineContent } from '@/app/local/lists/ListsOfflineContent';
import { getAuthStatus } from '@/server/auth';

export const Route = createFileRoute('/local/lists')({
  beforeLoad: async () => {
    if (typeof window === 'undefined') console.log('[SSR] route /local/lists beforeLoad START');
    const { isAuthenticated } = await getAuthStatus();
    if (typeof window === 'undefined') console.log('[SSR] route /local/lists beforeLoad END', { isAuthenticated });
    if (isAuthenticated) {
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
