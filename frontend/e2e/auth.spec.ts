import { expect, test } from '@playwright/test';
import { setupConsoleErrorTracking } from './helpers/console-errors';
import { freshUser, getCurrentUser, logoutViaApi, signupAndLogin } from './helpers/auth';
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
    request,
  }) => {
    const tracker = setupConsoleErrorTracking(page);
    const user = freshUser('signup');

    await signupAndLogin(context, user);

    const cookies = await context.cookies();
    expect(cookies.find(c => c.name === 'accessToken')).toBeTruthy();
    expect(cookies.find(c => c.name === 'refreshToken')).toBeTruthy();

    const me = await getCurrentUser(context.request);
    expect(me?.email).toBe(user.email);

    await page.goto('/account', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    tracker.assertNoErrors();
  });

  test('login via API d\'un user existant → 200 + cookies posés', async ({
    context,
    request,
  }) => {
    const user = freshUser('relogin');

    await signupAndLogin(context, user);
    await logoutViaApi(context);

    const cookiesAfterLogout = await context.cookies();
    expect(cookiesAfterLogout.find(c => c.name === 'accessToken' && c.value)).toBeFalsy();

    const loginRes = await context.request.post('http://localhost:3002/api/auth/login', {
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

    const res = await context.request.post('http://localhost:3002/api/auth/login', {
      data: { email: user.email, password: 'WrongPassword!!' },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
  });

  test('signup avec email déjà pris → 409', async ({ context }) => {
    const user = freshUser('dup');
    await signupAndLogin(context, user);

    const res = await context.request.post('http://localhost:3002/api/auth/signup', {
      data: user,
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(409);
  });

  test('logout efface les cookies et /auth/me retourne 401', async ({
    context,
    request,
  }) => {
    const user = freshUser('logout');
    await signupAndLogin(context, user);

    expect(await getCurrentUser(context.request)).toBeTruthy();

    await logoutViaApi(context);

    expect(await getCurrentUser(context.request)).toBeNull();
  });

  test('refresh token rotation : un appel /auth/refresh remplace l\'ancien token', async ({
    context,
  }) => {
    const user = freshUser('refresh');
    await signupAndLogin(context, user);

    const cookiesBefore = await context.cookies();
    const refreshBefore = cookiesBefore.find(c => c.name === 'refreshToken')?.value;
    expect(refreshBefore).toBeTruthy();

    const res = await context.request.post('http://localhost:3002/api/auth/refresh', {
      data: {},
    });
    expect(res.status()).toBe(200);

    const cookiesAfter = await context.cookies();
    const refreshAfter = cookiesAfter.find(c => c.name === 'refreshToken')?.value;
    expect(refreshAfter).toBeTruthy();
    expect(refreshAfter).not.toBe(refreshBefore);
  });

  test('persistance auth après reload : cookies restent valides', async ({
    page,
    context,
    request,
  }) => {
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

  test.describe('Auth via UI', () => {
    test.skip('TODO: signup via le drawer auth (besoin de data-testid stables)', () => {});
    test.skip('TODO: login via le drawer auth (besoin de data-testid stables)', () => {});
    test.skip('TODO: logout via le menu avatar (besoin de data-testid stables)', () => {});
  });
});
