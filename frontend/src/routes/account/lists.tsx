import { createFileRoute, redirect } from '@tanstack/react-router';
import { ListsContent } from '@/app/account/lists/ListsContent';
import { getAuthStatus } from '@/server/auth';

export const Route = createFileRoute('/account/lists')({
  beforeLoad: async () => {
    if (typeof window === 'undefined') console.log('[SSR] route /account/lists beforeLoad START');
    const { isAuthenticated } = await getAuthStatus();
    if (typeof window === 'undefined') console.log('[SSR] route /account/lists beforeLoad END', { isAuthenticated });
    if (!isAuthenticated) {
      // Pas auth → bascule sur l'équivalent localStorage
      throw redirect({ to: '/local/lists' });
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
