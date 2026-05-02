# Poplist

Application web de listes de films et séries — création, organisation collaborative, partage public, métadonnées TMDB. Web (Next.js) et Android.

---

## Stack

| Couche            | Choix                                                           |
| ----------------- | --------------------------------------------------------------- |
| Monorepo          | npm workspaces + Turborepo                                      |
| Frontend web      | Next.js 16 (App Router) · React 19 · Tailwind v4 · Radix UI     |
| Backend           | Hono v4 · TypeScript · Node 22+                                 |
| Base de données   | PostgreSQL · Drizzle ORM (Core API, joins explicites)           |
| Types partagés    | Workspace `@poplist/shared` (entities + contrats API)           |
| Auth              | JWT access + refresh · cookies httpOnly (web) · Bearer (mobile) |
| Validation        | Zod (env, body, schémas)                                        |
| Stockage médias   | Cloudinary (avatars, covers, thumbnails)                        |
| Cache TMDB        | DB-backed (table dédiée, TTL paramétrable par endpoint)         |
| State côté client | Zustand · SWR (data fetching)                                   |
| UI                | shadcn/ui · motion · sonner · cmdk · @dnd-kit                   |
| Déploiement       | Vercel (web) · Railway (backend) · Neon (Postgres)              |

---

## Architecture

### Monorepo

Trois packages liés par npm workspaces, orchestrés par Turborepo :

```
poplist/
├── shared/      → @poplist/shared : types DOM + contrats API (zéro runtime)
├── backend/     → Hono + Drizzle (API REST)
├── frontend/    → Next.js (web)
└── mobile/      → Android (consomme l'API via /auth/mobile/*)
```

Le package `shared/` est **import-only** (types TypeScript, aucun JS émis). Il définit :

- `entities/` — shapes des objets du domaine (User, Watchlist, WatchlistItem, Platform...)
- `api/` — contrats Request/Response namespacés par domaine (`AuthAPI`, `WatchlistsAPI`, `TMDBAPI`...)

### Type safety bout-en-bout

Les contrats API sont définis explicitement dans `@poplist/shared` et consommés par les deux côtés :

- **Backend** : chaque `c.json(payload)` est suffixé par `satisfies XxxAPI.YResponse` — toute divergence par rapport au contrat échoue à la compilation.
- **Frontend** : un SDK manuel (`frontend/src/api/`) avec un wrapper `apiFetch<T>(path, opts)` typé sur les contrats partagés. Throw on error, auto-refresh 401, retry transparent.

Le frontend dépend uniquement des types partagés, pas du code backend — les deux builds (Vercel et Railway) restent découplés.

### Backend (Hono + Drizzle)

Découpage classique routes → controllers → services :

```
backend/src/
├── app.ts              → assemblage Hono (CORS, logger, mounts)
├── env.ts              → parsing Zod des variables d'env (fail-fast au boot)
├── routes/             → définition des routes (zod-validator pour bodies)
├── controllers/        → handlers, retournent c.json(...) satisfies XxxResponse
├── services/           → JWT, OAuth Google, TMDB, Cloudinary, cache, thumbnails
├── middleware/auth.ts  → auth (extrait cookie OU Bearer) + optionalAuth
├── db/                 → schema Drizzle + connexion postgres-js
└── validators/         → schémas Zod réutilisés
```

**Choix Drizzle Core API explicite** (pas de Relational Query API) : tous les joins, `inArray`, `sql\`\``template sont écrits à la main. Choix pédagogique pour rester proche de SQL et garder le contrôle sur le shape des relations chargées (notamment le bulk-fetch anti-N+1 dans`loadWatchlistRelations`).

**Auth multi-canal** : un seul middleware `auth` accepte cookie httpOnly (web) ou header `Authorization: Bearer ...` (mobile). Les routes mobiles vivent sous `/auth/mobile/*` et renvoient les tokens dans le body JSON pour stockage natif côté Android.

**Cache TMDB DB-backed** : table `api_caches` avec `requestUrl` indexé et TTL par endpoint. Pas de Redis — la DB suffit pour le volume actuel et simplifie le déploiement.

### Frontend (Next.js 16 App Router)

