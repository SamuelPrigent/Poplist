import { expect, test } from '@playwright/test';
import { loginWithClientState, waitHydrated } from './helpers/auth';
import { resetDb } from './helpers/db';

/**
 * Protection CSRF des server functions (`createCsrfMiddleware` dans
 * `src/start.ts`). Le middleware filtre sur le préfixe `/_serverFn/`, donc un
 * id inexistant suffit pour les cas rejetés (refusés avant la résolution de la
 * fonction). Le cas accepté passe par un vrai appel du navigateur.
 */

test.beforeEach(async ({ request }) => {
  await resetDb(request);
});

const SERVER_FN_URL = '/_serverFn/csrf-probe';

test('server function : requête cross-site rejetée (Sec-Fetch-Site)', async ({ request }) => {
  const res = await request.post(SERVER_FN_URL, {
    headers: { 'Sec-Fetch-Site': 'cross-site', 'x-tsr-serverFn': 'true' },
  });
  expect(res.status()).toBe(403);
});

test('server function : requête cross-site rejetée (Origin)', async ({ request }) => {
  const res = await request.post(SERVER_FN_URL, {
    headers: { Origin: 'https://evil.example', 'x-tsr-serverFn': 'true' },
  });
  expect(res.status()).toBe(403);
});

test('server function : un vrai appel same-origin du navigateur passe', async ({ page, context }) => {
  // Navigation SPA connecté vers /home : le loader appelle la server fn
  // `getMineForSSR` en HTTP depuis le navigateur (vrais en-têtes Sec-Fetch-*).
  // Écoute posée dès le départ : le preload `intent` du router peut lancer le
  // loader avant le clic.
  const statuses: number[] = [];
  page.on('response', (res) => {
    if (res.url().includes('/_serverFn/')) statuses.push(res.status());
  });
  const { username } = await loginWithClientState(context);
  await page.goto('/explore', { waitUntil: 'domcontentloaded' });
  await waitHydrated(page, username);

  await page.getByRole('link', { name: 'Accueil' }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect.poll(() => statuses.length).toBeGreaterThan(0);
  expect(statuses.every((s) => s === 200), `statuts : ${statuses.join(', ')}`).toBe(true);
});

test('page SSR : pas concernée par le CSRF', async ({ request }) => {
  const res = await request.get('/', { headers: { 'Sec-Fetch-Site': 'cross-site' } });
  expect(res.status()).toBeLessThan(400);
});
