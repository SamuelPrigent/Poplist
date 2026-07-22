import { expect, test } from '@playwright/test';
import { freshUser, loginWithClientState, signupAndLogin, waitHydrated } from './helpers/auth';
import { FRONTEND_BASE } from './helpers/config';
import { resetDb } from './helpers/db';

/**
 * Tests e2e du cache TanStack Query après la migration vers les query keys
 * générées par Kubb (helpers `frontend/src/api/invalidations.ts`).
 *
 * Ces trois scénarios couvrent les trois mécanismes dont le mode d'échec est
 * SILENCIEUX (ni erreur TS, ni crash : juste un écran périmé) :
 *   1. la purge du cache au logout (predicate par URL d'endpoint) ;
 *   2. l'invalidation après écriture (création → refetch de « mes listes ») ;
 *   3. l'update optimiste (l'UI reflète le changement AVANT la réponse serveur,
 *      rendue observable en retardant artificiellement la mutation).
 */

async function createWatchlistViaApi(
  context: import('@playwright/test').BrowserContext,
  name: string,
) {
  const res = await context.request.post(`${FRONTEND_BASE}/api/watchlists`, {
    data: { name, description: 'e2e', genres: [] },
  });
  if (!res.ok()) {
    throw new Error(`createWatchlist failed: ${res.status()} ${await res.text()}`);
  }
  return (await res.json()) as { watchlist: { id: string; name: string } };
}

test.describe('Cache TanStack Query (keys générées + helpers invalidations)', () => {
  test.beforeEach(async ({ request }) => {
    await resetDb(request);
  });

  test('logout : purge du cache — « mes listes » disparaît sans reload, aucun refetch', async ({
    page,
    context,
  }) => {
    const { username } = await loginWithClientState(context);
    await createWatchlistViaApi(context, 'Ma liste privée e2e');

    // Connecté, la liste apparaît DEUX fois sur la home : dans « Bibliothèque »
    // (query mine, auth-scopée) ET dans « Listes populaires » (publicFeatured,
    // vue publique — featured liste toutes les watchlists récentes).
    await page.goto('/home', { waitUntil: 'domcontentloaded' });
    await waitHydrated(page, username);
    await expect(page.getByText('Ma liste privée e2e')).toHaveCount(2, {
      timeout: 10_000,
    });

    // À partir du logout : plus AUCUNE requête auth-scopée ne doit partir.
    // (La purge utilise `removeQueries` précisément pour éviter le refetch
    // /auth/me → 401 → auto-logout en boucle.)
    const forbiddenRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/watchlists/mine') || url.includes('/auth/me')) {
        forbiddenRequests.push(url);
      }
    });

    await page.getByLabel('Se déconnecter').click();

    // Sémantique exacte du predicate de purge : la vue AUTH-SCOPÉE
    // (Bibliothèque/mine) disparaît sans navigation manuelle, la vue PUBLIQUE
    // (populaires/featured) reste en cache : 2 occurrences → 1.
    await expect(page.getByText('Ma liste privée e2e')).toHaveCount(1, {
      timeout: 10_000,
    });

    // Laisser le temps à une éventuelle boucle de refetch de se manifester.
    await page.waitForTimeout(1_500);
    expect(
      forbiddenRequests,
      'Aucun refetch /watchlists/mine ni /auth/me ne doit partir après logout',
    ).toEqual([]);
  });

  test("invalidation après écriture : créer une liste via l'UI la fait apparaître sans reload", async ({
    page,
    context,
  }) => {
    const { username } = await loginWithClientState(context);

    await page.goto('/account/lists', { waitUntil: 'domcontentloaded' });
    await waitHydrated(page, username);

    // Ouvrir le dialog de création et soumettre.
    await page.getByRole('button', { name: 'Nouvelle liste' }).first().click();
    await page.getByPlaceholder('Ma liste').fill('Liste invalidation e2e');
    await page.getByRole('button', { name: 'Créer', exact: true }).click();

    // La nouvelle carte apparaît sans reload : création → helper d'invalidation
    // de « mes listes » (keys générées) → refetch → re-render.
    await expect(page.getByText('Liste invalidation e2e').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('update optimiste : le bouton save bascule AVANT la réponse serveur (mutation ralentie)', async ({
    page,
    context,
  }) => {
    // User A possède une liste ; user B (non-owner) va la sauvegarder.
    await signupAndLogin(context, freshUser('owner'));
    const { watchlist } = await createWatchlistViaApi(context, 'Liste à sauvegarder');
    await context.request.post(`${FRONTEND_BASE}/api/auth/logout`, { data: {} });
    await context.clearCookies();
    const { username } = await loginWithClientState(context, freshUser('saver'));

    // Retarder la mutation de 2 s : la fenêtre optimiste devient observable
    // de façon déterministe (en local le backend répond en ~10 ms).
    const MUTATION_DELAY_MS = 2_000;
    let mutationResolvedAt = 0;
    await page.route('**/like-and-save**', async (route) => {
      await new Promise((r) => setTimeout(r, MUTATION_DELAY_MS));
      mutationResolvedAt = Date.now();
      await route.continue();
    });

    await page.goto(`/lists/${watchlist.id}`, { waitUntil: 'domcontentloaded' });
    // Le bouton save est rendu par le SSR (auth via cookie dans le route
    // context) : attendre l'hydratation, sinon le clic part dans le vide.
    await waitHydrated(page, username);
    const saveButton = page.getByTitle('Ajouter à la bibliothèque');
    await expect(saveButton).toBeVisible({ timeout: 10_000 });

    const clickedAt = Date.now();
    await saveButton.click();

    // L'état visuel bascule IMMÉDIATEMENT (setQueryData optimiste), bien avant
    // que la mutation (retardée de 2 s) ne réponde.
    await expect(page.getByTitle('Retirer de la bibliothèque')).toBeVisible({
      timeout: 1_000,
    });
    expect(mutationResolvedAt === 0 || mutationResolvedAt - clickedAt >= MUTATION_DELAY_MS).toBe(
      true,
    );

    // Et l'état persiste une fois la vraie réponse arrivée (pas de rollback).
    await page.waitForResponse((res) => res.url().includes('/like-and-save'));
    await expect(page.getByTitle('Retirer de la bibliothèque')).toBeVisible();
  });
});
