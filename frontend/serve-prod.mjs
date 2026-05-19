// Bridge Node pour lancer le build TanStack Start prod en local.
//
// Architecture :
//  - Nitro (preset `node-middleware`, configuré dans `vite.config.ts`) build
//    un handler `middleware(req, res)` exporté par `.output/server/index.mjs`.
//    Ce handler sert le SSR et les assets statiques de `.output/public/`.
//  - Ce script frontale ajoute un proxy `/api/*` vers le backend Hono,
//    indispensable en local pour que les cookies httpOnly soient same-site
//    (sur Vercel, le proxy est géré par le rewrite vercel.json).
//  - Pas de compression manuelle ici : `node-middleware` la délègue au
//    consumer (donc rien en local). Si besoin, ajouter un layer `compression`
//    devant. Pour Lighthouse local, l'écart vs prod Vercel est minime.
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const PORT = Number(process.env.PORT) || 3002;
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3456';

const { middleware } = await import('./.output/server/index.mjs');

async function proxyApi(req, res, url) {
  const targetPath = url.pathname.replace(/^\/api/, '') + url.search;
  const target = new URL(targetPath, BACKEND_URL).toString();

  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (k === 'host' || k === 'connection') continue;
    if (Array.isArray(v)) v.forEach((vv) => headers.append(k, vv));
    else if (v !== undefined) headers.set(k, v);
  }

  const init = { method: req.method, headers, redirect: 'manual' };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req;
    init.duplex = 'half';
  }

  const proxyRes = await fetch(target, init);
  res.statusCode = proxyRes.status;
  proxyRes.headers.forEach((v, k) => res.setHeader(k, v));

  if (!proxyRes.body) {
    res.end();
    return;
  }

  try {
    await pipeline(Readable.fromWeb(proxyRes.body), res);
  } catch (err) {
    // Client fermé en cours de stream, erreurs réseau normales à ignorer.
    if (
      err?.code === 'ERR_STREAM_PREMATURE_CLOSE' ||
      err?.code === 'EPIPE' ||
      err?.code === 'ECONNRESET'
    ) {
      return;
    }
    throw err;
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname.startsWith('/api/') || url.pathname === '/api') {
      await proxyApi(req, res, url);
      return;
    }

    // Tout le reste : SSR + assets statiques, géré par Nitro.
    await middleware(req, res);
  } catch (err) {
    console.error('Server error:', err);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
    if (!res.writableEnded) res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`TanStack Start prod server listening on http://localhost:${PORT}`);
  console.log(`  /api/* → ${BACKEND_URL}`);
});
