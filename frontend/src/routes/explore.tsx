import { createFileRoute } from '@tanstack/react-router';
import { ExploreContent } from '@/app/explore/ExploreContent';
import { tmdbQueries, watchlistsQueries } from '@/api/queries';
import { getAuthStatus } from '@/server/auth';
import { getMineForSSR } from '@/server/watchlists';

export const Route = createFileRoute('/explore')({
  // Expose les search params pertinents au loader (uniquement `q` ici : on
  // skip le prefetch discover si l'utilisateur arrive avec une recherche
  // active dans l'URL). Les autres params (genres, type, filter…) ne
  // changent pas la décision SSR : on prefetch toujours les defaults.
  loaderDeps: ({ search }: { search: Record<string, string> }) => ({
    q: search.q ?? '',
  }),
  beforeLoad: async () => {
    const { isAuthenticated } = await getAuthStatus();
    return { isAuthenticated };
  },
  loader: async ({ context: { queryClient, isAuthenticated }, deps: { q } }) => {
    // Si l'utilisateur arrive en mode search (URL contient q > 3 chars),
    // on n'a aucun moyen de prefetch côté SSR la query exacte (elle dépend
    // de tous les filtres). Le composant fera son fetch search côté client.
    if (q.length > 3) {
      // Toujours prefetch `mine` si auth pour les badges saved/collab.
      if (isAuthenticated) {
        const mine = await getMineForSSR();
        if (mine) queryClient.setQueryData(watchlistsQueries.mine().queryKey, mine);
      }
      return;
    }

    // 3 pages TMDB par défaut (mediaType=movie, sortBy=popularity.desc,
    // page UI=1 → TMDB pages 1/2/3, language=fr-FR default Zustand côté
    // serveur, pas de filtres). Si l'utilisateur arrive via deep link avec
    // search params autres (genres, year…), ces queries sont superflues
    // mais peu coûteuses (staleTime 5min).
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
