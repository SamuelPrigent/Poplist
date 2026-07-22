import { defineConfig } from '@kubb/core';
import { pluginOas } from '@kubb/plugin-oas';
import { pluginTs } from '@kubb/plugin-ts';
import { pluginClient } from '@kubb/plugin-client';
import { pluginReactQuery } from '@kubb/plugin-react-query';

export default defineConfig({
  input: { path: './shared/openapi.json' },
  output: {
    path: './shared/src/generated',
    clean: true,
    barrel: 'named',
    // Imports sans extension .ts : évite l'erreur TS5097 dans les éditeurs /
    // tsconfigs sans allowImportingTsExtensions (ex. mobile qui étend
    // expo/tsconfig.base), et reste résolu par moduleResolution "bundler".
    extension: { '.ts': '' },
  },
  plugins: [
    pluginOas(),
    pluginTs({ output: { path: './types' }, group: { type: 'tag' } }),
    pluginClient({
      output: { path: './client' },
      group: { type: 'tag' },
      // Client injectable : les fonctions générées délèguent au transport
      // enregistré par chaque app (web : apiFetch). Cf. shared/src/client-runtime.ts.
      importPath: '@poplist/shared/client-runtime',
    }),
    pluginReactQuery({
      output: { path: './hooks' },
      group: { type: 'tag' },
      // Les hooks importent les types Client/RequestConfig depuis le même runtime.
      client: { importPath: '@poplist/shared/client-runtime' },
      // Pas de variantes useXxxSuspense : inutilisées (aucun composant en
      // Suspense data-fetching), et le généré étant commité, chaque fichier
      // superflu bruite les diffs de PR. Réactivable en supprimant cette ligne.
      suspense: false,
    }),
  ],
});
