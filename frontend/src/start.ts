/**
 * Entry point global TanStack Start. Auto-découvert par le plugin
 * `@tanstack/react-start/plugin/vite` (cherche `src/start.{ts,tsx,js,jsx}`
 * dans le srcDirectory).
 *
 * Utilisé ici pour enregistrer un request middleware global qui ajoute les
 * security headers sur toutes les responses HTML SSR. Voir
 * `src/server/headers.ts` pour la définition exacte des headers.
 */

import { createMiddleware, createStart } from '@tanstack/react-start';
import { applySecurityHeaders } from '@/server/headers';

// Le request middleware tourne sur TOUTES les requêtes (SSR HTML, server
// functions, server routes API). `applySecurityHeaders` filtre en interne
// sur le Content-Type pour ne s'appliquer qu'aux responses HTML.
const securityHeadersMiddleware = createMiddleware({ type: 'request' }).server(
  async ({ next }) => {
    const result = await next();
    applySecurityHeaders(result.response, { isDev: import.meta.env.DEV });
    return result;
  },
);

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeadersMiddleware],
}));
