import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { MobileHeader } from '@/components/layout/MobileHeader';
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
      // NB clavier virtuel : on garde le comportement par défaut
      // (resizes-visual) → le layout et les unités dvh ne bougent PAS quand le
      // clavier s'ouvre : les drawers gardent une hauteur stable et le clavier
      // recouvre simplement leur bas (les inputs des drawers sont en haut).
      // Combiné à repositionInputs={false} côté vaul (cf. ui/drawer.tsx), plus
      // aucun redimensionnement/décalage parasite.
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'theme-color', content: '#090a0c' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'Poplist' },
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
      { rel: 'manifest', href: '/manifest.json' },
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      { rel: 'icon', href: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'icon', href: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument() {
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
          <div className="flex min-h-screen flex-col max-[749px]:pb-[calc(4.25rem+env(safe-area-inset-bottom))]">
            <Navbar />
            <MobileHeader />
            <main id="main-content" className="flex-1">
              <Outlet />
            </main>
            <Footer />
            <MobileBottomNav />
          </div>
        </Providers>
        <Scripts />
      </body>
    </html>
  );
}
