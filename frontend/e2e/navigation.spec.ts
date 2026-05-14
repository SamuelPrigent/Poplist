import { expect, test } from '@playwright/test';
import { setupConsoleErrorTracking } from './helpers/console-errors';
import { signupAndLogin, freshUser } from './helpers/auth';
import { resetDb } from './helpers/db';

/**
 * Tests de navigation : visite chaque page principale, vérifie qu'elle charge
 * sans erreurs console (hors patterns autorisés) et que la structure HTML de base
 * est rendue.
 *
 * Pages testées :
 * - Publiques : /, /home, /explore, /lists, /categories, /users, /privacy, /local/lists
 * - Auth requise : /account, /account/lists
 */

const PUBLIC_PAGES = [
  '/',
  '/home',
  '/explore',
  '/lists',
  '/categories',
  '/users',
  '/privacy',
  '/local/lists',
];

const AUTH_PAGES = ['/account', '/account/lists'];

test.describe('Navigation publique (non connecté)', () => {
  test.beforeEach(async ({ request, context }) => {
    await resetDb(request);
    await context.clearCookies();
  });

  for (const path of PUBLIC_PAGES) {
    test(`GET ${path} charge sans erreurs console`, async ({ page }) => {
      const tracker = setupConsoleErrorTracking(page);

      const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(res?.status() ?? 0, `${path} HTTP status`).toBeLessThan(400);

      // Vérifie que le body est rendu
      await expect(page.locator('body')).toBeVisible();
      await page.waitForTimeout(500);

      tracker.assertNoErrors();
    });
  }
});

test.describe('Navigation authentifiée', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  for (const path of AUTH_PAGES) {
    test(`GET ${path} (connecté) charge sans erreurs console`, async ({
      page,
      context,
    }) => {
      const tracker = setupConsoleErrorTracking(page);
      await signupAndLogin(context, freshUser('nav'));

      const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(res?.status() ?? 0, `${path} HTTP status`).toBeLessThan(400);

      await expect(page.locator('body')).toBeVisible();
      await page.waitForTimeout(800);

      tracker.assertNoErrors();
    });
  }
});

test.describe('Navigation entre pages (SPA)', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('navigation /home → /explore via lien (SPA, pas de full document reload)', async ({
    page,
  }) => {
    const tracker = setupConsoleErrorTracking(page);

    // Compte uniquement les vrais loads de document (pas les fragments SPA)
    let documentLoads = 0;
    page.on('load', () => {
      documentLoads++;
    });

    await page.goto('/home', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const loadsAfterFirst = documentLoads;

    const exploreLink = page.getByRole('link', { name: /explorer|explore/i }).first();
    if (await exploreLink.isVisible({ timeout: 1500 }).catch(() => false)) {
      await exploreLink.click();
      await page.waitForURL(/\/explore/, { timeout: 5_000 });
      await page.waitForTimeout(500);

      // SPA = pas de nouveau "load" event sur le document
      expect(documentLoads).toBe(loadsAfterFirst);
    } else {
      test.skip(true, 'Pas de lien Explore visible — navigation testable autrement');
    }

    tracker.assertNoErrors();
  });
});
