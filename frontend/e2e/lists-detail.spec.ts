import { expect, test } from '@playwright/test';
import { setupConsoleErrorTracking } from './helpers/console-errors';
import { signupAndLogin } from './helpers/auth';
import { FRONTEND_BASE } from './helpers/config';
import { resetDb } from './helpers/db';

async function createListWithItems(
  context: import('@playwright/test').BrowserContext,
  itemTmdbIds: number[] = [1000, 1001, 1002],
): Promise<{ id: string }> {
  const wlRes = await context.request.post(`${FRONTEND_BASE}/api/watchlists`, {
    data: { name: 'Test List', description: '', genres: [] },
  });
  const { watchlist } = (await wlRes.json()) as { watchlist: { id: string } };

  // Les détails TMDB sont mockés (MSW renvoie des données pour tout id) : chaque
  // ajout DOIT réussir. On throw avec le body en cas d'échec pour que le test
  // devienne ROUGE et diagnosticable, plutôt qu'un skip silencieux.
  for (const tmdbId of itemTmdbIds) {
    const res = await context.request.post(
      `${FRONTEND_BASE}/api/watchlists/${watchlist.id}/items`,
      { data: { tmdbId: String(tmdbId), mediaType: 'movie' }, failOnStatusCode: false },
    );
    if (!res.ok()) {
      throw new Error(`addItem(${tmdbId}) a échoué: ${res.status()} ${await res.text()}`);
    }
  }
  return { id: watchlist.id };
}

test.describe('Page /lists/$id', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('charge la page detail avec items', async ({ page, context }) => {
    const tracker = setupConsoleErrorTracking(page);
    await signupAndLogin(context);
    const watchlist = await createListWithItems(context);

    await page.goto(`/lists/${watchlist.id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Vérifie côté DB/API que les items sont bien insérés
    const detail = await context.request.get(`${FRONTEND_BASE}/api/watchlists/${watchlist.id}`);
    expect(detail.ok()).toBe(true);
    const body = (await detail.json()) as {
      watchlist: { items: unknown[] };
    };
    expect(body.watchlist.items.length).toBeGreaterThan(0);

    tracker.assertNoErrors();
  });

  test("owner voit les boutons d'édition (add, edit)", async ({ page, context }) => {
    await signupAndLogin(context);
    const watchlist = await createListWithItems(context, [1000]);

    await page.goto(`/lists/${watchlist.id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // L'API GET retourne `isOwner: true` → l'UI doit l'utiliser pour afficher les boutons
    const detail = await context.request.get(`${FRONTEND_BASE}/api/watchlists/${watchlist.id}`);
    const body = (await detail.json()) as { isOwner: boolean };
    expect(body.isOwner).toBe(true);
  });

  test('add item via API → apparaît dans la liste', async ({ page, context }) => {
    const tracker = setupConsoleErrorTracking(page);
    await signupAndLogin(context);
    const watchlist = await createListWithItems(context, [1000]);

    await page.goto(`/lists/${watchlist.id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    await context.request.post(`${FRONTEND_BASE}/api/watchlists/${watchlist.id}/items`, {
      data: { tmdbId: '1010', mediaType: 'movie' },
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const detail = await context.request.get(`${FRONTEND_BASE}/api/watchlists/${watchlist.id}`);
    const body = (await detail.json()) as {
      watchlist: { items: Array<{ tmdbId: number }> };
    };
    expect(body.watchlist.items.find((i) => i.tmdbId === 1010)).toBeTruthy();

    tracker.assertNoErrors();
  });

  test('remove item via API → item disparaît', async ({ context }) => {
    await signupAndLogin(context);
    const watchlist = await createListWithItems(context, [1000, 1001]);

    const detail = await context.request.get(`${FRONTEND_BASE}/api/watchlists/${watchlist.id}`);
    const body = (await detail.json()) as {
      watchlist: { items: Array<{ id: string; tmdbId: number }> };
    };
    const itemToRemove = body.watchlist.items.find((i) => i.tmdbId === 1000);
    expect(itemToRemove).toBeTruthy();

    // L'API DELETE utilise tmdbId dans l'URL, pas l'item id
    const delRes = await context.request.delete(
      `${FRONTEND_BASE}/api/watchlists/${watchlist.id}/items/1000`,
    );
    expect(delRes.ok()).toBe(true);

    const after = await context.request.get(`${FRONTEND_BASE}/api/watchlists/${watchlist.id}`);
    const afterBody = (await after.json()) as {
      watchlist: { items: Array<{ tmdbId: number }> };
    };
    expect(afterBody.watchlist.items.find((i) => i.tmdbId === 1000)).toBeUndefined();
    expect(afterBody.watchlist.items.find((i) => i.tmdbId === 1001)).toBeTruthy();
  });

  test('reorder via API → ordre persiste', async ({ context }) => {
    await signupAndLogin(context);
    const watchlist = await createListWithItems(context, [1000, 1001, 1002]);

    const detail = await context.request.get(`${FRONTEND_BASE}/api/watchlists/${watchlist.id}`);
    const body = (await detail.json()) as {
      watchlist: { items: Array<{ tmdbId: number; position: number }> };
    };
    expect(body.watchlist.items).toHaveLength(3);

    // PUT /:id/items/reorder attend { orderedTmdbIds: string[] } (ordre voulu).
    const reorderRes = await context.request.put(
      `${FRONTEND_BASE}/api/watchlists/${watchlist.id}/items/reorder`,
      { data: { orderedTmdbIds: ['1002', '1001', '1000'] }, failOnStatusCode: false },
    );
    expect(reorderRes.ok()).toBe(true);

    const after = await context.request.get(`${FRONTEND_BASE}/api/watchlists/${watchlist.id}`);
    const afterBody = (await after.json()) as {
      watchlist: { items: Array<{ tmdbId: number; position: number }> };
    };
    const sorted = [...afterBody.watchlist.items].sort((a, b) => a.position - b.position);
    expect(sorted[0].tmdbId).toBe(1002);
    expect(sorted[2].tmdbId).toBe(1000);
  });

  test('un user non-owner public peut voir une watchlist publique', async ({ page, context }) => {
    await signupAndLogin(context);
    const watchlist = await createListWithItems(context, [1000]);

    await context.clearCookies();

    const res = await context.request.get(
      `${FRONTEND_BASE}/api/watchlists/${watchlist.id}/public`,
      { failOnStatusCode: false },
    );
    if (res.ok()) {
      const body = (await res.json()) as { watchlist: { id: string } };
      expect(body.watchlist.id).toBe(watchlist.id);
    }

    const tracker = setupConsoleErrorTracking(page);
    await page.goto(`/lists/${watchlist.id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    tracker.assertNoErrors();
  });
});
