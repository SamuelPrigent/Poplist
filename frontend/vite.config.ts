import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { nitro } from 'nitro/vite';

// URL du backend Hono. Lue depuis .env (VITE_BACKEND_URL), fallback localhost:3456.
// Utilisée pour proxyfier /api/* vers le backend afin que les cookies httpOnly
// soient sur le même domaine (same-site).
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:3456';
  const isBuild = command === 'build';

  // Build version : injectée dans chaque requête API via `_v=...` pour
  // invalider le cache HTTP navigateur (notamment les 404 négatifs cached)
  // à chaque deploy. Priorité :
  //   1. VERCEL_GIT_COMMIT_SHA : auto-fourni par Vercel à chaque build,
  //      change à chaque commit déployé. Aucune config dashboard requise.
  //   2. VITE_BUILD_VERSION du .env local (fallback dev).
  //   3. Timestamp build comme dernier recours.
  const buildVersion =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    env.VITE_BUILD_VERSION ||
    String(Date.now());

  return {
    resolve: { tsconfigPaths: true },
    define: {
      'import.meta.env.VITE_BUILD_VERSION': JSON.stringify(buildVersion),
    },
    server: {
      port: 3002,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ''),
        },
      },
    },
    plugins: [
      devtools(),
      tailwindcss(),
      tanstackStart({
        // Prerender désactivé : incompatible avec le preset Nitro Vercel
        // (le preview server cherche dist/server/server.js mais nitro l'écrit
        // dans .vercel/output/functions/__fallback.func/). Toutes les pages
        // passent donc en SSR runtime via Vercel Functions.
        pages: [],
      }),
      viteReact(),
      // Nitro uniquement en build (Vercel preset auto-détecté via VERCEL=1).
      // En dev il remplace srvx et casse les AbortSignal du proxy /api.
      isBuild && nitro(),
    ].filter(Boolean),
  };
});
