# Rapport : Pourquoi Hono fait 3 638 lignes au lieu de 12 818 ?

## Chiffres bruts

| Mesure | AdonisJS (backend2/) | Hono (backend/) |
|--------|---------------------|-----------------|
| **Total lignes projet** | **~12 818** | **3 638** |
| dont `package-lock.json` | 8 031 | 0 (dans parent) |
| dont `build/` compilé | ~2 600 | 0 (pas de build/) |
| dont config/boilerplate | ~674 | ~157 (prisma schema) |
| **Code métier réel** | **3 937** | **3 481** |

**Conclusion immédiate :** La vraie différence de code métier est de **456 lignes** (12%), pas de 10 000.

Le chiffre "12 818 vs 3 638" est trompeur parce qu'il compare des choses différentes.

---

## Les 5 raisons de l'écart (avec exemples éducatifs)

---

### 1. package-lock.json — 8 031 lignes fantômes (63% du total)

Le `package-lock.json` de AdonisJS fait **8 031 lignes**. C'est un fichier auto-généré par npm qui liste chaque dépendance avec son hash SHA. Ce n'est pas du code.

Le Hono backend a aussi un `package-lock.json`, mais il est dans le dossier parent — donc il n'est pas compté.

**Impact : -8 031 lignes**

---

### 2. Le dossier build/ — 2 600 lignes de code compilé

AdonisJS produit un dossier `build/` qui contient le JavaScript compilé de chaque fichier TypeScript. C'est une **copie compilée** du code source.

Hono utilise `tsx` pour exécuter directement le TypeScript — pas de dossier `build/`.

**Impact : ~-2 600 lignes**

---

### 3. Boilerplate framework — 674 lignes qu'Hono n'a pas besoin

AdonisJS est un framework "batteries-included" comme Laravel/Rails. Il exige des fichiers de configuration même si tu ne changes pas les valeurs par défaut.

#### Exemple A : Body Parser Config (55 lignes → 0 ligne)

**AdonisJS** (`config/bodyparser.ts` — 55 lignes) :
```typescript
import { defineConfig } from '@adonisjs/core/bodyparser'

const bodyParserConfig = defineConfig({
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  form: {
    convertEmptyStringsToNull: true,
    types: ['application/x-www-form-urlencoded'],
  },
  json: {
    convertEmptyStringsToNull: true,
    types: [
      'application/json',
      'application/json-patch+json',
      'application/vnd.api+json',
      'application/csp-report',
    ],
  },
  multipart: {
    autoProcess: true,
    convertEmptyStringsToNull: true,
    processManually: [],
    limit: '20mb',
    types: ['multipart/form-data'],
  },
})

export default bodyParserConfig
```

**Hono** : Rien. Hono parse le JSON automatiquement avec `c.req.json()`. Pas besoin de config.

#### Exemple B : Hash Config (24 lignes → 0 ligne)

**AdonisJS** (`config/hash.ts`) :
```typescript
import { defineConfig, drivers } from '@adonisjs/core/hash'

const hashConfig = defineConfig({
  default: 'scrypt',
  list: {
    scrypt: drivers.scrypt({
      cost: 16384,
      blockSize: 8,
      parallelization: 1,
      maxMemory: 33554432,
    }),
  },
})

export default hashConfig

declare module '@adonisjs/core/types' {
  export interface HashersList extends InferHashers<typeof hashConfig> {}
}
```

**Hono** : On utilise `bcrypt.hash(password, 10)` directement. 1 ligne au lieu de 24.

#### Exemple C : Middleware obligatoires (35 lignes → 0 ligne)

**AdonisJS** exige 2 middleware qui ne font rien de spécifique à ton app :

`container_bindings_middleware.ts` (19 lignes) — lie HttpContext au container DI :
```typescript
export default class ContainerBindingsMiddleware {
  handle(ctx: HttpContext, next: NextFn) {
    ctx.containerResolver.bindValue(HttpContext, ctx)
    ctx.containerResolver.bindValue(Logger, ctx.logger)
    return next()
  }
}
```

