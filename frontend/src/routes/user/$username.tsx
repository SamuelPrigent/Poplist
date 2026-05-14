import { createFileRoute } from '@tanstack/react-router';
import UserProfilePage from '@/app/user/[username]/page';
import { usersQueries } from '@/api/queries';
import { getUserProfileForMeta } from '@/server/users';

export const Route = createFileRoute('/user/$username')({
  loader: async ({ params, context: { queryClient } }) => {
    const result = await getUserProfileForMeta({ data: { username: params.username } });
    if (result) {
      queryClient.setQueryData(
        usersQueries.byUsername(params.username).queryKey,
        result
      );
    }
    return result;
  },
  head: ({ loaderData, params }) => {
    const user = loaderData?.user;
    const username = user?.username ?? params.username;
    const title = `@${username} — Poplist`;
    const description = `Listes publiques de @${username} sur Poplist`;
    const ogImage = user?.avatarUrl ?? '/preview/watchlists1.webp';

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: `@${username}` },
        { property: 'og:description', content: description },
        { property: 'og:image', content: ogImage },
        { name: 'twitter:card', content: 'summary' },
      ],
    };
  },
  component: UserProfilePage,
});
