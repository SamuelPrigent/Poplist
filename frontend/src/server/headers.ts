/**
 * Security headers pour les responses HTML SSR de Poplist.
 *
 * Porté depuis `-frontend-next/next.config.ts` (Next.js). La CSP est appliquée
 * en mode `Content-Security-Policy-Report-Only` dans une première phase pour
 * pouvoir observer les violations sans casser l'app. Une fois zéro violation
 * constatée pendant 1 à 2 semaines, basculer vers `Content-Security-Policy`
 * (enforcing) en renommant la clé du header dans `applySecurityHeaders`.
 *
 * Voir `frontend/private/lighthouse.md` section Tâche 6 pour le contexte.
 */

interface SecurityHeaderOptions {
  /** Active les permissivités nécessaires au dev server Vite (HMR WebSocket, eval). */
  isDev: boolean;
}

/**
 * Construit la valeur de la directive CSP. Toutes les directives proviennent
 * directement de la config Next.js historique. Les directives permissives
 * sont documentées ci-dessous pour qu'un futur agent ne les tightene pas
 * sans contexte.
 */
function buildCsp({ isDev }: SecurityHeaderOptions): string {
  // Why 'unsafe-inline' sur style-src : Radix UI (popovers, dialogs, dropdowns)
  // injecte des styles inline via JS pour le positionnement, Motion injecte
  // des `style="transform: ..."` inline pour les animations. Sans cette
  // directive, toute la couche UI animée casse.
  //
  // Why 'unsafe-inline' sur script-src : Vite HMR injecte des balises script
  // inline en dev. En prod, le bundle TanStack Start contient aussi un script
  // d'hydratation inline (state du router, dehydrated query state). Migration
  // possible vers une nonce-based CSP plus tard.
  //
  // Why 'unsafe-eval' sur script-src : Vite HMR utilise `eval` via la
  // WebSocket en dev. Lighthouse confirme qu'aucun `eval` n'est shippé dans
  // le bundle prod minifié, mais on garde la directive en prod en attendant
  // d'avoir validé sur production.
  //
  // Why https://image.tmdb.org et https://res.cloudinary.com sur img-src :
  // posters de films TMDB + avatars hébergés sur Cloudinary.
  //
  // Why data: sur img-src : blur placeholders et favicons inline.
  //
  // Why frame-ancestors 'none' : protection clickjacking. Bloque l'embedding
  // de Poplist dans des iframes tiers. À assouplir si on veut un widget
  // partageable.
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' https://image.tmdb.org https://res.cloudinary.com data:",
    "font-src 'self'",
    // En dev, Vite HMR ouvre une WebSocket sur ws:// (localhost). En prod,
    // toutes les connexions sortantes (API backend, fetch /auth/me, etc.)
    // passent par le proxy same-origin, donc 'self' suffit.
    isDev ? "connect-src 'self' ws: wss:" : "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  return directives.join('; ');
}

/**
 * Tous les headers de sécurité au même endroit. Appliqués via le request
 * middleware dans `src/start.ts`, uniquement sur les responses HTML.
 */
function buildSecurityHeaders(opts: SecurityHeaderOptions): Record<string, string> {
  return {
    // Phase 1 : Report-Only. Le browser log les violations sans bloquer.
    // Phase 2 (après validation prod) : renommer en 'Content-Security-Policy'.
    'Content-Security-Policy-Report-Only': buildCsp(opts),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  };
}

/**
 * Détermine si une response est du HTML SSR (donc concernée par la CSP).
 * Les server functions retournent du JSON, les server routes API peuvent
 * retourner n'importe quoi : on ne veut pas leur coller la CSP.
 */
function isHtmlResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type');
  if (!contentType) return false;
  return contentType.toLowerCase().includes('text/html');
}

/**
 * Applique les security headers sur une response. Mutation en place via
 * `Response.headers.set` : pas besoin de cloner la response, le streaming
 * SSR continue de fonctionner.
 *
 * À appeler depuis le request middleware global, après que le handler ait
 * produit la response.
 */
export function applySecurityHeaders(
  response: Response,
  opts: SecurityHeaderOptions,
): void {
  if (!isHtmlResponse(response)) return;
  const headers = buildSecurityHeaders(opts);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
}
