import { createFileRoute } from '@tanstack/react-router';
import { UsersContent } from '@/app/users/UsersContent';
import { watchlistsQueries } from '@/api/queries';

export const Route = createFileRoute('/users')({
  loader: ({ context: { queryClient } }) => {
    // Prefetch non-bloquant : 500 watchlists publiques featured pour extraire
    // les créateurs uniques côté composant (UsersContent).
    queryClient.prefetchQuery(watchlistsQueries.publicFeatured(500));
  },
  head: () => ({
    meta: [
      { title: 'Créateurs | Poplist' },
      { name: 'description', content: 'Découvrez les créateurs de la communauté Poplist' },
    ],
  }),
  component: UsersContent,
});
