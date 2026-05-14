import { createFileRoute, redirect } from '@tanstack/react-router';
import AccountPage from '@/app/account/page';
import { getAuthStatus } from '@/server/auth';

export const Route = createFileRoute('/account/')({
  beforeLoad: async () => {
    if (typeof window === 'undefined') console.log('[SSR] route /account beforeLoad START');
    const { isAuthenticated } = await getAuthStatus();
    if (typeof window === 'undefined') console.log('[SSR] route /account beforeLoad END', { isAuthenticated });
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
