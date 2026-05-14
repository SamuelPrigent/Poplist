import type { Page } from '@playwright/test';

/**
 * Patterns d'erreurs console autorisées (= ne fail pas le test).
 * On les autorise car elles sont attendues dans le flow normal :
 * - 401 sur /auth/me quand le user n'est pas connecté (premier load)
 * - 401 sur /auth/refresh quand pas de cookie (premier load)
 * - logs informationnels du SDK auth
 */
const ALLOWED_PATTERNS: RegExp[] = [
  // Le frontend appelle /auth/me et /auth/refresh au démarrage : si le user
  // n'est pas connecté, ces endpoints retournent 401. Le message exact varie
  // selon le navigateur ("Failed to load resource: ... 401 (Unauthorized)").
  /Failed to load resource.*401/,
  /\/api\/auth\/me.*401/,
  /\/api\/auth\/refresh.*401/,
  /Access token expired/,
  /Refresh failed/,
  /Auto-logout/,
  /\[HMR\]/,
  /Download the React DevTools/,
  // `TypeError: Failed to fetch` arrive quand le backend test est killed en fin de test
  // (concurrently SIGKILL) alors qu'un fetch frontend est en cours.
  /TypeError: Failed to fetch/,
  /NetworkError when attempting to fetch resource/,
];

export interface ConsoleTracker {
  getErrors: () => string[];
  assertNoErrors: () => void;
  setExtraAllowed: (patterns: RegExp[]) => void;
}

/**
 * Attache un tracker d'erreurs console à une `page`. À appeler AVANT
 * la première navigation pour ne pas rater les erreurs initiales.
 */
export function setupConsoleErrorTracking(page: Page): ConsoleTracker {
  const errors: string[] = [];
  let extraAllowed: RegExp[] = [];

  const isAllowed = (text: string) =>
    ALLOWED_PATTERNS.some(re => re.test(text)) || extraAllowed.some(re => re.test(text));

  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (isAllowed(text)) return;
    errors.push(`[console.error] ${text}`);
  });

  page.on('pageerror', err => {
    if (isAllowed(err.message)) return;
    errors.push(`[pageerror] ${err.message}`);
  });

  // Aussi les requêtes réseau qui échouent (status >= 500 = bug back)
  page.on('response', async res => {
    if (res.status() < 500) return;
    const url = res.url();
    if (isAllowed(url)) return;
    errors.push(`[network ${res.status()}] ${res.request().method()} ${url}`);
  });

  return {
    getErrors: () => [...errors],
    assertNoErrors: () => {
      if (errors.length > 0) {
        throw new Error(`Console / network errors:\n  - ${errors.join('\n  - ')}`);
      }
    },
    setExtraAllowed: patterns => {
      extraAllowed = patterns;
    },
  };
}
