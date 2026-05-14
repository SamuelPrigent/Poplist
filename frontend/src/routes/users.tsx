import { createFileRoute } from '@tanstack/react-router';
import { UsersContent } from '@/app/users/UsersContent';

export const Route = createFileRoute('/users')({
  head: () => ({
    meta: [
      { title: 'Créateurs | Poplist' },
      { name: 'description', content: 'Découvrez les créateurs de la communauté Poplist' },
    ],
  }),
  component: UsersContent,
});
