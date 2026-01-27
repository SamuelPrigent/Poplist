import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ListsOfflineContent } from './ListsOfflineContent';
import { PageReveal } from '@/components/ui/PageReveal';

export const metadata: Metadata = {
  title: 'Mes Listes (Local)',
  description: 'Gérez vos listes locales de films et séries',
};

function ListsLoading() {
  return null;
}

export default function LocalListsPage() {
  return (
    <PageReveal timeout={3000} minLoadingTime={100} revealDuration={0.3}>
      <Suspense fallback={<ListsLoading />}>
        <ListsOfflineContent />
      </Suspense>
    </PageReveal>
  );
}
