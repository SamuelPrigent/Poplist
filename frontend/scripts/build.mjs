#!/usr/bin/env node
// Wrapper autour de `vite build` pour forcer l'exit après que le prerender
// ait terminé. Sans ça le process reste vivant ~4 min car undici (le fetch
// Node interne) garde un pool de sockets keep-alive ouvert vers le serveur
// `vite.preview` que le plugin de prerender démarre. Le plugin ferme bien le
// preview, mais le pool undici ne libère pas tout de suite.
//
// On détecte la fin du prerender via le log "Prerendered N pages", on attend
// que vite build retourne (les writes sur disque sont sync mais on laisse
// une marge de sécurité de 500ms), puis on force exit.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

// Résout vite via Node (require.resolve remonte la chaîne node_modules).
// Marche que vite soit dans frontend/node_modules ou hoisté au root du workspace.
const require = createRequire(import.meta.url);
const vitePkgPath = require.resolve('vite/package.json');
const viteBin = join(dirname(vitePkgPath), 'bin', 'vite.js');

const proc = spawn('node', [viteBin, 'build'], { stdio: ['inherit', 'pipe', 'inherit'] });

let prerenderDone = false;
let buildDone = false;

const buffer = [];
proc.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  const text = chunk.toString();
  buffer.push(text);
  if (text.includes('Prerendered ') && text.includes(' pages')) {
    prerenderDone = true;
  }
  if (text.includes('built in ') && !text.includes('client environment')) {
    buildDone = true;
  }
});

// Quand vite build "termine" naturellement (sans exit), on force exit.
const watchExit = setInterval(() => {
  if (prerenderDone) {
    setTimeout(() => {
      clearInterval(watchExit);
      proc.kill('SIGTERM');
      setTimeout(() => process.exit(0), 200);
    }, 800);
    prerenderDone = false; // évite de re-trigger
  }
}, 100);

proc.on('exit', (code) => {
  clearInterval(watchExit);
  process.exit(code ?? 0);
});
