import { defineConfig, devices } from '@playwright/test';

const FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT ?? 3002);
const BACKEND_URL = process.env.E2E_BACKEND_URL ?? 'http://localhost:3457';

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

  // Pas de webServer ici : on les lance via concurrently dans le script racine
  // (back-test port 3457, frontend port 3001). Voir package.json racine.
  // Si tu veux lancer Playwright SEUL en supposant que back+front tournent déjà,
  // cette config marche directement.
  // outputDir hors du dossier frontend pour ne pas déclencher Vite HMR sur les traces
  outputDir: '../.playwright/test-artifacts',

  metadata: {
    BACKEND_URL,
  },
});
