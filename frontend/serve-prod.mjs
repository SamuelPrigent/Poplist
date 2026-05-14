// Minimal Node bridge to run the TanStack Start prod build locally.
// - Serves prerendered HTML and static assets from dist/client
// - Proxies /api/* to the backend (replaces the Vite dev proxy)
// - Falls back to the SSR fetch handler from dist/server/server.js
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBrotliCompress, createGzip, constants as zlibConstants } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const PORT = Number(process.env.PORT) || 3002;
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3456';
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const CLIENT_DIR = join(__dirname, 'dist', 'client');

const { default: handler } = await import('./dist/server/server.js');

const COMPRESSIBLE = new Set([
  'application/javascript',
  'application/json',
  'application/xml',
  'image/svg+xml',
  'text/css',
  'text/html',
  'text/plain',
]);

function pickEncoding(acceptEncoding) {
  if (!acceptEncoding) return null;
  if (/\bbr\b/.test(acceptEncoding)) return 'br';
  if (/\bgzip\b/.test(acceptEncoding)) return 'gzip';
  return null;
}

function isCompressible(contentType) {
  if (!contentType) return false;
  const base = contentType.split(';')[0].trim().toLowerCase();
  return COMPRESSIBLE.has(base);
}

function createCompressor(encoding) {
  if (encoding === 'br') {
    return createBrotliCompress({
      params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 4 },
    });
  }
  return createGzip({ level: 6 });
}

const MIME = {
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function sendFile(filePath, res, url, req) {
  const buf = await readFile(filePath);
  const ct = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
  const baseHeaders = {
    'Content-Type': ct,
    'Cache-Control': url.pathname.startsWith('/assets/')
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=3600',
    Vary: 'Accept-Encoding',
  };

  const encoding = isCompressible(ct) ? pickEncoding(req.headers['accept-encoding']) : null;
  if (encoding) {
    res.writeHead(200, { ...baseHeaders, 'Content-Encoding': encoding });
    await pipeline(Readable.from(buf), createCompressor(encoding), res);
    return;
  }

  res.writeHead(200, { ...baseHeaders, 'Content-Length': buf.length });
  res.end(buf);
}

async function tryServeStatic(req, url, res) {
  if (url.pathname.endsWith('.xml')) return false;

  const decoded = decodeURIComponent(url.pathname);

  if (decoded === '/') {
    const indexPath = join(CLIENT_DIR, 'index.html');
    try {
      await stat(indexPath);
      await sendFile(indexPath, res, url, req);
      return true;
    } catch { return false; }
  }

  const directFile = join(CLIENT_DIR, decoded);
  try {
    const s = await stat(directFile);
    if (s.isFile()) {
      await sendFile(directFile, res, url, req);
      return true;
    }
  } catch { /* fall through */ }

  if (!extname(decoded)) {
    const prerendered = join(CLIENT_DIR, decoded, 'index.html');
    try {
      const s = await stat(prerendered);
      if (s.isFile()) {
        await sendFile(prerendered, res, url, req);
        return true;
      }
    } catch { /* fall through */ }
  }

  return false;
}

function nodeToWebRequest(req, baseUrl) {
  const url = new URL(req.url, baseUrl);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => headers.append(k, vv));
    else if (v !== undefined) headers.set(k, v);
  }
  const init = { method: req.method, headers };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req;
    init.duplex = 'half';
  }
  return new Request(url.toString(), init);
}

async function writeWebResponse(webRes, nodeRes, req) {
  // Client peut close en milieu de stream (refresh, navigation, etc.) →
  // les erreurs `ERR_STREAM_UNABLE_TO_PIPE` / `EPIPE` sont normales, on les
  // ignore. Toute autre erreur log normalement.
  if (nodeRes.destroyed || nodeRes.writableEnded) return;

  nodeRes.statusCode = webRes.status;
  webRes.headers.forEach((v, k) => nodeRes.setHeader(k, v));

  if (!webRes.body) {
    nodeRes.end();
    return;
  }

  const contentType = webRes.headers.get('content-type');
  const alreadyEncoded = webRes.headers.get('content-encoding');
  const encoding =
    !alreadyEncoded && isCompressible(contentType)
      ? pickEncoding(req?.headers['accept-encoding'])
      : null;

  const source = Readable.fromWeb(webRes.body);

  try {
    if (encoding) {
      nodeRes.setHeader('Content-Encoding', encoding);
      nodeRes.removeHeader('Content-Length');
      const existingVary = nodeRes.getHeader('Vary');
      nodeRes.setHeader('Vary', existingVary ? `${existingVary}, Accept-Encoding` : 'Accept-Encoding');
      await pipeline(source, createCompressor(encoding), nodeRes);
      return;
    }
    await pipeline(source, nodeRes);
  } catch (err) {
    // Ignore les erreurs liées à un client qui a fermé la connexion
    if (
      err?.code === 'ERR_STREAM_UNABLE_TO_PIPE' ||
      err?.code === 'EPIPE' ||
      err?.code === 'ECONNRESET' ||
      err?.code === 'ERR_STREAM_PREMATURE_CLOSE'
    ) {
      return;
    }
    throw err;
  }
}

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
  await writeWebResponse(proxyRes, res, req);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname.startsWith('/api/') || url.pathname === '/api') {
      await proxyApi(req, res, url);
      return;
    }

    if (await tryServeStatic(req, url, res)) return;
    const webReq = nodeToWebRequest(req, `http://localhost:${PORT}`);
    const webRes = await handler.fetch(webReq);
    await writeWebResponse(webRes, res, req);
  } catch (err) {
    console.error('Server error:', err);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`TanStack Start prod server listening on http://localhost:${PORT}`);
  console.log(`  /api/* → ${BACKEND_URL}`);
});
