/**
 * Entry point global TanStack Start. Auto-découvert par le plugin
 * `@tanstack/react-start/plugin/vite` (cherche `src/start.{ts,tsx,js,jsx}`
 * dans le srcDirectory).
 *
 * Utilisé ici pour enregistrer les request middlewares globaux : la protection
 * CSRF des server functions, et les security headers sur toutes les responses
 * HTML SSR (voir `src/server/headers.ts` pour la définition exacte des headers).
 */

import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from '@tanstack/react-start';
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

// Protège les server functions (endpoints RPC same-origin) des requêtes
// cross-site : vérifie Sec-Fetch-Site, puis Origin, puis Referer. Les pages SSR
// et les server routes ne sont pas concernées (filtre sur `serverFn`).
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, securityHeadersMiddleware],
}));
