import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const CONFIG_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(CONFIG_DIR, '..');

const FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT ?? 3005);
const BACKEND_URL = process.env.E2E_BACKEND_URL ?? 'http://localhost:4005';

export default defineConfig({
  testDir: './e2e',

  // Pas de parallélisme : tests partagent la DB de test (poplist-db-test)
  fullyParallel: false,
  workers: 1,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html'], ['list']] : 'list',

  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    // Cookies sont scopés au domaine du baseURL (localhost) → partagés entre front et back-test
    extraHTTPHeaders: { 'x-e2e': '1' },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Playwright lance lui-même les serveurs (back de test + front), attend leur
  // `url`, puis les tue à la fin. `reuseExistingServer` en local réutilise un
  // serveur déjà up ; en CI on spawn toujours frais.
  webServer: [
    {
      // Backend de test : tsx tests/server.ts charge .env.test (PORT=4005, DB de test) + MSW.
      command: 'npm run test:server',
      cwd: path.join(ROOT, 'backend'),
      url: `${BACKEND_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      // Front en mode development (SSR servi) ; VITE_BACKEND_URL passé en env
      // (PAS --mode test, qui casserait le SSR TanStack Start en dev).
      command: 'npm run test:serve',
      cwd: CONFIG_DIR,
      // VITE_E2E=1 → cache Vite dédié (node_modules/.vite-e2e), cf.
      // vite.config.ts : évite la corruption du cache de deps quand le dev
      // server (3001) tourne en même temps que ce serveur de test (3005).
      env: { VITE_BACKEND_URL: BACKEND_URL, VITE_E2E: '1' },
      url: `http://localhost:${FRONTEND_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],

  // outputDir hors du dossier frontend pour ne pas déclencher Vite HMR sur les traces
  outputDir: '../.playwright/test-artifacts',

  metadata: {
    BACKEND_URL,
  },
});
