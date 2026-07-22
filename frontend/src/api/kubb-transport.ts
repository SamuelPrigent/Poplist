/**
 * Enregistre le transport HTTP du SDK généré par Kubb (côté web).
 *
 * Importé pour effet de bord par `router.tsx` → évalué avant tout loader/render,
 * en SSR comme côté client. Les fonctions client générées délèguent ici, donc à
 * `apiFetch` : on conserve credentials, refresh 401, et la baseURL SSR vs `/api`
 * sans rien réécrire.
 */
import { apiFetch } from './client';
import { setApiTransport, type Client } from '@poplist/shared/client-runtime';

// Cast en `Client` à la frontière : le transport efface le type de réponse à
// runtime (apiFetch renvoie le JSON parsé quel que soit le type attendu par
// l'appelant). C'est le même contrat que les clients par défaut de Kubb.
const transport = (async (config) => {
  const data = await apiFetch(config.url ?? '', {
    method: config.method,
    body: config.data,
    query: config.params as Record<string, string | number | boolean | undefined> | undefined,
    headers: config.headers as Record<string, string> | undefined,
    signal: config.signal,
  });

  // apiFetch renvoie déjà le JSON parsé (throw-on-error). On reconstruit
  // l'enveloppe attendue par le SDK Kubb ; seul `res.data` est consommé.
  return { data, status: 200, statusText: 'OK', headers: new Headers() };
}) as Client;

setApiTransport(transport);
