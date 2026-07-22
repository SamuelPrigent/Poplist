import { FRONTEND_BASE } from './helpers/config';

/**
 * Garde-fou AVANT tout test : vérifie que le proxy `/api` du front de test
 * (port 3005) atteint bien le BACKEND DE TEST (DB poplist-db-test) et pas le
 * backend de dev.
 *
 * Incident vécu : un serveur front résiduel sur 3005, lancé sans l'env de test
 * (`VITE_BACKEND_URL`), proxiait vers le backend DEV (3456) ; avec
 * `reuseExistingServer: true`, Playwright l'a réutilisé et les tests ont écrit
 * dans la base de DEV. La sonde `/_test/health` n'existe que sur le serveur de
 * test : si elle ne répond pas via le proxy, on refuse de lancer les tests.
 */
export default async function globalSetup() {
  const url = `${FRONTEND_BASE}/api/_test/health`;
  let body: { testServer?: boolean; db?: string } | null = null;
  try {
    const res = await fetch(url);
    if (res.ok) body = (await res.json()) as { testServer?: boolean; db?: string };
  } catch {
    // serveur front pas joignable → Playwright le signalera de toute façon
  }

  if (!body?.testServer || !/-test$/.test(body.db ?? '')) {
    throw new Error(
      `⛔ GARDE-FOU E2E : le proxy /api du front de test (${FRONTEND_BASE}) ` +
        `n'atteint PAS le backend de test (sonde /_test/health → ` +
        `${body ? JSON.stringify(body) : 'échec/404'}). ` +
        `Un serveur résiduel sans l'env de test tourne probablement sur ce port ` +
        `et proxie vers le backend de DEV (risque d'écrire dans la DB de dev !). ` +
        `Remède : tuer les ports 3005 et 4005 (lsof -ti tcp:3005 | xargs kill) ` +
        `puis relancer — Playwright redémarrera la stack de test propre.`,
    );
  }
}
