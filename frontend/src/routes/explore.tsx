import { createFileRoute } from '@tanstack/react-router';
import { ExploreContent } from '@/app/explore/ExploreContent';
import { tmdbQueries, watchlistsQueries } from '@/api/queries';
import { getAuthStatusFast } from '@/lib/auth-status';
import { ExplorePending } from '@/components/skeletons/RoutePending';
import { getMineForSSR } from '@/server/watchlists';

export const Route = createFileRoute('/explore')({
  beforeLoad: async () => {
    const { isAuthenticated } = await getAuthStatusFast();
    return { isAuthenticated };
  },
  loader: async ({ context: { queryClient, isAuthenticated } }) => {
    // Les filtres/recherche d'Explore vivent en state local du composant
    // (pas de search params dans l'URL) : la page arrive toujours dans son
    // état par défaut → on prefetch les 3 pages TMDB par défaut
    // (mediaType=movie, sortBy=popularity.desc, page UI=1 → TMDB pages
    // 1/2/3, language=fr-FR default Zustand côté serveur).
    const tasks: Promise<unknown>[] = [];
    for (let i = 1; i <= 3; i++) {
      tasks.push(
        queryClient.ensureQueryData(
          tmdbQueries.discover('movie', {
            page: i,
            language: 'fr-FR',
            sortBy: 'popularity.desc',
            voteCountGte: 100,
            voteAverageGte: 5.0,
            releaseDateGte: undefined,
            releaseDateLte: undefined,
          })
        )
      );
    }

    if (isAuthenticated) {
      tasks.push(
        getMineForSSR().then((mine) => {
          if (mine) queryClient.setQueryData(watchlistsQueries.mine().queryKey, mine);
        })
      );
    }

    await Promise.all(tasks);
  },
  head: () => ({
    meta: [
      { title: 'Explorer | Poplist' },
      { name: 'description', content: 'Découvrez les films et séries populaires' },
    ],
  }),
  pendingComponent: ExplorePending,
  component: ExploreContent,
});
