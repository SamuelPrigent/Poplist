import { createFileRoute } from '@tanstack/react-router';
import CategoriesContent from '@/app/categories/CategoriesContent';

export const Route = createFileRoute('/categories/')({
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
