import { createFileRoute } from '@tanstack/react-router';
import { HomeContent } from '@/app/home/HomeContent';
import { tmdbQueries, watchlistsQueries } from '@/api/queries';
import { getAuthStatus } from '@/server/auth';
import { GENRE_CATEGORIES } from '@/types/categories';

export const Route = createFileRoute('/home')({
  beforeLoad: async () => {
    const { isAuthenticated } = await getAuthStatus();
    return { isAuthenticated };
  },
  loader: ({ context: { queryClient, isAuthenticated } }) => {
    // Prefetch non-bloquant en parallèle :
    // - publicFeatured(100) : grille principale + extraction creators
    // - trending('day')     : section Tendances
    // - byGenre × N         : counts par catégorie (cache partagé avec /categories)
    // - mine()              : conditionnel si auth, pour les badges saved/collab
    //
    // NOTE : les 2 useQuery discover (movie/tv) ne sont PAS prefetchés ici
    // car le composant utilise `page: randomPage` (Math.random côté client).
    // Côté serveur, on ne peut pas reproduire ce random → mismatch de queryKey
    // garanti → cache miss. Le composant les fetch au mount comme avant.
    queryClient.prefetchQuery(watchlistsQueries.publicFeatured(100));
    queryClient.prefetchQuery(tmdbQueries.trending('day'));
    for (const genreId of GENRE_CATEGORIES) {
      queryClient.prefetchQuery(watchlistsQueries.byGenre(genreId));
    }
    if (isAuthenticated) {
      queryClient.prefetchQuery(watchlistsQueries.mine());
    }
  },
  head: () => ({
    meta: [
      { title: 'Accueil | Poplist' },
      { name: 'description', content: 'Découvrez les films et séries tendance' },
    ],
  }),
  component: HomeContent,
});
