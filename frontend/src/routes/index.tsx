import { createFileRoute } from '@tanstack/react-router';
import LandingContent from '@/app/LandingContent';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (typeof window === 'undefined') console.log('[SSR] route / beforeLoad');
  },
  loader: () => {
    if (typeof window === 'undefined') console.log('[SSR] route / loader');
  },
  head: () => {
    if (typeof window === 'undefined') console.log('[SSR] route / head');
    return {
      meta: [
        { title: 'Poplist - Créez des listes de films et séries' },
        {
          name: 'description',
          content:
            'Créez, partagez et découvrez des listes de films et séries avec vos amis.',
        },
      ],
    };
  },
  component: LandingContent,
});
