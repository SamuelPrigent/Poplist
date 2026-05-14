import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';
import type { WatchlistsAPI } from '@poplist/shared';

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3456';

/**
 * Fetch une watchlist publique côté SSR.
 * Retourne null si la watchlist n'existe pas ou est privée.
 */
export const getPublicWatchlistForMeta = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<WatchlistsAPI.GetPublicWatchlistResponse | null> => {
    console.log('[server-fn] getPublicWatchlistForMeta called', data.id, 'BACKEND_URL=', BACKEND_URL);
    try {
      const res = await fetch(`${BACKEND_URL}/watchlists/public/${data.id}`);
      if (!res.ok) return null;
      return (await res.json()) as WatchlistsAPI.GetPublicWatchlistResponse;
    } catch (err) {
      console.error('[server-fn] getPublicWatchlistForMeta error', err);
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
  .handler(async ({ data }): Promise<WatchlistsAPI.GetWatchlistByIdResponse | null> => {
    console.log('[server-fn] getAuthWatchlistForMeta called', data.id);
    const cookie = getRequestHeader('cookie') ?? '';
    if (!cookie) return null;
    try {
      const res = await fetch(`${BACKEND_URL}/watchlists/${data.id}`, {
        headers: { cookie },
      });
      if (!res.ok) return null;
      return (await res.json()) as WatchlistsAPI.GetWatchlistByIdResponse;
    } catch (err) {
      console.error('[server-fn] getAuthWatchlistForMeta error', err);
      return null;
    }
  });
