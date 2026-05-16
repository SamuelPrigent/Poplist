import { createFileRoute } from '@tanstack/react-router';
import { ExploreContent } from '@/app/explore/ExploreContent';
import { tmdbQueries, watchlistsQueries } from '@/api/queries';
import { getAuthStatus } from '@/server/auth';
import { getMineForSSR } from '@/server/watchlists';

export const Route = createFileRoute('/explore')({
  beforeLoad: async () => {
    const { isAuthenticated } = await getAuthStatus();
    return { isAuthenticated };
  },
  loader: async ({ context: { queryClient, isAuthenticated } }) => {
    // 3 pages TMDB par défaut (mediaType=movie, sortBy=popularity.desc,
    // page UI=1 → TMDB pages 1/2/3, language=fr-FR default Zustand côté
    // serveur, pas de filtres). Si l'utilisateur arrive via deep link avec
    // search params, ces queries sont superflues mais peu coûteuses
    // (staleTime 5min, profite aux autres users qui arrivent sans filtres).
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
  component: ExploreContent,
});
