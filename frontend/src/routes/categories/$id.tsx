import { createFileRoute } from '@tanstack/react-router';
import CategoryDetailContent from '@/app/categories/[id]/CategoryDetailContent';
import { watchlistsQueries } from '@/api/queries';

export const Route = createFileRoute('/categories/$id')({
  loader: ({ params, context: { queryClient } }) => {
    // Prefetch non-bloquant : lance le fetch des watchlists du genre.
    // Au hover (preload intent), la data sera en cache avant le click.
    queryClient.prefetchQuery(watchlistsQueries.byGenre(params.id));
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
