import type { APIRequestContext } from '@playwright/test';

const BACKEND_URL = process.env.E2E_BACKEND_URL ?? 'http://localhost:3457';

/**
 * Truncate toutes les tables de poplist-db-test.
 * Endpoint disponible uniquement quand le backend est lancé via `npm run test:server`
 * (défini dans `backend/tests/server.ts`, pas dans la prod).
 */
export async function resetDb(request: APIRequestContext): Promise<void> {
  const res = await request.post(`${BACKEND_URL}/_test/reset`);
  if (!res.ok()) {
    throw new Error(
      `resetDb failed (${res.status()}): assure-toi que le backend tourne via "npm run test:server"`
    );
  }
}
