/**
 * Construit une page HTML autonome (Scalar) de la doc API à partir du spec
 * OpenAPI commité, dans `private/` (gitignoré). Spec inliné → aucun serveur,
 * ouvrable en file://. Lancé par `npm run open-api`.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const spec = readFileSync(resolve(ROOT, 'shared/openapi.json'), 'utf8');
const safe = spec.replace(/<\/script>/gi, '<\\/script>');

const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Poplist API — doc</title>
</head>
<body>
  <!-- Spec OpenAPI inliné : aucun fetch, aucun serveur, ouvrable en file:// -->
  <script id="api-reference" type="application/json">
${safe}
  </script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;

mkdirSync(resolve(ROOT, 'private'), { recursive: true });
const out = resolve(ROOT, 'private/api-docs.html');
writeFileSync(out, html);
console.log(`✅ Doc API écrite : ${out}`);
