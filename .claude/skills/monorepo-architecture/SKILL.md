---
name: monorepo-architecture
description: Architecture du monorepo Poplist (npm workspaces + Turborepo + types partagés via @poplist/shared). À utiliser quand l'utilisateur ajoute/modifie/déboggue les fichiers de configuration monorepo (`package.json` racine, `turbo.json`, `package-lock.json`), pose des questions sur les commandes Vercel/Railway, ajoute des dépendances, ou rencontre des erreurs de résolution de modules entre back/front/shared. Couvre setup local, deploy Vercel, deploy Railway, et le rôle de `shared` comme container de types pur (zéro runtime).
---

# Architecture monorepo Poplist

## Vue d'ensemble

```
Poplist/
├── package.json              ← root, déclare workspaces + scripts dev/build
├── package-lock.json         ← UNIQUE lockfile pour 3 workspaces
├── turbo.json                ← orchestration des tasks (dev, build, lint)
├── shared/                   ← @poplist/shared, types-only (no JS emit)
├── backend/                  ← Hono + Drizzle (poplist-backend)
├── frontend/                 ← Next.js 16 (poplist-frontend)
└── mobile/                   ← Expo, projet npm SÉPARÉ (pas dans workspaces)
```

3 workspaces hoistés sous npm workspaces, orchestrés par Turborepo. `mobile/` a son propre `package-lock.json` car Expo/RN demande une logique d'install distincte du hoisting npm classique.

## Le rôle exact de `shared/`

`shared/` est un **container de types TypeScript pur**, **zéro code runtime émis**.

`shared/package.json` :
```json
{
  "name": "@poplist/shared",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./entities/*": "./src/entities/*.ts",
    "./api/*": "./src/api/*.ts"
  }
}
```

`shared/tsconfig.json` a `"noEmit": true` — aucun fichier JS n'est jamais produit.

**Conséquence critique** : tous les imports depuis backend et frontend doivent être `import type { X } from '@poplist/shared'`. TypeScript efface ces imports à la compilation, donc **rien ne survit dans le bundle final** :
- Backend `npm run build` → `tsc` produit `backend/dist/` qui ne contient aucune référence à shared
- Frontend `next build` → bundle ne contient aucune référence à shared

Le runtime n'a donc **jamais** à trouver `@poplist/shared` sur le disque. C'est pour ça qu'on peut héberger backend et frontend sur des services différents (Railway, Vercel) sans qu'ils aient besoin de mutuellement résoudre `shared`.

**Quand tu ajoutes du code runtime à shared (constantes, schémas Zod, helpers)** : il faut basculer vers une compilation `shared/dist/` + pointer `main` du package vers le `.js` compilé. Bug courant à anticiper.

## Commandes locales

### Setup initial après clone

```bash
git clone <url> Poplist
cd Poplist
npm install            # à la racine, jamais dans un workspace individuel
```

`npm install` à la racine :
- Lit `package.json` racine, voit `"workspaces": ["shared", "backend", "frontend"]`
- Installe les deps de tous les workspaces dans **un seul `node_modules/`** racine (hoisting)
- Crée des symlinks pour les workspaces (`node_modules/@poplist/shared` → `../shared/`, `node_modules/poplist-backend` → `../backend/`, etc.)
- Génère **un seul** `package-lock.json` racine

### Lancer le dev

```bash
npm run dev   # depuis la racine
```

Le script utilise actuellement `concurrently` mais peut être remplacé par `turbo dev` (déjà configuré dans `turbo.json` avec `persistent: true`). Les deux font la même chose : lancent backend (port 3000/3456) et frontend (port 3001) en parallèle avec logs préfixés.

### Ajouter une dépendance

**Toujours depuis la racine** avec le flag `-w` :

```bash
npm install zod -w backend          # ajoute à backend/package.json
npm install lucide-react -w frontend # ajoute à frontend/package.json
npm install -D turbo                 # ajoute aux devDeps racine
```

Ne jamais faire `cd backend && npm install <pkg>` — ça marche mais bypass la cohérence du monorepo.

### Build local

```bash
npm run build      # turbo build → compile backend (tsc) + frontend (next build)
npm run lint       # turbo lint avec cache
```

## Fichiers présents en local ET dans Git

Les 3 fichiers racine sont **tous trackés** depuis le commit `c27a912` :

- `package.json` (racine) — déclare workspaces + scripts + devDeps (turbo, concurrently)
- `package-lock.json` (racine) — fige les versions installées pour reproductibilité
- `turbo.json` — déclare les tasks Turborepo (dev, build, lint)

Avant le commit `c27a912`, ces 3 fichiers étaient gitignore (legacy d'avant la migration vers vrai monorepo). **Ne jamais ré-ignorer** — Vercel et Railway en ont besoin.

## Déploiement Vercel (frontend)

### Settings du projet Vercel

| Champ | Valeur |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Next.js (auto-détecté) |
| Install Command (override) | `cd .. && npm install` |
| Build Command | (laisser auto : `next build`) |
| Output Directory | (laisser auto : `.next`) |

### Pourquoi `cd .. && npm install`

Avec Root Directory = `frontend`, Vercel exécute par défaut les commandes dans `/vercel/path0/frontend/`. Mais le `package.json` qui déclare `"workspaces": [...]` est à la racine du repo (`/vercel/path0/`). Sans `cd ..`, npm depuis `frontend/` ne voit pas les workspaces, échoue à résoudre `@poplist/shared@*` et tente le registre npm public → 404.

`cd .. && npm install` remonte d'un cran, npm trouve la déclaration de workspaces et résout `@poplist/shared` comme symlink local. Tous les workspaces sont installés (backend deps inclus, on s'en fout — voir « Pourquoi pas filtrer » plus bas).

