import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Garde-fou d'architecture : TOUS les appels à l'API TMDB doivent passer par
 * l'unique Bottleneck de `services/tmdb-queue.ts` (≤ 39 req/s, sous la limite
 * de 40/s de TMDB).
 *
 * Ces tests cassent si un dev ajoute :
 *   - un 2e `new Bottleneck` (→ 2 files d'attente → dépassement possible) ;
 *   - un appel direct à `api.themoviedb.org` ailleurs (→ contourne la file).
 *
 * Tout nouvel appel TMDB doit donc passer par `fetchFromTMDB` (tmdb-queue.ts),
 * lui-même consommé uniquement via `fetchWithCache` (tmdb.ts).
 */

const SRC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src');
const QUEUE_FILE = 'services/tmdb-queue.service.ts';

/** Liste récursive des fichiers `.ts` sous `src/`, en chemins relatifs à `src/`. */
function listTsFiles(dir: string, base: string = dir): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listTsFiles(full, base));
    } else if (entry.name.endsWith('.ts')) {
      out.push(path.relative(base, full));
    }
  }
  return out;
}

function read(relativePath: string): string {
  return readFileSync(path.join(SRC_DIR, relativePath), 'utf8');
}

describe('TMDB funnel — une seule file d’attente pour l’API TMDB', () => {
  const files = listTsFiles(SRC_DIR);

  it('scanne bien les fichiers source (sanity check)', () => {
    expect(files.length).toBeGreaterThan(0);
    expect(files).toContain(QUEUE_FILE);
  });

  it('`new Bottleneck` n’apparaît que dans tmdb-queue.ts', () => {
    const offenders = files.filter(
      f => f !== QUEUE_FILE && /new\s+Bottleneck/.test(read(f))
    );
    expect(
      offenders,
      `Bottleneck créé hors de tmdb-queue.ts (2e file interdite) : ${offenders.join(', ')}`
    ).toEqual([]);
  });

  it('`api.themoviedb.org` n’est référencé que dans tmdb-queue.ts', () => {
    const offenders = files.filter(
      f => f !== QUEUE_FILE && /api\.themoviedb\.org/.test(read(f))
    );
    expect(
      offenders,
      `Appel direct à l'API TMDB hors de la file (utilise fetchFromTMDB) : ${offenders.join(', ')}`
    ).toEqual([]);
  });
});
