import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';

/**
 * Vérifie la présence des cookies d'auth dans la requête entrante.
 *
 * Le backend Hono pose les cookies `accessToken` et `refreshToken` (httpOnly).
 * Comme on tourne sur le même domaine (`localhost` quelle que soit le port),
 * ces cookies sont envoyés automatiquement avec chaque requête vers le dev
 * server TanStack — donc accessibles dans les headers de la request.
 *
 * Note : cette server function ne valide PAS la signature/expiration du JWT,
 * elle vérifie juste la présence du cookie. Pour un check fort, il faudrait
 * appeler le backend `/auth/me` et passer le cookie.
 */
export const getAuthStatus = createServerFn({ method: 'GET' }).handler(async () => {
  console.log('[server-fn] getAuthStatus called', new Date().toISOString());
  const cookieHeader = getRequestHeader('cookie') ?? '';
  const hasAccessToken = /(?:^|; )accessToken=/.test(cookieHeader);
  const hasRefreshToken = /(?:^|; )refreshToken=/.test(cookieHeader);

  return {
    isAuthenticated: hasAccessToken || hasRefreshToken,
    hasAccessToken,
    hasRefreshToken,
  };
});
