import { serve } from '@hono/node-server';
import { sql } from 'drizzle-orm';
import app from './app.js';
import { env } from './env.js';
import { db, client } from './db/index.js';

async function main() {
  await db.execute(sql`SELECT 1`);

  // Parse DATABASE_URL to display connection info
  const dbUrl = new URL(env.DATABASE_URL);
  const dbName = dbUrl.pathname.slice(1);
  const dbHost = dbUrl.hostname;
  const isLocal = dbHost === 'localhost' || dbHost === '127.0.0.1';
  console.log(`Connected to PostgreSQL (${dbName}@${dbHost} (${isLocal ? 'local' : 'remote'}))`);

  serve({
    fetch: app.fetch,
    port: env.PORT,
  });

  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
  console.log(`📱 Client URL: ${env.CLIENT_URL}`);

  const shutdown = async () => {
    console.log('Shutting down...');
    await client.end();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
