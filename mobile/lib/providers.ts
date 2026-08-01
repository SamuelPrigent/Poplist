import type { ProviderKey } from '../components/ProviderIcon';
import type { Platform } from '../types';

/**
 * Correspondance nom TMDB → icône de plateforme, partagée par la fiche détail
 * et les lignes de liste (elle était auparavant privée à ItemDetailSheet).
 */
export const PROVIDER_MAP: Record<string, ProviderKey> = {
  Netflix: 'netflix',
  'Amazon Prime Video': 'primevideo',
  'Prime Video': 'primevideo',
  YouTube: 'youtube',
  'YouTube Premium': 'youtube',
  'Disney Plus': 'disneyplus',
  'Disney+': 'disneyplus',
  Crunchyroll: 'crunchyroll',
  Max: 'hbomax',
  'HBO Max': 'hbomax',
  'Max Amazon Channel': 'hbomax',
};

export function getMatchedProviders(platforms: Platform[]): ProviderKey[] {
  const seen = new Set<ProviderKey>();
  const result: ProviderKey[] = [];
  for (const p of platforms) {
    const key = PROVIDER_MAP[p.name];
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }
  return result.slice(0, 3);
}
