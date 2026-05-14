import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Providers } from '@/components/providers';

import appCss from '../styles.css?url';

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Poplist' },
      {
        name: 'description',
        content: 'Créez et partagez vos listes de films et séries',
      },
      { property: 'og:title', content: 'Poplist' },
      {
        property: 'og:description',
        content: 'Créez et partagez vos listes de films et séries',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'fr_FR' },
      { property: 'og:image', content: '/preview/watchlists1.webp' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Poplist' },
      { name: 'twitter:image', content: '/preview/watchlists1.webp' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'preconnect', href: 'https://image.tmdb.org' },
      { rel: 'dns-prefetch', href: 'https://image.tmdb.org' },
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      { rel: 'icon', href: '/play.png', sizes: '512x512', type: 'image/png' },
      { rel: 'apple-touch-icon', href: '/play.png' },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument() {
  if (typeof window === 'undefined') {
    console.log('[SSR render] __root RootDocument');
  }
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground min-h-screen antialiased">
        <Providers>
          {/* <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-black focus:outline-none"
          >
            Aller au contenu principal
          </a> */}
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main id="main-content" className="flex-1">
              <Outlet />
            </main>
            <Footer />
          </div>
        </Providers>
        <Scripts />
      </body>
    </html>
  );
}
