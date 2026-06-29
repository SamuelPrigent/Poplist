import type { APIRequestContext, BrowserContext, Page } from '@playwright/test';
import { FRONTEND_BASE } from './config';

/**
 * Helpers d'authentification programmatique pour e2e.
 *
 * On passe par le proxy Vite `/api/*` (front de test) plutôt que d'appeler
 * directement le backend. Ainsi les cookies sont posés sur le domaine du
 * frontend → utilisables ensuite par la page.
 */

export interface TestUser {
  email: string;
  password: string;
}

let counter = 0;

export function freshUser(prefix = 'e2e'): TestUser {
  counter++;
  return {
    email: `${prefix}-${counter}-${Date.now()}@poplist.test`,
    password: 'TestPass123!',
  };
}

/**
 * Crée un user via l'API et installe les cookies dans le browser context.
 * À appeler dans un `beforeEach` ou en début de test avant le premier `goto`.
 */
export async function signupAndLogin(
  context: BrowserContext,
  user: TestUser = freshUser()
): Promise<TestUser> {
  const res = await context.request.post(`${FRONTEND_BASE}/api/auth/signup`, {
    data: { email: user.email, password: user.password },
    failOnStatusCode: true,
  });
  // request.post() via context propage automatiquement les cookies dans le contexte browser
  const setCookies = res.headers()['set-cookie'];
  if (!setCookies) throw new Error('signupAndLogin: backend did not set cookies');
  return user;
}

/**
 * Login d'un user existant (assume qu'il a déjà été créé via DB seed ou signup).
 */
export async function loginViaApi(
  context: BrowserContext,
  user: TestUser
): Promise<void> {
  await context.request.post(`${FRONTEND_BASE}/api/auth/login`, {
    data: { email: user.email, password: user.password },
    failOnStatusCode: true,
  });
}

/**
 * Logout via API (clear cookies côté backend + browser).
 */
export async function logoutViaApi(context: BrowserContext): Promise<void> {
  await context.request.post(`${FRONTEND_BASE}/api/auth/logout`, {
    data: {},
    failOnStatusCode: false,
  });
  await context.clearCookies();
}

/**
 * Récupère le user authentifié actuel (ou null si pas connecté).
 *
 * IMPORTANT : passer `context.request`, PAS le `request` fixture Playwright.
 * Le `request` fixture est isolé du browser context → n'a pas les cookies posés
 * par signupAndLogin → retourne toujours 401.
 */
export async function getCurrentUser(request: APIRequestContext) {
  const res = await request.get(`${FRONTEND_BASE}/api/auth/me`);
  if (res.status() === 401) return null;
  if (!res.ok()) throw new Error(`getCurrentUser failed: ${res.status()}`);
  const body = (await res.json()) as { user: { id: string; email: string; username: string } };
  return body.user;
}

/**
 * Wait pour que l'UI ait fini de charger l'état auth.
 * Utile après un login programmatique avant d'interagir avec la page.
 */
export async function waitAuthReady(page: Page): Promise<void> {
  await page.waitForFunction(
    () => !document.body.classList.contains('auth-loading'),
    { timeout: 5_000 }
  ).catch(() => {
    // Si la classe n'existe pas, on assume que c'est OK
  });
}
