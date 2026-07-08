import { createFileRoute, redirect } from '@tanstack/react-router';
import AccountPage from '@/app/account/page';
import { getAuthStatusFast } from '@/lib/auth-status';

export const Route = createFileRoute('/account/')({
  beforeLoad: async () => {
    const { isAuthenticated } = await getAuthStatusFast();
    if (!isAuthenticated) {
      throw redirect({ to: '/home' });
    }
  },
  head: () => ({
    meta: [
      { title: 'Mon compte | Poplist' },
      { name: 'description', content: 'Paramètres et informations du compte' },
    ],
  }),
  component: AccountPage,
});
