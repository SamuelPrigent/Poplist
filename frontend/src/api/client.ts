/**
 * Transport HTTP unique pour le SDK frontend.
 * - Wrap fetch avec credentials, refresh 401, auto-logout sur échec refresh.
 * - Throw on error : retourne directement le payload typé si OK, lève sinon.
 */

// Browser : `/api` → proxy Vite (dev) ou rewrite vercel.json (prod) qui forward
// vers le backend en stripant `/api`.
// SSR (Node) : pas de proxy ; on appelle l'URL absolue du backend directement.
// Le SSR n'a pas de cookies user → les endpoints protégés retourneront 401,
// puis le client refetch après hydration avec les vrais cookies.
//
// On lit la var via process.env ET import.meta.env :
// - process.env : lu au runtime, fiable sur Vercel Function (toutes les env vars
//   du projet sont propagées au runtime).
// - import.meta.env : inliné au build par Vite, plus rapide mais peut être undefined
//   si la var n'était pas dispo au moment du build.
//
// On combine les deux comme fallback, et si rien → localhost (dev only).
const SSR_BACKEND_URL =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (typeof process !== 'undefined' && (process as any)?.env?.VITE_BACKEND_URL) ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:3456';

const API_BASE = typeof window === 'undefined' ? SSR_BACKEND_URL : '/api';

// Version de build, injectée dans chaque requête API via `_v=...` pour
// invalider le cache HTTP navigateur à chaque deploy (en particulier les
// 404 négatifs cached pour les nouvelles routes qui n'existaient pas avant).
// Source : `vite.config.ts` define → priorité VERCEL_GIT_COMMIT_SHA > .env > timestamp.
// Le `_v` est silencieusement ignoré par les validators zod backend (mode strip).
export const BUILD_VERSION =
  (import.meta.env.VITE_BUILD_VERSION as string | undefined) ?? 'dev';

// ========================================
// Auth refresh + logout handler
// ========================================

let onAuthError: (() => void) | null = null;

export function setAuthErrorHandler(handler: () => void) {
  onAuthError = handler;
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        console.log('✅ Access token refreshed successfully');
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ========================================
// apiFetch — fetch wrapper typé avec throw-on-error et refresh 401
// ========================================

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

export async function apiFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const { body, query, headers, ...rest } = opts;

  // Construire l'URL avec query string si fournie
  let url = `${API_BASE}${path}`;
  const params = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params.set(key, String(value));
    }
  }
  // Cache buster : URL différente à chaque deploy → cache HTTP navigateur
  // invalidé sans toucher le cache backend Redis (qui basé sur les params
  // envoyés à TMDB, pas sur ceux reçus du frontend).
  params.set('_v', BUILD_VERSION);
  const qs = params.toString();
  if (qs) url += `?${qs}`;

  const init: RequestInit = {
    ...rest,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(headers ?? {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  const doFetch = async () => fetch(url, init);

  let response = await doFetch();

  // Auto-refresh sur 401, hors endpoints refresh/logout pour éviter les loops
  const shouldAttemptRefresh =
    response.status === 401 &&
    !path.endsWith('/auth/refresh') &&
    !path.endsWith('/auth/logout');

  if (shouldAttemptRefresh) {
    console.log('🔄 Access token expired, attempting refresh...');
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      console.log('🔄 Retrying original request with new token...');
      response = await doFetch();
    } else {
      console.log('🚪 Refresh failed, triggering logout...');
      onAuthError?.();
    }
  }

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ error: `Request failed: ${response.status}` }));
    throw new Error(
      (errorBody as { error?: string }).error || `Request failed: ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}
