import { createFileRoute } from '@tanstack/react-router';
import { UsersContent } from '@/app/users/UsersContent';
import { watchlistsQueries } from '@/api/queries';

export const Route = createFileRoute('/users')({
  loader: async ({ context: { queryClient } }) => {
    // 500 watchlists publiques featured pour extraire les créateurs uniques
    // côté composant. Await pour un dehydrate SSR cohérent.
    await queryClient.ensureQueryData(watchlistsQueries.publicFeatured(500));
  },
  head: () => ({
    meta: [
      { title: 'Créateurs | Poplist' },
      { name: 'description', content: 'Découvrez les créateurs de la communauté Poplist' },
    ],
  }),
  component: UsersContent,
});
