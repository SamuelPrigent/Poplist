/**
 * Transport injectable pour le SDK généré par Kubb.
 *
 * Les fonctions client générées (`shared/src/generated/client/*`) importent le
 * client par défaut ET les types depuis ce module (via `client.importPath` dans
 * kubb.config.ts). Le contrat de types (`RequestConfig`/`ResponseConfig`/
 * `Client`/`ResponseErrorConfig`) reproduit celui du client fetch de Kubb.
 *
 * Le HTTP réel n'est PAS implémenté ici : chaque app enregistre son propre
 * transport au démarrage via `setApiTransport()`.
 *   - Web  : délègue à `apiFetch` (cookie, refresh 401, baseURL SSR vs /api).
 *   - Mobile (phase 4) : délègue à son `request` (Bearer token SecureStore).
 *
 * Ainsi les hooks générés sont 100 % partagés ; seule la couche transport
 * diffère par plateforme.
 */

export type RequestConfig<TData = unknown> = {
  baseURL?: string;
  url?: string;
  method?: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD';
  params?: unknown;
  data?: TData | FormData;
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
  signal?: AbortSignal;
  headers?: [string, string][] | Record<string, string>;
  credentials?: 'omit' | 'same-origin' | 'include';
};

export type ResponseConfig<TData = unknown> = {
  data: TData;
  status: number;
  statusText: string;
  headers: Headers;
};

export type ResponseErrorConfig<TError = unknown> = TError;

export type Client = <TResponseData, _TError = unknown, TRequestData = unknown>(
  config: RequestConfig<TRequestData>,
) => Promise<ResponseConfig<TResponseData>>;

let transport: Client | null = null;

/**
 * Enregistre le transport HTTP concret. À appeler une fois au démarrage de
 * chaque app, avant tout appel de hook/loader généré.
 */
export function setApiTransport(fn: Client): void {
  transport = fn;
}

const client: Client = (config) => {
  if (!transport) {
    throw new Error(
      '[@poplist/shared] Aucun transport enregistré pour le SDK généré. ' +
        "Appelle setApiTransport() au démarrage de l'app " +
        '(web : frontend/src/api/kubb-transport.ts).',
    );
  }
  return transport(config);
};

export default client;