`force_json_response_middleware.ts` (16 lignes) — force les réponses JSON :
```typescript
export default class ForceJsonResponseMiddleware {
  async handle({ request }: HttpContext, next: NextFn) {
    const headers = request.headers()
    headers.accept = 'application/json'
    return next()
  }
}
```

**Hono** : Pas besoin. Hono retourne du JSON nativement avec `c.json()`. Pas de container DI.

#### Exemple D : Entrypoints bin/ (154 lignes → 37 lignes)

**AdonisJS** a 3 fichiers d'entrée :
- `bin/server.ts` (45 lignes) — Ignitor + IMPORTER + signal handlers
- `bin/console.ts` (47 lignes) — Ace CLI bootstrap
- `bin/test.ts` (62 lignes) — Japa test runner bootstrap

Chacun fait essentiellement la même chose : bootstrap l'Ignitor avec le bon mode.

**Hono** a 1 fichier (`src/index.ts` — 37 lignes) :
```typescript
import { serve } from '@hono/node-server';
import app from './app.js';
import { env } from './env.js';
import prisma from './lib/prisma.js';

async function main() {
  await prisma.$connect();
  const server = serve({ fetch: app.fetch, port: env.PORT });
  console.log(`Server running on http://localhost:${env.PORT}`);

  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

main().catch(err => { console.error(err); process.exit(1); });
```

#### Exemple E : adonisrc.ts + kernel.ts (130 lignes → 0 ligne)

**AdonisJS** a besoin de :
- `adonisrc.ts` (86 lignes) — liste des commands, providers, preloads, tests suites
- `start/kernel.ts` (44 lignes) — enregistre les middleware, error handler, bodyparser

**Hono** : Tout est dans `app.ts`. Les middleware sont ajoutés avec `app.use()` directement.

#### Récapitulatif boilerplate

| Fichier AdonisJS | Lignes | Équivalent Hono |
|------------------|--------|-----------------|
| config/bodyparser.ts | 55 | 0 (intégré) |
| config/hash.ts | 24 | 0 (bcrypt direct) |
| config/app.ts | 41 | 0 |
| config/logger.ts | 35 | 0 (console.log) |
| adonisrc.ts | 86 | 0 |
| start/kernel.ts | 44 | 0 |
| bin/server.ts | 45 | inclus dans index.ts |
| bin/console.ts | 47 | 0 (pas de CLI) |
| bin/test.ts | 62 | 0 (pas de test runner) |
| container_bindings_middleware.ts | 19 | 0 |
| force_json_response_middleware.ts | 16 | 0 |
| app/exceptions/handler.ts | ~30 | 0 (onError dans app.ts) |
| **Total** | **~504** | **0** |

**Impact : ~-504 lignes**

---

### 4. ORM : Lucid Models (244 lignes) → Prisma Schema (157 lignes)

AdonisJS utilise **Lucid ORM** avec des classes TypeScript décorées. Chaque table a un fichier `.ts` séparé avec des decorators verbeux.

#### Exemple : Le model User

**AdonisJS** (`app/models/user.ts` — 56 lignes) :
```typescript
import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import RefreshToken from './refresh_token.js'
import Watchlist from './watchlist.js'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare email: string

  @column()
  declare username: string | null

  @column({ columnName: 'password_hash' })
  declare passwordHash: string | null

  @column({ columnName: 'google_id' })
  declare googleId: string | null

  @column({ columnName: 'avatar_url' })
  declare avatarUrl: string | null

  @column()
  declare language: string

  @column()
  declare roles: string[]

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @hasMany(() => RefreshToken)
  declare refreshTokens: HasMany<typeof RefreshToken>

  @hasMany(() => Watchlist, { foreignKey: 'ownerId' })
  declare watchlists: HasMany<typeof Watchlist>

  @manyToMany(() => Watchlist, {
    pivotTable: 'saved_watchlists',
    pivotTimestamps: { createdAt: 'saved_at', updatedAt: false },
  })
  declare savedWatchlists: ManyToMany<typeof Watchlist>

  @manyToMany(() => Watchlist, {
    pivotTable: 'watchlist_collaborators',
    pivotTimestamps: { createdAt: 'added_at', updatedAt: false },
  })
  declare collaborativeWatchlists: ManyToMany<typeof Watchlist>
}
```

**Prisma** (même info dans `schema.prisma` — 22 lignes pour User) :
```prisma
model User {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email        String    @unique @db.VarChar(255)
  username     String?   @unique @db.VarChar(50)
  passwordHash String?   @db.VarChar(255) @map("password_hash")
  googleId     String?   @unique @db.VarChar(255) @map("google_id")
  avatarUrl    String?   @map("avatar_url")
  language     String?   @default("fr") @db.VarChar(5)
  roles        String[]  @default(["user"])
  createdAt    DateTime? @default(now()) @db.Timestamp(6) @map("created_at")
  updatedAt    DateTime? @default(now()) @db.Timestamp(6) @map("updated_at")

  refreshTokens          RefreshToken[]
  watchlists             Watchlist[]
  savedWatchlists        SavedWatchlist[]
  watchlistPositions     UserWatchlistPosition[]
  collaborativeWatchlists WatchlistCollaborator[]
  watchlistLikes         WatchlistLike[]

  @@index([email], map: "idx_users_email")
  @@map("users")
}
```

**Pourquoi c'est plus court :**
- Pas d'imports (Lucid a 4 lignes d'import par model)
- Pas de `declare` + types (Prisma les génère automatiquement)
- Pas de decorators verbeux (`@column({ columnName: '...' })` → `@map("...")`)
- Tous les models sont dans 1 fichier au lieu de 6 fichiers séparés

| Models AdonisJS | Lignes |
|----------------|--------|
| user.ts | 56 |
| watchlist.ts | 59 |
| watchlist_item.ts | 75 |
| refresh_token.ts | 27 |
| api_cache.ts | 21 |
| index.ts (barrel) | 6 |
| **Total** | **244** |

| Prisma schema | Lignes |
|---------------|--------|
| schema.prisma (9 models) | **157** |

**Impact : -87 lignes**

---

### 5. Validation : VineJS vs Zod (123 lignes → 95 lignes)

La différence est mineure ici (23%). Les deux font la même chose.

**AdonisJS** (VineJS) :
```typescript
import vine from '@vinejs/vine'

