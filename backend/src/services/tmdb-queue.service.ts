import Bottleneck from 'bottleneck';
import { env } from '../env.js';

/**
 * UNIQUE point d'entrée vers l'API TMDB (`api.themoviedb.org`).
 *
 * - Tout appel à l'API DOIT passer par `fetchFromTMDB` ci-dessous : c'est le
 *   seul `fetch` autorisé vers l'API, et il est sérialisé par l'unique
 *   Bottleneck `tmdbQueue` (≤ 39 req/s, sous la limite de 40/s de TMDB).
 *   Ne JAMAIS faire de `fetch('https://api.themoviedb.org/...')` ailleurs, ni
 *   créer un second `new Bottleneck` → sinon 2 files = dépassement possible.
 *   (Invariant vérifié par `tests/unit/tmdb-funnel.test.ts`.)
 *
 * - ⚠️ Ce limiteur est EN MÉMOIRE, donc PAR PROCESS. La garantie globale des
 *   40/s n'est valable qu'avec UNE SEULE instance backend (Railway replicas = 1).
 *   En cas de scaling horizontal (N instances), il faudrait passer Bottleneck
 *   en mode datastore Redis pour partager le réservoir entre process.
 */

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const tmdbQueue = new Bottleneck({
  reservoir: 39,
  reservoirRefreshAmount: 39,
  reservoirRefreshInterval: 1000,
  maxConcurrent: 10,
});

async function rawFetchTMDB(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<unknown> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${env.TMDB_API}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[TMDB ERROR] ${response.status} for ${endpoint}:`, errorText);
    throw new Error(`TMDB API error: ${response.status}`);
  }

  return response.json();
}

export async function fetchFromTMDB(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<unknown> {
  return tmdbQueue.schedule(() => rawFetchTMDB(endpoint, params));
}
