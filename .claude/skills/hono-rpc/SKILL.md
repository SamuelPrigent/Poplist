---
name: hono-rpc
description: Guide d'utilisation du Hono RPC client dans Poplist. À consulter quand on ajoute, modifie ou debug une route backend Hono qui doit être consommée par le frontend via le client RPC `honoAPI`. Couvre les pièges non documentés découverts lors de la migration (middleware HTTPException, formatter typing, query schemas, status code unions) et la marche à suivre pour ajouter une route sans casser l'inférence côté front.
---

# Hono RPC dans Poplist — Guide pratique

L'app utilise un client RPC Hono qui infère les types end-to-end depuis le backend vers le frontend, via `frontend/src/api/`. Ce skill couvre la logique de base + les pièges réels rencontrés en production sur ce projet (et qui ne sont pas dans la doc officielle Hono).

## Architecture en 3 couches

1. **Backend** : routes chaînées dans une seule expression `new Hono().get(...).post(...)`, exportées avec `export type AppType = typeof app` depuis `backend/src/app.ts`.
2. **Client RPC** : `frontend/src/api/client.ts` crée `client = hc<AppType>('/api', { fetch: customFetchWithRefresh })`. Le `customFetch` gère l'auto-refresh sur 401 et l'auto-logout.
3. **Wrapper `honoAPI`** : `frontend/src/api/index.ts` expose des méthodes nestées par domaine (`honoAPI.watchlists.removeItem(id, tmdbId)`) qui wrappent `client` + `unwrap`. **Les composants utilisent toujours `honoAPI`, jamais `client` directement.**

## Quand utiliser RPC, quand ne pas

### ✅ À typer via RPC

- Toute route web appelée par le frontend Next (auth, watchlists, users, tmdb)
- Routes qui retournent du JSON typable (`c.json({...})`)

### ❌ À garder hors AppType

- Routes mobile (`/auth/mobile/*`) — appelées par l'app Android avec son propre client, pas par le front web. Mountées **après** la chaîne dans `app.ts` pour rester invisibles côté RPC.
- Routes utilitaires non-JSON : `/image-proxy` (retourne `new Response(buffer)`), `/health` (trivial).
- Routes OAuth callback (`googleCallback`) : retournent du HTML (`c.html(...)`) — actuellement chaînées par historique mais inutilisables via RPC client (type `Response` plat). Ne pas chercher à les consommer via RPC.

### Pattern pour mounter une route hors AppType

```ts
// backend/src/app.ts
const app = new Hono<AppEnv>()
  .route('/auth', authRoutes)
  .route('/user', userRoutes)
  .route('/watchlists', watchlistRoutes)
  .route('/tmdb', tmdbRoutes);

export type AppType = typeof app;  // ne contient QUE ces 4 routes

// Mountées au runtime mais HORS AppType :
app.route('/auth/mobile', authMobileRoutes);
app.get('/health', ...);
app.get('/image-proxy', ...);
```

---

# Pièges critiques (découverts à la dure)

Ces points NE SONT PAS dans la doc Hono. Ils ont coûté des heures de debug à la migration.

## 🚨 Piège n°1 — Middleware retournant `c.json()` aplatit le type de toutes les routes derrière

**Symptôme** : côté front, `await honoAPI.watchlists.getMine()` retourne un type qui ne contient PAS le `watchlists`. TS dit `Property 'watchlists' does not exist on type 'never'` ou type narrow à `{ error: string }` uniquement.

**Cause** : un middleware (souvent `auth`) déclaré comme :
```ts
// ❌ MAUVAIS — pollue le type de toute route derrière ce middleware
export const auth = createMiddleware<AppEnv>(async (c, next) => {
  const token = extractToken(c);
  if (!token) {
    return c.json({ error: 'Authentication required' }, 401);  // ← le poison
  }
  // ...
  return next();
});
```

Hono "consomme" la response du middleware comme si c'était la response de la route, et l'union avec le succès du handler est cassée.

**Fix** : `throw HTTPException` au lieu de `return c.json()`. `app.onError` global wrap déjà l'exception en `{ error: msg }` au runtime, donc zéro changement comportemental.

```ts
// ✅ BON
import { HTTPException } from 'hono/http-exception';

export const auth = createMiddleware<AppEnv>(async (c, next) => {
  const token = extractToken(c);
  if (!token) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }
  try {
    const payload = verifyAccessToken(token);
    c.set('user', payload);
  } catch {
    throw new HTTPException(401, { message: 'Invalid or expired token' });
  }
  await next();
});
```

**Règle générale** : tout middleware qui peut "court-circuiter" la route (auth, rate limit, feature flag) doit `throw HTTPException`, pas `return c.json()`. Sinon il pollue le type de chaque route qui l'utilise.

## 🚨 Piège n°2 — `Map<string, any>` collapse l'inférence du return type

**Symptôme** : un controller construit son retour via une `Map<string, any>` (ou `any[]` accumulé) puis fait `c.json({ watchlists: Array.from(map.values()) })`. Le type côté front est `{ watchlists: any[] }`, ou même pire, le succès n'apparaît pas dans la response type.

