import { createFileRoute } from '@tanstack/react-router';
import CategoryDetailContent from '@/app/categories/[id]/CategoryDetailContent';

export const Route = createFileRoute('/categories/$id')({
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
