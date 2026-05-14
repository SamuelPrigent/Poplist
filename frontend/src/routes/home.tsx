import { createFileRoute } from '@tanstack/react-router';
import { HomeContent } from '@/app/home/HomeContent';

export const Route = createFileRoute('/home')({
  head: () => ({
    meta: [
      { title: 'Accueil | Poplist' },
      { name: 'description', content: 'Découvrez les films et séries tendance' },
    ],
  }),
  component: HomeContent,
});
