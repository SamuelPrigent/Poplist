/**
 * Serveur backend en mode TEST pour les e2e Playwright.
 *
 * Différences avec `src/index.ts` :
 * - Charge `.env.test` AVANT toute import qui touche `env.ts`
 * - Démarre MSW pour intercepter les calls externes (TMDB, Cloudinary, Google)
 * - Safety check : refuse de démarrer si DATABASE_URL ne pointe pas sur poplist-db-test
 *
 * Le frontend Playwright pointe vers ce serveur (port 3457 par défaut, via .env.test).
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

// 1. Charger .env.test AVANT tout
config({
  path: fileURLToPath(new URL('../.env.test', import.meta.url)),
  override: true,
});

// 2. Safety check
if (!process.env.DATABASE_URL?.includes('poplist-db-test')) {
  console.error(
    `🛑 SAFETY: DATABASE_URL doit pointer sur "poplist-db-test", reçu: ${process.env.DATABASE_URL}`
  );
  process.exit(1);
}

// 3. Démarrer MSW (intercepte fetch global de Node)
//    'warn' au lieu de 'bypass' pour repérer les endpoints TMDB non mockés
const { server } = await import('./helpers/mock-external.js');
server.listen({
  onUnhandledRequest: req => {
    const url = new URL(req.url);
    // Ignore les calls vers le backend lui-même
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return;
    console.warn(`[MSW unhandled] ${req.method} ${req.url}`);
  },
});

// 4. Démarrer le serveur Hono (imports tardifs pour que env.ts lise les bonnes valeurs)
const { serve } = await import('@hono/node-server');
const { sql } = await import('drizzle-orm');
const appModule = await import('../src/app.js');
const envModule = await import('../src/env.js');
const dbModule = await import('../src/db/index.js');
const { resetDb } = await import('./helpers/db-reset.js');

const app = appModule.default;
const env = envModule.env;
const { db, client } = dbModule;

// 5. Ajouter les endpoints de test (seulement en mode test)
//    /_test/reset : truncate toutes les tables (utilisé par Playwright entre tests)
//    /_test/seed/* : create test data (optionnel)
app.post('/_test/reset', async c => {
  await resetDb();
  return c.json({ status: 'reset' });
});

async function main() {
  await db.execute(sql`SELECT 1`);

  const dbUrl = new URL(env.DATABASE_URL);
  console.log(`[test-server] Connected to ${dbUrl.pathname.slice(1)}@${dbUrl.hostname}`);
  console.log('[test-server] MSW: TMDB / Cloudinary / Google OAuth interceptés');

  serve({
    fetch: app.fetch,
    port: env.PORT,
  });

  console.log(`[test-server] 🚀 listening on http://localhost:${env.PORT}`);

  const shutdown = async () => {
    console.log('[test-server] shutting down...');
    server.close();
    await client.end();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch(err => {
  console.error('[test-server] failed to start:', err);
  process.exit(1);
});