### Pourquoi pas filtrer (`--workspace=frontend --workspace=shared`)

C'est tentant, mais ça **casse les binaires natifs** déclarés en `optionalDependencies` (notamment `lightningcss-linux-x64-gnu` pour Tailwind v4, `@swc/helpers` pour Next, etc.). Bug npm reproductible. Le coût (~10s d'install supplémentaires + ~200 Mo de disque inutilisé sur la machine de build Vercel) est acceptable face au coût de débugger ces problèmes.

### Cache de build

Si tu refais un deploy après avoir touché les deps : **décocher "Use existing Build Cache"** dans le bouton Redeploy. Le cache contient le `node_modules/` du build précédent qui peut être incohérent avec le nouveau lockfile et déclencher des erreurs ésotériques (binaires manquants, versions stale).

## Déploiement Railway (backend)

### Settings du projet Railway

| Champ | Valeur |
|---|---|
| Root Directory | `.` (racine du monorepo) |
| Custom Build Command | `npm install --include=dev && cd backend && npm run build` |
| Custom Start Command | `cd backend && npm start` |
| Watch Paths | `/backend/**` `/shared/**` `/package.json` `/package-lock.json` |

### Pourquoi Root Directory = `.` (et pas `backend`)

Railway utilise Railpack qui **injecte automatiquement un step `npm install`** avant le Custom Build Command. Avec Root Directory = `backend`, ce step auto tourne dans `/app/backend/` et plante sur `@poplist/shared@*` (404 sur npm) parce qu'il ne voit pas les workspaces.

Avec Root Directory = `.`, le step auto tourne à la racine et résout les workspaces correctement. Le Custom Build Command fait ensuite `cd backend` pour le build, et le Start Command pareil pour le runtime.

### Pourquoi `--include=dev`

Railway pose `NODE_ENV=production` par défaut, ce qui fait que npm omet les devDeps (TypeScript en fait partie). Sans `--include=dev`, `tsc` plante au build. Vercel n'a pas ce problème car Next.js gère les devDeps automatiquement pour son framework détecté.

### Watch Paths

Sans Watch Paths, Railway redéploie le backend à chaque commit, **même quand seul le frontend a changé**. Les patterns `/backend/**` `/shared/**` `/package.json` `/package-lock.json` filtrent : seuls les changements pertinents pour le backend déclenchent un redeploy.

## Variables d'environnement prod

### Frontend Vercel

```env
NEXT_PUBLIC_API_URL=https://<railway-backend>.up.railway.app
```

Une seule var. Le `next.config.ts` proxy `/api/*` vers cette URL.

### Backend Railway

```env
NODE_ENV=production
PORT=<auto-injecté par Railway>
DATABASE_URL=<URL Neon prod>
JWT_ACCESS_SECRET=<openssl rand -hex 32, distinct du dev>
JWT_REFRESH_SECRET=<openssl rand -hex 32, distinct du dev>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://<railway-backend>.up.railway.app/auth/google/callback
CLOUDINARY_URL=cloudinary://...
TMDB_API=<token v4>
CLIENT_URL=https://<vercel-frontend>.vercel.app
```

Le parsing Zod dans `backend/src/env.ts` fail-fast au boot si une var manque. Vérifier la liste **avant** de redeploy après changement de schema env.

## Erreurs fréquentes et fixes

### `404 Not Found - GET https://registry.npmjs.org/@poplist%2fshared`

**Cause** : install command tourne dans un workspace sans voir le `package.json` racine. Vérifier que les fichiers racine sont commités (`git ls-files | grep "^[^/]*$"` doit lister `package.json`, `package-lock.json`, `turbo.json`).

### `Cannot find module 'lightningcss-linux-x64-gnu.node'` ou `@swc/helpers/...`

**Cause** : binaire natif/peer dep transitive non installé. Le lockfile est cohérent mais npm a échoué à installer la dep transitive (bug npm avec workspaces + optionalDeps).

**Fix** :
```bash
trash node_modules frontend/node_modules backend/node_modules shared/node_modules package-lock.json
npm cache clean --force
npm install
```

Si ça persiste après le nuke total, ajouter la dep manquante en deps directe dans le `package.json` du workspace concerné :
```json
"motion-dom": "^12.38.0",
"motion-utils": "^12.36.0"
```

### `Detected Next.js version: 9.3.3` (ou autre version aberrante)

**Cause** : un `package.json` (racine, frontend, ou backend) a une mauvaise version de Next/dep clé. Souvent une faute de frappe dans `npm install <pkg>@<version>`.

**Fix** :
```bash
node -e "const lock = require('./package-lock.json'); for (const [path, pkg] of Object.entries(lock.packages)) { const deps = { ...(pkg.dependencies||{}), ...(pkg.devDependencies||{}) }; if (deps.next) console.log(path, '→ next', deps.next); }"
```
Identifier le workspace coupable, corriger sa version, régénérer le lockfile.

### `concurrently: command not found` après reinstall

**Cause** : node_modules pas (re)peuplé. Lancer `npm install` à la racine et attendre la fin avant de relancer `npm run dev`.

## Anti-patterns à éviter

- ❌ `npm install` dans un workspace individuel sans raison (pas dangereux mais inutile)
- ❌ Régénérer `package-lock.json` sans supprimer `node_modules/` d'abord (lockfile peut hériter d'états incohérents)
- ❌ Filtrer l'install Vercel/Railway avec `--workspace=X` (casse les binaires natifs)
- ❌ Gitignorer les fichiers racine `package.json`/`package-lock.json`/`turbo.json`
- ❌ Importer depuis `@poplist/shared` sans `import type` (introduit du runtime, casse les builds)
- ❌ Déployer Vercel ou Railway sans avoir d'abord vérifié que `tsc --noEmit` passe localement
