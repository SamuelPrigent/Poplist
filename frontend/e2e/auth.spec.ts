import { expect, test } from '@playwright/test';
import { setupConsoleErrorTracking } from './helpers/console-errors';
import { freshUser, getCurrentUser, logoutViaApi, signupAndLogin } from './helpers/auth';
import { FRONTEND_BASE } from './helpers/config';
import { resetDb } from './helpers/db';

/**
 * Tests e2e authentification.
 *
 * Stratégie : signup/login via API (plus rapide et stable que via UI),
 * puis assertions sur l'état UI (cookies posés, /auth/me retourne le user, etc.).
 *
 * Les tests via UI clic-clic sont marqués `test.skip` jusqu'à ce qu'on ait
 * des data-testid stables sur les composants AuthDrawer.
 */

test.describe('Auth', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('signup via API → user créé, cookies posés, /auth/me retourne le user', async ({
    page,
    context,
  }) => {
    const tracker = setupConsoleErrorTracking(page);
    const user = freshUser('signup');

    await signupAndLogin(context, user);

    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'accessToken')).toBeTruthy();
    expect(cookies.find((c) => c.name === 'refreshToken')).toBeTruthy();

    const me = await getCurrentUser(context.request);
    expect(me?.email).toBe(user.email);

    await page.goto('/account', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    tracker.assertNoErrors();
  });

  test("login via API d'un user existant → 200 + cookies posés", async ({ context }) => {
    const user = freshUser('relogin');

    await signupAndLogin(context, user);
    await logoutViaApi(context);

    const cookiesAfterLogout = await context.cookies();
    expect(cookiesAfterLogout.find((c) => c.name === 'accessToken' && c.value)).toBeFalsy();

    const loginRes = await context.request.post(`${FRONTEND_BASE}/api/auth/login`, {
      data: user,
    });
    expect(loginRes.status()).toBe(200);

    const me = await getCurrentUser(context.request);
    expect(me?.email).toBe(user.email);
  });

  test('login avec mauvais password → 401', async ({ context }) => {
    const user = freshUser('badpass');
    await signupAndLogin(context, user);
    await logoutViaApi(context);

    const res = await context.request.post(`${FRONTEND_BASE}/api/auth/login`, {
      data: { email: user.email, password: 'WrongPassword!!' },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
  });

  test('signup avec email déjà pris → 409', async ({ context }) => {
    const user = freshUser('dup');
    await signupAndLogin(context, user);

    const res = await context.request.post(`${FRONTEND_BASE}/api/auth/signup`, {
      data: user,
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(409);
  });

  test('logout efface les cookies et /auth/me retourne 401', async ({ context }) => {
    const user = freshUser('logout');
    await signupAndLogin(context, user);

    expect(await getCurrentUser(context.request)).toBeTruthy();

    await logoutViaApi(context);

    expect(await getCurrentUser(context.request)).toBeNull();
  });

  test("refresh token rotation : un appel /auth/refresh remplace l'ancien token", async ({
    context,
  }) => {
    const user = freshUser('refresh');
    await signupAndLogin(context, user);

    const cookiesBefore = await context.cookies();
    const refreshBefore = cookiesBefore.find((c) => c.name === 'refreshToken')?.value;
    expect(refreshBefore).toBeTruthy();

    const res = await context.request.post(`${FRONTEND_BASE}/api/auth/refresh`, {
      data: {},
    });
    expect(res.status()).toBe(200);

    const cookiesAfter = await context.cookies();
    const refreshAfter = cookiesAfter.find((c) => c.name === 'refreshToken')?.value;
    expect(refreshAfter).toBeTruthy();
    expect(refreshAfter).not.toBe(refreshBefore);
  });

  test('persistance auth après reload : cookies restent valides', async ({ page, context }) => {
    const tracker = setupConsoleErrorTracking(page);
    const user = freshUser('persist');
    await signupAndLogin(context, user);

    await page.goto('/account', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const me = await getCurrentUser(context.request);
    expect(me?.email).toBe(user.email);

    tracker.assertNoErrors();
  });

  test('logout depuis /account (page protégée) → redirige vers /', async ({ page, context }) => {
    const user = freshUser('logout-account');
    await signupAndLogin(context, user);
    const me = await getCurrentUser(context.request);
    if (!me) throw new Error('user attendu authentifié');

    // Le client gate /auth/me derrière le flag localStorage `poplist_auth` (posé
    // normalement par le login via l'UI). On le simule pour que la Navbar rende
    // l'état authentifié (bouton de déconnexion).
    await context.addInitScript((u) => {
      window.localStorage.setItem(
        'poplist_auth',
        JSON.stringify({ isAuthenticated: true, user: u })
      );
    }, me);

    await page.goto('/account', { waitUntil: 'domcontentloaded' });
    // Attendre que l'état authentifié soit résolu (username affiché dans la navbar)
    await expect(page.getByText(me.username)).toBeVisible();

    await page.getByRole('button', { name: 'Se déconnecter' }).click();

    // Doit être redirigé vers la landing publique '/'
    await page.waitForURL((url) => new URL(url).pathname === '/', { timeout: 5_000 });
    expect(new URL(page.url()).pathname).toBe('/');
  });

  // TODO (auth via UI) : les flux signup / login / logout sont déjà couverts via
  // API ci-dessus. À implémenter seulement si on veut attraper les régressions UI
  // du drawer (nécessite des data-testid stables sur AuthDrawer + le menu avatar) :
  //   - signup via le drawer
  //   - login via le drawer
  //   - logout via le menu avatar
});
