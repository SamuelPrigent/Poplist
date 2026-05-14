import { createFileRoute } from '@tanstack/react-router';
import { GENRE_CATEGORIES } from '@/types/categories';

const BASE_URL = 'https://samuelprigent.com';
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3456';

type SitemapEntry = {
  url: string;
  lastModified?: string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
};

function entryToXml(entry: SitemapEntry): string {
  const parts: Array<string> = [`<loc>${entry.url}</loc>`];
  if (entry.lastModified) parts.push(`<lastmod>${entry.lastModified}</lastmod>`);
  if (entry.changeFrequency) parts.push(`<changefreq>${entry.changeFrequency}</changefreq>`);
  if (entry.priority !== undefined) parts.push(`<priority>${entry.priority}</priority>`);
  return `  <url>\n    ${parts.join('\n    ')}\n  </url>`;
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const staticRoutes: Array<SitemapEntry> = [
          { url: BASE_URL, changeFrequency: 'daily', priority: 1 },
          { url: `${BASE_URL}/home`, changeFrequency: 'daily', priority: 0.9 },
          { url: `${BASE_URL}/explore`, changeFrequency: 'daily', priority: 0.8 },
          { url: `${BASE_URL}/lists`, changeFrequency: 'daily', priority: 0.8 },
          { url: `${BASE_URL}/users`, changeFrequency: 'daily', priority: 0.7 },
          { url: `${BASE_URL}/categories`, changeFrequency: 'weekly', priority: 0.7 },
        ];

        const categoryRoutes: Array<SitemapEntry> = GENRE_CATEGORIES.map((cat) => ({
          url: `${BASE_URL}/categories/${cat}`,
          changeFrequency: 'weekly',
          priority: 0.6,
        }));

        let watchlistRoutes: Array<SitemapEntry> = [];
        let userRoutes: Array<SitemapEntry> = [];

        try {
          const res = await fetch(`${BACKEND_URL}/watchlists/public/featured`);
          if (res.ok) {
            const { watchlists } = (await res.json()) as {
              watchlists: Array<{
                id: string;
                updatedAt?: string;
                owner?: { username?: string };
              }>;
            };

            watchlistRoutes = watchlists.map((w) => ({
              url: `${BASE_URL}/lists/${w.id}`,
              lastModified: w.updatedAt,
              changeFrequency: 'weekly',
              priority: 0.5,
            }));

            const uniqueUsers = new Map<string, string | undefined>();
            for (const w of watchlists) {
              if (w.owner?.username && !uniqueUsers.has(w.owner.username)) {
                uniqueUsers.set(w.owner.username, w.updatedAt);
              }
            }
            userRoutes = Array.from(uniqueUsers).map(([username, date]) => ({
              url: `${BASE_URL}/user/${username}`,
              lastModified: date,
              changeFrequency: 'weekly',
              priority: 0.5,
            }));
          }
        } catch {
          // Backend unreachable — fallback to static routes only
        }

        const allEntries = [...staticRoutes, ...categoryRoutes, ...watchlistRoutes, ...userRoutes];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries.map(entryToXml).join('\n')}
</urlset>`;

        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          },
        });
      },
    },
  },
});
