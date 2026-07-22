/**
 * Génère le spec OpenAPI depuis l'app Hono et l'écrit dans shared/openapi.json.
 *
 * Script one-shot : importe `app` (sans appeler serve() ni toucher la DB —
 * postgres-js est lazy) et parcourt les métadonnées `describeRoute` en mémoire.
 * Aucun handler n'est exécuté, donc aucune requête réseau/DB.
 *
 * Lancé via `npm run generate:spec -w backend`, puis Kubb consomme le JSON.
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { generateSpecs } from 'hono-openapi';
import app from '../src/app.js';

const spec = await generateSpecs(app, {
  documentation: {
    info: {
      title: 'Poplist API',
      version: '1.0.0',
      description: 'Spec généré automatiquement depuis les routes Hono (hono-openapi).',
    },
    // Base servie derrière le proxy /api (Vite dev + rewrite Vercel). Le SDK
    // généré préfixe les paths avec cette base via le transport custom.
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        // Web : cookie httpOnly accessToken. Mobile : Authorization: Bearer.
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'accessToken' },
        bearerAuth: { type: 'http', scheme: 'bearer' },
      },
    },
  },
});

const outPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../shared/openapi.json');
await writeFile(outPath, `${JSON.stringify(spec, null, 2)}\n`);

console.log(`✅ OpenAPI spec written to ${outPath}`);
process.exit(0);
