import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ListsOfflineContent } from './ListsOfflineContent';
import { PageReveal } from '@/components/ui/PageReveal';

export const metadata: Metadata = {
  title: 'Mes Listes (Local)',
  description: 'Gérez vos listes locales de films et séries',
};

function ListsLoading() {
  return (
    <div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-white">Mes Listes</h1>
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    </div>
  );
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
