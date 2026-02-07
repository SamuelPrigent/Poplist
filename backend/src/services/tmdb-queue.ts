import Bottleneck from 'bottleneck';
import { env } from '../env.js';

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
