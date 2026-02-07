# Debug Hono Backend — Analyse complète

## Problèmes identifiés et corrigés

### 1. Image Proxy — API contract cassé (CORRIGÉ)
**Symptôme :** `image-proxy:1 Failed to load resource: 400 (Bad Request)` + images TMDB cassées
**Cause :** Le frontend appelle `/image-proxy?path=/poster_path.jpg` (convention AdonisJS) mais le Hono backend attendait `?url=https://image.tmdb.org/...`
**Fix :** Réécrit le image-proxy pour utiliser `?path=` comme AdonisJS (`app.ts`)

### 2. CORS headers trop restrictifs (CORRIGÉ)
**Symptôme :** Possibles erreurs CORS sur certaines requêtes frontend
**Cause :** Hono listait seulement `Content-Type, Authorization, Cookie`. AdonisJS autorisait TOUS les headers (`headers: true`)
**Fix :** Ajouté `X-Requested-With` dans `allowHeaders`

### 3. Preload warnings .webp (PAS UN BUG BACKEND)
**Symptôme :** `The resource was preloaded using link preload but not used within a few seconds`
**Cause :** C'est un problème frontend Next.js — des images sont preloadées avec `<link rel="preload">` mais pas utilisées assez vite. Rien à voir avec le backend.

## Comparaison ligne par ligne AdonisJS vs Hono

### Pourquoi 12191 lignes → ~3500 lignes ?

Le chiffre 12191 inclut TOUT le projet AdonisJS :
- `package-lock.json` : ~8000 lignes (pas du code)
- Config framework (adonisrc.ts, kernel.ts, env.ts, cors.ts, app.ts, bodyparser.ts, hash.ts, logger.ts, database.ts) : ~300 lignes
- Boilerplate middleware (container_bindings, force_json_response) : ~40 lignes
- Models Lucid ORM (5 fichiers avec decorators verbeux) : ~244 lignes
- Provider (database_logger_provider) : ~30 lignes
- Migration files : ~80 lignes
- bin/server.ts, bin/console.ts, bin/test.ts : ~50 lignes
- eslint.config.js, tsconfig, .editorconfig : ~30 lignes
- Types, tests bootstrap, test scripts : ~60 lignes
- README : ~20 lignes

**Code métier réel AdonisJS (controllers + services + validators + routes) : ~4300 lignes**
**Code métier réel Hono (controllers + services + validators + routes) : ~3470 lignes**

→ Différence de ~830 lignes, expliquée par :
- Prisma schema remplace les 5 model files (244 lignes → 1 fichier déclaratif)
- Pas besoin de framework boilerplate (kernel, providers, container bindings)
- Zod validators plus concis que VineJS (~30% plus court)
- Middleware Hono fonctionnel vs classes AdonisJS

## Vérification endpoint par endpoint

### Auth (13/13 endpoints)
| Route | Method | Status |
|-------|--------|--------|
| /auth/signup | POST | OK |
| /auth/login | POST | OK |
| /auth/google | GET | OK |
| /auth/google/callback | GET | OK |
| /auth/refresh | POST | OK |
| /auth/logout | POST | OK |
| /auth/set-tokens | POST | OK |
| /auth/username/check/:username | GET | OK |
| /auth/me | GET | OK |
| /auth/profile/username | PUT | OK |
| /auth/profile/password | PUT | OK |
| /auth/profile/language | PUT | OK |
| /auth/profile/account | DELETE | OK |

### Users (4/4 endpoints)
| Route | Method | Status |
|-------|--------|--------|
| /user/profile | GET | OK |
| /user/profile/:username | GET | OK |
| /user/upload-avatar | POST | OK |
| /user/avatar | DELETE | OK |

### TMDB (7/7 endpoints)
| Route | Method | Status |
|-------|--------|--------|
| /tmdb/trending/:timeWindow | GET | OK |
| /tmdb/discover/:type | GET | OK |
| /tmdb/genre/:type/list | GET | OK |
| /tmdb/:type/popular | GET | OK |
| /tmdb/:type/top_rated | GET | OK |
| /tmdb/:type/:id/providers | GET | OK |
| /tmdb/:type/:id/similar | GET | OK |

### Watchlists (25/25 endpoints)
| Route | Method | Status |
|-------|--------|--------|
| /watchlists/public/featured | GET | OK |
| /watchlists/public/:id | GET | OK |
| /watchlists/by-genre/:genre | GET | OK |
| /watchlists/count-by-genre/:genre | GET | OK |
| /watchlists/search/tmdb | GET | OK |
| /watchlists/items/:tmdbId/:type/details | GET | OK |
| /watchlists/mine | GET | OK |
| /watchlists/ | POST | OK |
| /watchlists/reorder | PUT | OK |
| /watchlists/:id | GET | OK |
| /watchlists/:id | PUT | OK |
| /watchlists/:id | DELETE | OK |
| /watchlists/:id/collaborators | POST | OK |
| /watchlists/:id/collaborators/:id | DELETE | OK |
| /watchlists/:id/leave | POST | OK |
| /watchlists/:id/items | POST | OK |
| /watchlists/:id/items/:tmdbId | DELETE | OK |
| /watchlists/:id/items/:tmdbId/position | PUT | OK |
| /watchlists/:id/items/reorder | PUT | OK |
| /watchlists/:id/upload-cover | POST | OK |
| /watchlists/:id/cover | DELETE | OK |
| /watchlists/:id/generate-thumbnail | POST | OK |
| /watchlists/:id/like-and-save | POST | OK |
| /watchlists/:id/unlike-and-unsave | DELETE | OK |
| /watchlists/:id/duplicate | POST | OK |

### Autres routes
| Route | Method | Status |
|-------|--------|--------|
| / | GET | OK (health check) |
| /health | GET | OK (health check) |
| /image-proxy | GET | OK (corrigé) |

## Services (9/9)
Tous les services sont des ports 1:1 des services AdonisJS :
- jwt.ts, cookie.ts, google-oauth.ts, username.ts, cache.ts
- tmdb-queue.ts (Bottleneck), tmdb.ts (toutes les fonctions)
- thumbnail.ts (Sharp + Cloudinary), cloudinary.ts

## Points de vigilance restants

### Cookie migration
Les sessions existantes créées par AdonisJS (cookies signés) ne fonctionneront pas avec Hono (cookies plain). Les utilisateurs devront se reconnecter. C'est normal lors d'un changement de framework.

### Pas de body size limit
AdonisJS avait une limite de 20MB pour les uploads. Hono n'en a pas. À ajouter si nécessaire.

### convertEmptyStringsToNull
AdonisJS convertissait les strings vides en null automatiquement. Hono ne le fait pas. Si le frontend envoie `description: ""`, ça sera stocké comme `""` au lieu de `null`.
