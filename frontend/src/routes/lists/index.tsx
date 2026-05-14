import { createFileRoute } from '@tanstack/react-router';
import ListsContent from '@/app/lists/ListsContent';

export const Route = createFileRoute('/lists/')({
  head: () => ({
    meta: [
      { title: 'Listes | Poplist' },
      {
        name: 'description',
        content: 'Découvrez les listes de films et séries partagées par la communauté.',
      },
    ],
  }),
  component: ListsContent,
});
