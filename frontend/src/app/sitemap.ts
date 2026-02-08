import type { MetadataRoute } from 'next'
import { GENRE_CATEGORIES } from '@/types/categories'

const BASE_URL = 'https://samuelprigent.com'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/home`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/explore`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/lists`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/users`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/categories`, changeFrequency: 'weekly', priority: 0.7 },
  ]

  // Category routes (known at build time)
  const categoryRoutes: MetadataRoute.Sitemap = GENRE_CATEGORIES.map((cat) => ({
    url: `${BASE_URL}/categories/${cat}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  // Dynamic routes from API
  let watchlistRoutes: MetadataRoute.Sitemap = []
  let userRoutes: MetadataRoute.Sitemap = []

  try {
    const res = await fetch(`${API_URL}/watchlists/public/featured`, {
      next: { revalidate: 3600 },
    })

    if (res.ok) {
      const { watchlists } = await res.json()

      // Public watchlist pages
      watchlistRoutes = watchlists.map((w: { id: string; updatedAt?: string }) => ({
        url: `${BASE_URL}/lists/${w.id}`,
        lastModified: w.updatedAt ? new Date(w.updatedAt) : undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }))

      // User profiles (unique owners from public watchlists)
      const uniqueUsers = new Map<string, string | undefined>()
      for (const w of watchlists) {
        if (w.owner?.username && !uniqueUsers.has(w.owner.username)) {
          uniqueUsers.set(w.owner.username, w.updatedAt)
        }
      }
      userRoutes = Array.from(uniqueUsers).map(([username, date]) => ({
        url: `${BASE_URL}/user/${username}`,
        lastModified: date ? new Date(date) : undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }))
    }
  } catch {
    // API unavailable during build — static routes only
  }

  return [...staticRoutes, ...categoryRoutes, ...watchlistRoutes, ...userRoutes]
}
