/**
 * Enregistre le transport HTTP du SDK généré par Kubb (côté mobile).
 *
 * Importé pour effet de bord par `app/_layout.tsx`, donc évalué avant le
 * premier rendu. Sans lui, la moindre fonction générée jette
 * « Aucun transport enregistré pour le SDK généré » — c'est ce qui provoquait
 * l'écran blanc sur `/lists/[id]` dès que la section « Recommandations »
 * (premier consommateur d'un hook généré côté mobile) se montait.
 *
 * On délègue à `request()` : token Bearer depuis SecureStore, refresh 401 et
 * base URL sont ainsi partagés avec le reste de l'app.
 */
import { request } from './api-client';
import { setApiTransport, type Client } from '@poplist/shared/client-runtime';

/** Sérialise les query params du SDK (`params`) en chaîne d'URL. */
function withQuery(url: string, params: unknown): string {
  if (!params || typeof params !== 'object') return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;
    search.append(key, String(value));
  }
  const qs = search.toString();
  if (!qs) return url;
  return url.includes('?') ? `${url}&${qs}` : `${url}?${qs}`;
}

// Cast en `Client` à la frontière : le transport efface le type de réponse à
// runtime (`request` renvoie le JSON parsé quel que soit le type attendu par
// l'appelant). Même contrat que les clients par défaut de Kubb, et que le
// transport web.
const transport = (async (config) => {
  const data = await request<unknown>(withQuery(config.url ?? '', config.params), {
    method: config.method,
    body: config.data,
    headers: config.headers as Record<string, string> | undefined,
  });

  // `request` renvoie déjà le JSON parsé (throw-on-error). On reconstruit
  // l'enveloppe attendue par le SDK ; seul `res.data` est consommé.
  return { data, status: 200, statusText: 'OK', headers: new Headers() };
}) as Client;

setApiTransport(transport);
