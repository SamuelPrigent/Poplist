/**
 * Helpers de formatage durée / format d'un item (film ou série).
 *
 * Source unique réutilisée par la table de liste (`ListItemsTable`) et la
 * section recommandations (`ListRecommendations`) pour garantir un rendu
 * identique : « 1h 41 min » pour un film, « 1 saison, 25 ep » pour une série.
 */

/** Durée d'un film : « 45 min », « 1h 41 min », « 2h », ou « — » si absente. */
export function formatRuntime(minutes: number | undefined | null): string {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins} min` : `${hours}h`;
}

/**
 * Chaîne « format » d'un item :
 * - série → « N saison(s), M ep » (ou « — » si rien)
 * - film  → durée via `formatRuntime`
 */
export function formatItemFormat(item: {
  mediaType: string;
  runtime?: number | null;
  numberOfSeasons?: number | null;
  numberOfEpisodes?: number | null;
}): string {
  if (item.mediaType === 'tv') {
    const seasons = item.numberOfSeasons;
    const episodes = item.numberOfEpisodes;
    if (seasons || episodes) {
      const parts: string[] = [];
      if (seasons) parts.push(`${seasons} ${seasons > 1 ? 'saisons' : 'saison'}`);
      if (episodes) parts.push(`${episodes} ep`);
      return parts.join(', ');
    }
    return '—';
  }
  return formatRuntime(item.runtime ?? undefined);
}
