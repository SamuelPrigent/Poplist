import { createFileRoute } from '@tanstack/react-router';
import CategoriesContent from '@/app/categories/CategoriesContent';
import { watchlistsQueries } from '@/api/queries';
import { GENRE_CATEGORIES } from '@/types/categories';

export const Route = createFileRoute('/categories/')({
  loader: ({ context: { queryClient } }) => {
    // Prefetch non-bloquant des counts par genre (1 query par catégorie).
    // staleTime 5 min sur byGenre → cache partagé avec /home et /categories/$id.
    for (const genreId of GENRE_CATEGORIES) {
      queryClient.prefetchQuery(watchlistsQueries.byGenre(genreId));
    }
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