**Cause** : avec `any` en interne, TS abandonne l'inférence du type de retour de la fonction et tombe sur la première branche typable (souvent l'erreur).

**Fix** : typer la map/le tableau intermédiaire.

```ts
// ❌ MAUVAIS
const watchlistsMap = new Map<string, any>()  // ← détruit tout le typing en aval

// ✅ BON
type MyWatchlist = FormattedWatchlist & {
  isOwner: boolean
  isCollaborator: boolean
  isSaved: boolean
  libraryPosition: number
}
const watchlistsMap = new Map<string, MyWatchlist>()
```

**Règle générale** : pas de `any` dans les structures intermédiaires d'un controller dont la response doit être typée côté RPC. `unknown` est OK si tu narrow ensuite ; `any` est interdit.

## 🚨 Piège n°3 — Formatter typé `(x: any)` détruit tout le pipeline

**Symptôme** : tous les composants reçoivent `Watchlist['items']` typé `any[]`, `platformList: JsonValue`, etc. Aucun bénéfice RPC sur les données les plus utilisées.

**Cause** : helper de formatage (`formatWatchlistWithRelations`, etc.) avec `(input: any)` en signature. Le retour devient `any`.

**Fix** : typer l'input avec un type Prisma payload + un return type explicite.

```ts
// ❌ MAUVAIS
function formatWatchlistWithRelations(watchlist: any) {
  return { id: watchlist.id, ... }
}

// ✅ BON
import type { Watchlist, WatchlistItem, User, Prisma } from '@prisma/client'

type FormattedWatchlist = {
  id: Watchlist['id']
  ownerId: Watchlist['ownerId']
  // ... tous les champs explicites
  items: FormattedWatchlistItem[]  // typé strict, pas JsonValue
}

type WatchlistFormatterInput = Watchlist & {
  owner?: FormattedUser | null
  collaborators?: Array<{ user: FormattedUser }>
  items?: WatchlistItem[]
  likedBy?: Array<{ user: FormattedUser }>
}

function formatWatchlistWithRelations(
  watchlist: WatchlistFormatterInput
): FormattedWatchlist {
  // ...
}
```

**Règle générale** : aucun helper appelé dans le chemin entre Prisma et `c.json()` ne doit accepter `any`. Sinon le type final côté front est inutilisable.

## 🚨 Piège n°4 — Query strings non typées sans `zValidator('query', schema)`

**Symptôme** : côté front, `client.tmdb.discover[':type'].$get({ param: { type }, query: { page: '1' } })` → erreur TS `'query' does not exist in type '{ param: ... }'`. Le wrapper `honoAPI.tmdb.discover(type, opts)` ne peut pas passer de query.

**Cause** : sans `zValidator('query', schema)` sur la route, Hono ne génère aucun type pour la query côté client RPC, même si le controller fait `c.req.query('page')` au runtime.

**Fix** : déclarer un schema Zod pour la query et l'attacher via `zValidator('query', schema)`. Le controller peut continuer d'utiliser `c.req.query('page')` (la validation est juste un middleware qui n'impose pas l'usage de `c.req.valid('query')`).

```ts
// validators/tmdb.ts
export const trendingQuerySchema = z.object({
  language: z.string().optional(),
  page: z.string().optional(),
});

// routes/tmdb.ts
.get('/trending/:timeWindow', zValidator('query', trendingQuerySchema), (c) =>
  TmdbController.getTrending(c)
)
```

**Règle générale** : si une route accepte des query params **et** qu'elle est appelée via RPC, **il faut un `zValidator('query', schema)`**. Sinon les params ne sont pas typés côté client.

## 🚨 Piège n°5 — Le wrapper `unwrap` exclut les erreurs via `Exclude<J, { error: string }>`

**Symptôme** : un endpoint qui retourne `c.json({ status: 'ok' })` ET `c.json({ error: '...' }, 400)` voit `status` exclu si tu utilises Exclude trop large.

**Cause** : `Exclude<J, { error: string }>` retire toute union member ayant un champ `error: string`. Si tu as une route qui retourne légitimement un champ `error` non-erreur (très rare mais possible), il sera exclu.

**Fix actuel dans `api/client.ts`** : on accepte ce trade-off. Toutes les réponses d'erreur du backend Poplist sont `{ error: string }`, et aucune réponse de succès n'utilise un champ nommé `error`. Si un jour ça change, modifier `Success<R>` pour filtrer par status code via `ClientResponse<T, S, F>` au lieu de filtrer par shape.

**Règle générale** : ne JAMAIS nommer un champ de succès `error: string` dans une réponse JSON. Utiliser `errorMessage`, `validationError`, etc. à la place.

## 🚨 Piège n°6 — Status codes multiples → union de réponses

**Symptôme** : une route fait `c.json({ data }, 200)` ET `c.json({ data: alternative }, 201)`. Le client RPC reçoit l'union des deux shapes, pas une seule.

