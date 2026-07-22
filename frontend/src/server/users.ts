import { createServerFn } from '@tanstack/react-start';
import type { GetUserProfileByUsernameResponse } from '@poplist/shared/generated';

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3456';

/**
 * Fetch un profil user public côté SSR pour alimenter la metadata du `head()`.
 * Retourne `null` si le user n'existe pas.
 */
export const getUserProfileForMeta = createServerFn({ method: 'GET' })
  .inputValidator((data: { username: string }) => data)
  .handler(async ({ data }): Promise<GetUserProfileByUsernameResponse | null> => {
    try {
      const res = await fetch(`${BACKEND_URL}/user/${encodeURIComponent(data.username)}`);
      if (!res.ok) return null;
      return (await res.json()) as GetUserProfileByUsernameResponse;
    } catch {
      return null;
    }
  });
