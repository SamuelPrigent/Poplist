/**
 * Setup global Vitest pour le backend.
 *
 * Ce fichier est listé dans `setupFiles` de vitest.config.ts.
 * Il est donc exécuté AVANT chaque suite de tests, et surtout AVANT
 * que `src/env.ts` ne soit importé par les tests (car env.ts parse
 * `process.env` au top-level, donc il faut que .env.test soit chargé
 * avant pour que les bonnes valeurs soient prises en compte).
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Charge .env.test (override les valeurs déjà présentes dans process.env)
config({
  path: fileURLToPath(new URL('../.env.test', import.meta.url)),
  override: true,
});

// SAFETY : refuse de tourner si on pointe ailleurs que sur poplist-db-test.
// Sans ça, un .env.test mal configuré pourrait DROP/TRUNCATE la DB de dev.
if (!process.env.DATABASE_URL?.includes('poplist-db-test')) {
  throw new Error(
    `🛑 SAFETY: DATABASE_URL doit pointer sur "poplist-db-test", reçu: ${process.env.DATABASE_URL}`
  );
}

// MSW pour intercepter les calls externes (TMDB, Cloudinary, Google OAuth).
// Importé après le check safety pour ne pas démarrer le serveur si la config est mauvaise.
const { server } = await import('./helpers/mock-external.js');

beforeAll(() => {
  // `onUnhandledRequest: 'error'` garantit qu'aucun appel HTTP externe non mocké ne passe
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
