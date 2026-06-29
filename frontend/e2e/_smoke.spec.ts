import { expect, test } from '@playwright/test';
import { setupConsoleErrorTracking } from './helpers/console-errors';
import { resetDb } from './helpers/db';

/**
 * Smoke test e2e :
 * - reset DB
 * - charger /home et /explore sans erreur console (hors 401 attendus)
 *
 * Si ce test passe, toute l'orchestration tourne :
 * back-test (4005) + front-test (3005) + Playwright + MSW + DB reset.
 */

test.beforeEach(async ({ request }) => {
  await resetDb(request);
});

test('GET / charge sans erreurs console', async ({ page }) => {
  const tracker = setupConsoleErrorTracking(page);

  const res = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(res?.status() ?? 0).toBeLessThan(400);

  // Attente d'un élément structurant de la page
  await expect(page.locator('body')).toBeVisible();
  await page.waitForTimeout(500);

  tracker.assertNoErrors();
});

test('GET /home charge sans erreurs console', async ({ page }) => {
  const tracker = setupConsoleErrorTracking(page);

  const res = await page.goto('/home', { waitUntil: 'domcontentloaded' });
  expect(res?.status() ?? 0).toBeLessThan(400);

  await expect(page.locator('body')).toBeVisible();
  await page.waitForTimeout(500);

  tracker.assertNoErrors();
});

test('GET /explore charge sans erreurs console', async ({ page }) => {
  const tracker = setupConsoleErrorTracking(page);

  const res = await page.goto('/explore', { waitUntil: 'domcontentloaded' });
  expect(res?.status() ?? 0).toBeLessThan(400);

  await expect(page.locator('body')).toBeVisible();
  await page.waitForTimeout(500);

  tracker.assertNoErrors();
});