```
frontend/src/
├── app/                → routes App Router (layouts, pages, error.tsx)
├── api/                → SDK typé : auth, users, watchlists, tmdb + apiFetch
├── components/
│   ├── ui/             → primitives shadcn/ui customisées
│   ├── List/           → composants liés aux watchlists
│   ├── Home/Landing/   → sections de pages
│   └── layout/         → header, footer, navigation
├── features/           → flows métier (auth drawer, sync localStorage)
├── context/            → AuthContext (user, login, logout)
├── store/              → Zustand (filtres listes, langue)
├── hooks/              → SWR helpers, useAuthRedirect, useScrollToTopOnMount...
└── proxy.ts            → API_BASE = '/api' → rewrite Next vers backend
```

**Proxy `/api` côté Next** (`next.config.ts`) : tous les appels frontend passent par `/api/*` qui est `rewrite` vers le backend. Avantage : cookies httpOnly same-site (pas de CORS cross-domain en prod), une seule URL côté client.

**Hydratation et SSR** : pages publiques (landing, listes featured, profils) rendues côté serveur via fetch direct au backend. Pages authentifiées en client components avec SWR pour bénéficier du revalidate-on-focus et du cache partagé.

**Persistance offline** : un user non-connecté peut créer des listes en localStorage. Au login, un flow de migration propose de pousser ces listes vers la DB (`features/watchlists/localStorage.ts`).

### Schéma DB (9 tables)

```
users ──┬── watchlists ──┬── watchlist_items
        │                ├── watchlist_collaborators (N:N users)
        │                ├── watchlist_likes (N:N users)
        │                └── saved_watchlists (N:N users)
        ├── refresh_tokens (rotation, max 5 par user)
        ├── user_watchlist_positions (ordre custom dans la library)
        └──
api_caches (cache TMDB, indépendant)
```

Ordre des watchlists dans la library : table `user_watchlist_positions` séparée plutôt que colonne `position` sur `watchlists` — permet à chaque user (owner, collaborateur, saved) d'avoir son propre ordre sans interférer.

---

## Setup

### Prérequis

- Node.js ≥ 22
- PostgreSQL local ou hosted (Neon recommandé)
- Comptes : [TMDB](https://www.themoviedb.org/settings/api), [Google Cloud Console](https://console.cloud.google.com/) (OAuth), [Cloudinary](https://cloudinary.com/)

### Installation

```bash
git clone <url> poplist
cd poplist
npm install         # installe shared + backend + frontend (workspaces)
```

### Variables d'environnement

**`backend/.env`** :

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/poplist

JWT_ACCESS_SECRET=<openssl rand -hex 32>
JWT_REFRESH_SECRET=<openssl rand -hex 32>

GOOGLE_CLIENT_ID=<google oauth client id>
GOOGLE_CLIENT_SECRET=<google oauth client secret>
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
TMDB_API=<bearer token v4 TMDB>

CLIENT_URL=http://localhost:3001
```

**`frontend/.env`** :

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

L'env backend est validé par Zod au boot ([backend/src/env.ts](backend/src/env.ts)) — toute variable manquante stoppe le démarrage avec un message clair.

### Première mise en place de la DB

```bash
cd backend
npm run db-push       # applique le schema Drizzle à la DB locale
npm run db-studio     # (optionnel) ouvre Drizzle Studio
```

### Lancement en dev

```bash
# à la racine — lance backend + frontend en parallèle (concurrently)
npm run dev
```

- Backend : `http://localhost:3000`
- Frontend : `http://localhost:3001`

### Scripts

| Commande                         | Effet                                           |
| -------------------------------- | ----------------------------------------------- |
| `npm run dev` (racine)           | Backend + frontend en parallèle (Turbo)         |
| `npm run build` (racine)         | Build de tous les packages (Turbo)              |
| `npm run lint` (racine)          | Lint de tous les packages                       |
| `npm run db-push` (backend)      | Sync schema Drizzle → DB locale                 |
| `npm run db-push-prod` (backend) | Sync schema Drizzle → DB prod (via `.env.prod`) |
| `npm run db-studio` (backend)    | Drizzle Studio                                  |
| `npm run lighthouse` (frontend)  | Audit Lighthouse en JSON                        |

---

## Déploiement

- **Frontend** : Vercel, build via `next build`. Le `next.config.ts` proxifie `/api/*` vers la prod backend via `NEXT_PUBLIC_API_URL`.
- **Backend** : Railway, build via `tsc`, run via `node dist/index.js`.
- **DB** : Neon (PostgreSQL serverless). Schema poussé via `npm run db-push-prod` (utilise `.env.prod` via `dotenv-cli`).
- **Cookies** : `Secure` + `SameSite=None` en prod (cross-site web↔backend), `Lax` en dev.

---

## Licence

[MIT](LICENSE) — © 2025 Samuel Prigent.