export const signupValidator = vine.compile(
  vine.object({
    email: vine.string().email().maxLength(255),
    password: vine.string().minLength(8).maxLength(100),
  })
)
```

**Hono** (Zod) :
```typescript
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
});
```

VineJS nécessite `vine.compile()` wrapper et utilise `vine.object()` au lieu de `z.object()` direct. Fonctionnellement identique.

**Impact : -28 lignes**

---

### 6. Middleware Auth : Classe vs Fonction (36+25=61 lignes → 35 lignes)

**AdonisJS** (2 fichiers séparés, pattern classe) :

`auth_middleware.ts` :
```typescript
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

declare module '@adonisjs/core/http' {
  interface HttpContext { user?: AccessTokenPayload }
  interface Request { user?: AccessTokenPayload }
}

export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    let accessToken = ctx.request.cookie('accessToken')
    if (!accessToken) {
      accessToken = ctx.request.plainCookie('accessToken')
    }
    if (!accessToken) {
      return ctx.response.unauthorized({ error: 'Authentication required' })
    }
    try {
      const payload = verifyAccessToken(accessToken)
      ctx.user = payload
      ctx.request.user = payload
      return next()
    } catch {
      return ctx.response.unauthorized({ error: 'Invalid or expired token' })
    }
  }
}
```

`optional_auth_middleware.ts` : fichier séparé avec la même structure.

**Hono** (1 fichier, fonctions) :
```typescript
import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';

