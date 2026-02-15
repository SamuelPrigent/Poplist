import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Providers } from '@/components/providers';
import { ThemeScript } from '@/components/providers/ThemeScript';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://samuelprigent.com'),
  title: {
    default: 'Poplist',
    template: '%s | Poplist',
  },
  description: 'Créez et partagez vos listes de films et séries',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/play.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/play.png',
  },
  openGraph: {
    title: 'Poplist',
    description: 'Créez et partagez vos listes de films et séries',
    url: 'https://samuelprigent.com',
    siteName: 'Poplist',
    images: [
      {
        url: '/preview/watchlists1.webp',
        width: 1200,
        height: 630,
        alt: 'Poplist — Créez et partagez vos listes de films et séries',
      },
    ],
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Poplist',
    description: 'Créez et partagez vos listes de films et séries',
    images: ['/preview/watchlists1.webp'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
      </head>
      <body className="bg-background text-foreground min-h-screen antialiased">
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-black focus:outline-none"
          >
            Aller au contenu principal
          </a>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main id="main-content" className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
