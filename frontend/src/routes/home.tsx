import { createFileRoute } from '@tanstack/react-router';
import { HomeContent } from '@/app/home/HomeContent';
import { tmdbQueries, watchlistsQueries } from '@/api/queries';
import { getAuthStatusFast } from '@/lib/auth-status';
import { HomePending } from '@/components/skeletons/RoutePending';
import { getMineForSSR } from '@/server/watchlists';
import { GENRE_CATEGORIES } from '@/types/categories';

export const Route = createFileRoute('/home')({
  beforeLoad: async () => {
    const { isAuthenticated } = await getAuthStatusFast();
    return { isAuthenticated };
  },
  loader: async ({ context: { queryClient, isAuthenticated } }) => {
    // SSR cohérent : on attend la résolution des prefetches pour que
    // dehydrate(queryClient) capture la data et que l'hydratation côté
    // client trouve les mêmes valeurs (évite les hydration mismatches).
    //
    // En nav client→client, le preload `intent` (hover) lance ces fetchs
    // pendant le hover → au click, `ensureQueryData` résout instantanément
    // (cache hit ou promise déjà en cours). Donc l'await n'est pas perçu.
    //
    // NOTE : les 2 useQuery `discover` (movie/tv) ne sont PAS prefetchés ici
    // car le composant utilise `page: randomPage` (Math.random côté client).
    // Côté serveur, on ne peut pas reproduire ce random → cache miss garanti.
    const ssrPrefetches: Promise<unknown>[] = [
      queryClient.ensureQueryData(watchlistsQueries.publicFeatured(100)),
      queryClient.ensureQueryData(tmdbQueries.trending('day')),
      ...GENRE_CATEGORIES.map((genreId) =>
        queryClient.ensureQueryData(watchlistsQueries.byGenre(genreId))
      ),
    ];

    if (isAuthenticated) {
      // `mine()` ne peut pas être prefetché via le SDK client côté SSR (cookie
      // non transmis → 401). On passe par une server fn qui forward le cookie.
      ssrPrefetches.push(
        getMineForSSR().then((mine) => {
          if (mine) queryClient.setQueryData(watchlistsQueries.mine().queryKey, mine);
        })
      );
    }

    await Promise.all(ssrPrefetches);
  },
  head: () => ({
    meta: [
      { title: 'Accueil | Poplist' },
      { name: 'description', content: 'Découvrez les films et séries tendance' },
    ],
  }),
  pendingComponent: HomePending,
  component: HomeContent,
});
