import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';
import type {
  GetPublicWatchlistResponse,
  GetWatchlistByIdResponse,
  GetMyWatchlistsResponse,
} from '@poplist/shared/generated';

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3456';

/**
 * Fetch une watchlist publique côté SSR.
 * Retourne null si la watchlist n'existe pas ou est privée.
 */
export const getPublicWatchlistForMeta = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<GetPublicWatchlistResponse | null> => {
    try {
      const res = await fetch(`${BACKEND_URL}/watchlists/public/${data.id}`);
      if (!res.ok) return null;
      return (await res.json()) as GetPublicWatchlistResponse;
    } catch {
      return null;
    }
  });

/**
 * Fetch une watchlist côté SSR pour un utilisateur authentifié, en forwardant
 * le cookie d'auth. Retourne la watchlist avec les flags `isOwner`,
 * `isCollaborator`, `isSaved` (versus l'endpoint public qui ne les a pas).
 *
 * Utilisé par le loader de /lists/$id quand `isAuthenticated` est true (cookie
 * présent). Permet d'avoir UNE seule query à hydrater au lieu de deux qui
 * résolvent en cascade (qui causaient un re-render visible / flicker).
 */
export const getAuthWatchlistForMeta = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<GetWatchlistByIdResponse | null> => {
    const cookie = getRequestHeader('cookie') ?? '';
    if (!cookie) return null;
    try {
      const res = await fetch(`${BACKEND_URL}/watchlists/${data.id}`, {
        headers: { cookie },
      });
      if (!res.ok) return null;
      return (await res.json()) as GetWatchlistByIdResponse;
    } catch {
      return null;
    }
  });

/**
 * Fetch les watchlists du user courant côté SSR en forwardant le cookie
 * d'auth. Utilisé par les loaders qui prefetch `watchlistsQueries.mine()`.
 *
 * Le SDK client (`watchlists.getMine` via `apiFetch`) ne peut pas être appelé
 * directement côté SSR car le cookie n'est pas transmis automatiquement,
 * ce qui provoque un 401 et un dehydrate en erreur côté client.
 */
export const getMineForSSR = createServerFn({ method: 'GET' }).handler(
  async (): Promise<GetMyWatchlistsResponse | null> => {
    const cookie = getRequestHeader('cookie') ?? '';
    if (!cookie) return null;
    try {
      const res = await fetch(`${BACKEND_URL}/watchlists/mine`, {
        headers: { cookie },
      });
      if (!res.ok) return null;
      return (await res.json()) as GetMyWatchlistsResponse;
    } catch {
      return null;
    }
  },
);
