// Learn more https://docs.expo.io/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// ─── Monorepo npm workspaces ────────────────────────────────────────────────
// Jusqu'ici, `@poplist/shared` n'était utilisé qu'en `import type` (effacé à la
// compilation) : Metro n'avait jamais à le résoudre. Depuis que l'app consomme
// des VALEURS du workspace (contenu partagé du menu utilisateur, hooks générés
// par Kubb), il faut lui apprendre à sortir de `mobile/` :
//
//  1. `watchFolders` : suivre les sources hors du dossier de l'app.
//  2. `nodeModulesPaths` : résoudre aussi depuis le node_modules racine, où vit
//     le lien symbolique @poplist/shared → ../shared.
//  3. `unstable_enablePackageExports` : honorer le champ `exports` de
//     shared/package.json (`./generated`, `./content`), sans quoi Metro cherche
//     `shared/generated` au lieu de `shared/src/generated`.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.unstable_enablePackageExports = true;

// ⚠️ Instances UNIQUES pour les libs à état global.
//
// `react` et `@tanstack/react-query` existent en double (mobile/node_modules ET
// node_modules racine, versions différentes). Depuis que Metro résout aussi
// depuis la racine, le SDK généré pouvait charger l'instance racine de
// react-query pendant que l'app fournit son QueryClient via l'instance mobile :
// le hook ne trouvait alors aucun client et jetait au montage (écran blanc sur
// /lists/[id]). On épingle les deux sur la copie de l'app.
//
// ⚠️ `extraNodeModules` ne suffit PAS : Metro ne le consulte qu'en REPLI, quand
// la résolution normale a échoué. Un `require('react')` venant de `shared/`
// remonte l'arborescence et trouve `<root>/node_modules/react` bien avant le
// repli → deux instances de React et de react-query. Symptôme : « Cannot read
// property 'useContext' of null » au montage de ListRecommendations (le seul
// composant mobile qui consomme un hook Kubb).
//
// `resolveRequest` intercepte AVANT la résolution : la redirection s'applique
// quelle que soit l'origine de l'import.
const SINGLETONS = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  '@tanstack/react-query': path.resolve(projectRoot, 'node_modules/@tanstack/react-query'),
};

config.resolver.extraNodeModules = SINGLETONS;

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isSingleton = Object.keys(SINGLETONS).some(
    (pkg) => moduleName === pkg || moduleName.startsWith(`${pkg}/`),
  );

  // On ne réécrit pas le chemin (les sous-chemins type `react/jsx-runtime` et
  // les `exports` resteraient à gérer à la main) : on déplace l'ORIGINE de la
  // résolution dans `mobile/`, si bien que la remontée node_modules trouve la
  // copie de l'app en premier. Le reste de la résolution est inchangé.
  const resolvingContext = isSingleton
    ? { ...context, originModulePath: path.join(projectRoot, 'index.ts') }
    : context;

  return (defaultResolveRequest ?? resolvingContext.resolveRequest)(
    resolvingContext,
    moduleName,
    platform,
  );
};

module.exports = config;
