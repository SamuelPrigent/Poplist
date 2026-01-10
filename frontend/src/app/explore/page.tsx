import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ExploreContent } from './ExploreContent';

export const metadata: Metadata = {
  title: 'Explorer',
  description: 'Découvrez les films et séries populaires',
};

function ExploreLoading() {
  return (
    <div className="bg-background mb-24 min-h-screen p-12">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-left">
          <div className="bg-muted mb-4 h-12 w-48 animate-pulse rounded-lg" />
          <div className="bg-muted h-6 w-96 animate-pulse rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="bg-muted aspect-2/3 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<ExploreLoading />}>
      <ExploreContent />
    </Suspense>
  );
}
