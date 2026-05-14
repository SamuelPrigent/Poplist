import { createFileRoute } from '@tanstack/react-router';
import LocalListDetailPage from '@/app/local/list/[id]/page';

export const Route = createFileRoute('/local/list/$id')({
  head: () => ({
    meta: [
      { title: 'Liste locale | Poplist' },
      { name: 'description', content: 'Watchlist locale (mode offline)' },
    ],
  }),
  component: LocalListDetailPage,
});
