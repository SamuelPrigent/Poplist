import { createServerFn } from '@tanstack/react-start';
import type { UsersAPI } from '@poplist/shared';

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3456';

/**
 * Fetch un profil user public côté SSR pour alimenter la metadata du `head()`.
 * Retourne `null` si le user n'existe pas.
 */
export const getUserProfileForMeta = createServerFn({ method: 'GET' })
  .inputValidator((data: { username: string }) => data)
  .handler(async ({ data }): Promise<UsersAPI.GetUserProfileByUsernameResponse | null> => {
    console.log('[server-fn] getUserProfileForMeta called', data.username);
    try {
      const res = await fetch(`${BACKEND_URL}/user/${encodeURIComponent(data.username)}`);
      if (!res.ok) return null;
      return (await res.json()) as UsersAPI.GetUserProfileByUsernameResponse;
    } catch (err) {
      console.error('[server-fn] getUserProfileForMeta error', err);
      return null;
    }
  });
