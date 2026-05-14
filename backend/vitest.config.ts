import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    pool: 'forks',
    // Vitest 4 : `poolOptions.forks.singleFork` remplacé par `fileParallelism: false`
    // → garantit que les tests d'intégration tournent en séquentiel (DB partagée)
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
