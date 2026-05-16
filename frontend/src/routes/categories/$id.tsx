import { createFileRoute } from '@tanstack/react-router';
import CategoryDetailContent from '@/app/categories/[id]/CategoryDetailContent';
import { watchlistsQueries } from '@/api/queries';

export const Route = createFileRoute('/categories/$id')({
  loader: async ({ params, context: { queryClient } }) => {
    // Await ensureQueryData pour un dehydrate cohérent côté SSR.
    // Sur la nav client→client, le preload `intent` lance le fetch pendant
    // le hover → l'await au click résout immédiatement (cache hit).
    await queryClient.ensureQueryData(watchlistsQueries.byGenre(params.id));
  },
  head: ({ params }) => ({
    meta: [
      { title: `${capitalize(params.id)} | Poplist` },
      {
        name: 'description',
        content: `Listes de la catégorie ${params.id} partagées par la communauté Poplist`,
      },
    ],
  }),
  component: CategoryDetailContent,
});

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