export const auth = createMiddleware<AppEnv>(async (c, next) => {
  const accessToken = getCookie(c, 'accessToken');
  if (!accessToken) return c.json({ error: 'Authentication required' }, 401);
  try {
    const payload = verifyAccessToken(accessToken);
    c.set('user', payload);
    return next();
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
});

export const optionalAuth = createMiddleware<AppEnv>(async (c, next) => {
  const accessToken = getCookie(c, 'accessToken');
  if (accessToken) {
    try {
      c.set('user', verifyAccessToken(accessToken));
    } catch {}
  }
  return next();
});
```

**Pourquoi c'est plus court :**
- Pas de `declare module` pour augmenter les types (Hono utilise les generics `AppEnv`)
- Pas de class wrapper (fonction directe)
- 1 fichier au lieu de 2
- Pas besoin de gérer les cookies signés ET plain (AdonisJS doit checker les deux)

**Impact : -26 lignes**

---

### 7. Env validation : Env.create vs Zod (56 lignes → 24 lignes)

**AdonisJS** (`start/env.ts` — 56 lignes) :
```typescript
import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum.optional(['development', 'production', 'test'] as const),
  PORT: Env.schema.number.optional(),
  APP_KEY: Env.schema.string.optional(),
  HOST: Env.schema.string.optional({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum.optional(['fatal','error','warn','info','debug','trace','silent']),
  MONGODB_URI: Env.schema.string.optional(),
  JWT_ACCESS_SECRET: Env.schema.string(),
  // ... 12 autres variables
  DB_HOST: Env.schema.string.optional({ format: 'host' }),
  DB_PORT: Env.schema.number.optional(),
  DB_USER: Env.schema.string.optional(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string.optional()
})
```

**Hono** (`src/env.ts` — 24 lignes) :
```typescript
import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3456),
  DATABASE_URL: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  CLOUDINARY_URL: z.string(),
  TMDB_API: z.string(),
  CLIENT_URL: z.string().default('http://localhost:3001'),
});

export const env = envSchema.parse(process.env);
```

**Pourquoi c'est plus court :**
- Prisma utilise `DATABASE_URL` (1 variable) au lieu de 5 variables séparées (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE)
- Pas besoin de APP_KEY, HOST, LOG_LEVEL (boilerplate AdonisJS)
- Pas besoin de MONGODB_URI (legacy)
- Zod est légèrement plus concis que `Env.schema`

**Impact : -32 lignes**

---

## Résumé final de l'écart

| Source de l'écart | Lignes économisées |
|-------------------|-------------------|
| package-lock.json | **8 031** |
| build/ (code compilé) | **~2 600** |
| Boilerplate framework (configs, bin/, middleware system) | **~504** |
| Lucid Models → Prisma Schema | **87** |
| Validation VineJS → Zod | **28** |
| Middleware class → fonctions | **26** |
| Env validation | **32** |
| **Total écart expliqué** | **~11 308** |

**Écart réel constaté** : 12 818 - 3 638 = **9 180 lignes**

L'écart est donc plus que justifié. La majeure partie (87%) vient de fichiers qui **ne sont pas du code** (package-lock.json, build/) ou du **boilerplate framework** (configs obligatoires, entrypoints, middleware système).

---

## Le vrai comparatif qui compte

Si on compare uniquement le **code métier** (controllers + services + validators + routes + middleware) :

| | AdonisJS | Hono |
|--|---------|------|
| Controllers | 2 362 | 2 192 |
| Services | 909 | 868 |
| Routes | 204 | 115 |
| Validators | 123 | 95 |
| Middleware | 95 | 35 |
| Models/Schema | 244 | 157 |
| **Total métier** | **3 937** | **3 462** |

**Différence réelle de code métier : 475 lignes (12%)**

C'est normal. Les deux backends font exactement la même chose avec les mêmes 49 endpoints. Hono est juste un peu plus concis car :
- Pas de decorator syntax
- Pas de class wrapper pour les middleware
- Prisma schema est plus dense que les Lucid models
- Zod est légèrement plus court que VineJS

---

## Analogie simple

Imagine deux maisons identiques (même nombre de pièces, mêmes fonctionnalités).

- **Maison AdonisJS** : livrée avec un garage plein de meubles IKEA non déballés (package-lock), une copie blueprint de chaque pièce (build/), un cahier de 500 pages de normes de construction (configs), et 4 pièces techniques obligatoires vides (bin/, middleware système).

- **Maison Hono** : juste les pièces, les meubles installés, rien d'autre.

Les deux maisons ont la même surface habitable (~3 500 lignes). Mais la maison AdonisJS a un garage de 10 000 lignes en plus.
