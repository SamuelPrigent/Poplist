import type { Platform, WatchlistItem } from '@poplist/shared';

/**
 * Crée un item placeholder (utilisé pour les updates optimistes côté UI
 * quand on n'a pas encore le retour serveur avec les champs DB générés).
 * Comble les champs DB nullables avec null par défaut.
 */
export function createPlaceholderItem(input: {
  tmdbId: number;
  title?: string | null;
  posterPath?: string | null;
  mediaType: 'movie' | 'tv';
  platformList?: Platform[];
  runtime?: number | null;
  numberOfSeasons?: number | null;
  numberOfEpisodes?: number | null;
  addedAt?: string | null;
}): WatchlistItem {
  return {
    id: `placeholder-${input.tmdbId}`,
    watchlistId: null,
    position: null,
    tmdbId: input.tmdbId,
    mediaType: input.mediaType,
    title: input.title ?? null,
    posterPath: input.posterPath ?? null,
    backdropPath: null,
    overview: null,
    releaseDate: null,
    voteAverage: null,
    runtime: input.runtime ?? null,
    numberOfSeasons: input.numberOfSeasons ?? null,
    numberOfEpisodes: input.numberOfEpisodes ?? null,
    platformList: input.platformList ?? [],
    addedAt: input.addedAt ?? new Date().toISOString(),
  };
}
