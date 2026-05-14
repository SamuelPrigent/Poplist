import { createFileRoute } from '@tanstack/react-router';
import LandingContent from '@/app/LandingContent';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Poplist - Créez des listes de films et séries' },
      {
        name: 'description',
        content:
          'Créez, partagez et découvrez des listes de films et séries avec vos amis.',
      },
    ],
  }),
  component: LandingContent,
});
