import { sql } from 'drizzle-orm';
import { db } from '../../src/db/index.js';

/**
 * Vide toutes les tables métier de la DB de test.
 * À appeler dans `beforeEach` des tests d'intégration.
 *
 * - TRUNCATE = vide la table (plus rapide que DELETE)
 * - RESTART IDENTITY = reset les sequences auto-increment (id repart à 1)
 * - CASCADE = supprime aussi les lignes liées par foreign keys
 */
export async function resetDb() {
  await db.execute(sql`
    TRUNCATE TABLE
      "watchlist_recommendations",
      "watchlist_items",
      "watchlist_collaborators",
      "watchlist_likes",
      "saved_watchlists",
      "user_watchlist_positions",
      "watchlists",
      "refresh_tokens",
      "users",
      "api_caches"
    RESTART IDENTITY CASCADE
  `);
}
