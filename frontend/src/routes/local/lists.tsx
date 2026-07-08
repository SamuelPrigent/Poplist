import { createFileRoute, redirect } from '@tanstack/react-router';
import { ListsGuestContent } from '@/app/local/lists/ListsGuestContent';
import { getAuthStatusFast } from '@/lib/auth-status';

export const Route = createFileRoute('/local/lists')({
  beforeLoad: async () => {
    const { isAuthenticated } = await getAuthStatusFast();
    if (isAuthenticated) {
      throw redirect({ to: '/account/lists' });
    }
  },
  head: () => ({
    meta: [
      { title: 'Mes listes | Poplist' },
      { name: 'description', content: 'Créez un compte pour créer et partager vos listes' },
    ],
  }),
  component: ListsGuestContent,
});
