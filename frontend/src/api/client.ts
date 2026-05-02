/**
 * Transport HTTP unique pour le SDK frontend.
 * - Wrap fetch avec credentials, refresh 401, auto-logout sur échec refresh.
 * - Throw on error : retourne directement le payload typé si OK, lève sinon.
 */

const API_BASE = '/api';

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
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

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