**Comportement** : le wrapper `unwrap` actuel renvoie tout ce qui n'est pas `{ error: string }`. Donc si toutes les réponses succès ont la même shape, c'est OK. Si elles diffèrent (ex: 200 sans `id`, 201 avec `id`), TS forcera le narrowing côté consommateur.

**Règle générale** : pour une même route, **garder une shape de succès cohérente** entre les status codes. Si tu as besoin de vraiment différencier 200 vs 201, `InferResponseType<typeof X.$get, 200>` permet de filtrer manuellement.

---

# Comment ajouter une nouvelle route (checklist)

Pour respecter la migration RPC, suivre cet ordre quand on ajoute une route web :

### 1. Validator (si body ou query non-trivial)

`backend/src/validators/<domaine>.ts` :
```ts
export const myInputSchema = z.object({
  field: z.string().min(1),
});
```

### 2. Controller

`backend/src/controllers/<domaine>.ts` :
```ts
export type MyInput = z.infer<typeof myInputSchema>

export const myHandler = async (c: C, data: MyInput) => {
  // ... business logic
  return c.json({ result: 'ok' })  // ← succès typé
}
```

**Règles** :
- Tous les helpers internes typés strict (pas de `any` !)
- Retours d'erreur business : `c.json({ error: '...' }, status)` — sera exclu côté front via `unwrap`
- Pour erreurs auth/validation : laisser le middleware throw `HTTPException`

### 3. Route (chaînée + zValidator)

`backend/src/routes/<domaine>.ts` :
```ts
const myRoutes = new Hono<AppEnv>()
  // ... routes existantes
  .post('/new', auth, zValidator('json', myInputSchema), (c) =>
    MyController.myHandler(c, c.req.valid('json'))
  );
```

**Règles** :
- Toujours wrapper le handler avec arrow `(c) => Controller.method(c, ...)` — sinon le type ne se propage pas
- `zValidator('json', schema)` pour body, `zValidator('query', schema)` pour query string
- Garder le chaînage **dans la même expression** — casser la chaîne (`routes.get(...)` séparé) casse l'inférence

### 4. Wrapper `honoAPI`

`frontend/src/api/index.ts` :
```ts
export const honoAPI = {
  myDomain: {
    // ... méthodes existantes
    create: async (input: { field: string }) =>
      unwrap(await client.myDomain.new.$post({ json: input })),
  },
};
```

**Règles** :
- Une méthode wrapper par endpoint, paramètres simples
- Toujours retourner `unwrap(...)` — pas de manipulation manuelle de la response
- Composants n'utilisent QUE ce wrapper, jamais `client` direct

### 5. Build TS pour valider

```bash
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

Si le wrapper `honoAPI.myDomain.create()` infère correctement le retour (autocomplete sur `data.result` dans VS Code), tu es bon.

---

# Vérifier que ça marche (debug)

Pour tester rapidement le typage d'une route via RPC :

```ts
// Créer un fichier temporaire frontend/src/__check.ts
import { client } from "@/api/client";

type R = Awaited<ReturnType<typeof client.MY_ROUTE.$get>>;
type J = R extends { json: () => Promise<infer X> } ? X : never;

declare const j: J;
const _w: { EXPECTED_FIELD: unknown } = j;  // ← TS dira si le champ est bien là
```

Si TS dit `Property 'EXPECTED_FIELD' is missing in type ...`, ton type est cassé — chercher dans l'ordre :
1. Middleware qui retourne `c.json` au lieu de throw HTTPException
2. Helper formatter avec `any` en input
3. `Map<string, any>` ou `any[]` intermédiaire

Supprimer le fichier `__check.ts` une fois debug terminé.

---

# Anti-patterns à ne jamais commettre

```ts
// ❌ Middleware avec c.json() error path
return c.json({ error: '...' }, 401);

// ❌ Helper avec any
function format(x: any) { return { ... } }

// ❌ Map intermédiaire any
const map = new Map<string, any>()

// ❌ Composant qui utilise client directement
const res = await client.watchlists[':id'].$delete({ param: { id } });

// ❌ Routes web chaînées séparément (casse l'inférence)
const routes = new Hono();
routes.get('/x', handler);

// ❌ Query params sans zValidator (pas typé côté RPC)
.get('/search', (c) => Controller.search(c))  // si Controller lit c.req.query('q')
```

# Patterns corrects

```ts
// ✅ Middleware avec HTTPException
throw new HTTPException(401, { message: '...' });

// ✅ Helper typé strict
function format(x: TypedInput): TypedOutput { return { ... } }

// ✅ Map typée
const map = new Map<string, TypedValue>()

// ✅ Composant via wrapper honoAPI
await honoAPI.watchlists.removeItem(id, tmdbId);

// ✅ Routes chaînées en une expression
const routes = new Hono<AppEnv>()
  .get('/x', handler)
  .post('/y', handler2);

// ✅ Query params validés
.get('/search', zValidator('query', searchQuerySchema), (c) =>
  Controller.search(c)
)
```
