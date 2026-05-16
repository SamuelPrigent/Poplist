import { createFileRoute } from '@tanstack/react-router';
import CategoriesContent from '@/app/categories/CategoriesContent';
import { watchlistsQueries } from '@/api/queries';
import { GENRE_CATEGORIES } from '@/types/categories';

export const Route = createFileRoute('/categories/')({
  loader: async ({ context: { queryClient } }) => {
    // N queries en parallèle (1 par catégorie). staleTime 5 min sur byGenre
    // → cache partagé avec /home et /categories/$id. Await Promise.all pour
    // que le dehydrate SSR capture toutes les counts au moment du render.
    await Promise.all(
      GENRE_CATEGORIES.map((genreId) =>
        queryClient.ensureQueryData(watchlistsQueries.byGenre(genreId))
      )
    );
  },
  head: () => ({
    meta: [
      { title: 'Catégories | Poplist' },
      {
        name: 'description',
        content: 'Explorez les listes par catégorie : action, comédie, horreur et plus encore.',
      },
    ],
  }),
  component: CategoriesContent,
});
