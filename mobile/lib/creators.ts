import type { Watchlist } from '../types'

export interface Creator {
  username: string
  avatarUrl?: string
  listCount: number
}

/**
 * Agrège les auteurs d'un jeu de listes publiques, les plus prolifiques d'abord.
 *
 * Fonction pure, extraite de l'accueil ET de l'écran Créateurs qui en avaient
 * chacun leur copie impérative, noyée dans un `loadData`.
 */
export function toCreators(watchlists: Watchlist[]): Creator[] {
  const byUsername = new Map<string, Creator>()

  for (const w of watchlists) {
    const username = w.owner?.username
    if (!username) continue

    const existing = byUsername.get(username)
    if (existing) {
      existing.listCount++
    } else {
      byUsername.set(username, {
        username,
        avatarUrl: w.owner?.avatarUrl ?? undefined,
        listCount: 1,
      })
    }
  }

  return Array.from(byUsername.values()).sort((a, b) => b.listCount - a.listCount)
}
