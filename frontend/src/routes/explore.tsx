import { createFileRoute } from '@tanstack/react-router';
import { ExploreContent } from '@/app/explore/ExploreContent';

export const Route = createFileRoute('/explore')({
  head: () => ({
    meta: [
      { title: 'Explorer | Poplist' },
      { name: 'description', content: 'Découvrez les films et séries populaires' },
    ],
  }),
  component: ExploreContent,
});
