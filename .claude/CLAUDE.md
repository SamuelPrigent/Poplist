# Project Rules — Poplist

- Never use `rm` to delete files or directories. Always use `trash` instead, to allow recovery in case of mistakes.

## ⛔ Base de données : ne JAMAIS toucher la DB de dev

**Tu ne dois JAMAIS créer, modifier ou supprimer de données dans la base de dev
locale (`poplist-db`), sous aucun prétexte.** Toute exécution susceptible
d'écrire (tests, scripts, requêtes de vérification, serveurs que tu lances)
doit passer par la base de TEST :
`postgresql://samuel:@localhost:5432/poplist-db-test`.

Concrètement :
- Backend pour tester : `npm run test:server` (charge `.env.test` → port 4005 +
  DB de test), JAMAIS `tsx src/index.ts`/`npm run dev` si des écritures sont
  possibles.
- E2E : laisser Playwright lancer sa stack. ⚠️ Piège vécu : un serveur front
  résiduel sur 3005 lancé sans l'env de test proxie `/api` vers le backend DEV
  (3456) et `reuseExistingServer` le réutilise → les tests écrivent dans la DB
  de dev. Un garde-fou (`frontend/e2e/global-setup.ts`) fait échouer le run si
  le proxy n'atteint pas le backend de test ; s'il échoue : tuer les ports
  3005/4005 et relancer.
- Lire la DB de dev (SELECT) pour du debug est toléré ; écrire, jamais.

## Stack

- **Frontend** : TanStack Start (React en SSR via **Vite 8 + Nitro 3**). Ce n'est plus Next.js. Point d'entrée config : `frontend/vite.config.ts`. Dev : `vite dev` (port 3001).
- **Backend** : Hono (Node).
- **Monorepo** : npm workspaces + Turborepo, types partagés via `@poplist/shared` (cf. section dédiée plus bas).
- **Mobile** : app Expo/React Native dans `mobile/` (source d'inspiration pour certaines logiques UI, ex. le picker d'années de la page Explore).

# Avant de valider une feature

- Vérifie toujours que le build TypeScript passe : depuis `frontend/`, `npm run typecheck` (= `tsc --noEmit -p tsconfig.json`).

## Tu ne dois jamais commit

- Tu ne dois jamais tenter de commit ou push la seul personne qui fait ça c'est moi
- la seul commande git que tu peux utiliser c'est git history pour voir l'historique des modifications d'un fichier pour le debug

## Erreurs d'hydratation (TanStack Start / React SSR)

Pour toute erreur `Hydration failed because the server rendered HTML didn't match the client`, suivre le protocole du skill `.claude/skills/hydration-diagnosis/SKILL.md` : lire le diff AVANT de toucher au code, distinguer cache SSR obsolète vs vrai bug.

On n'est plus sur Next.js : il n'y a pas de dossier `.next`. Les caches/artefacts à purger avant un refactor sont ceux de Vite/Nitro : `trash frontend/node_modules/.vite frontend/.nitro frontend/.output` (puis relancer `vite dev`).

Rappel patterns SSR-safe : pas de `window`/`localStorage`/`Date.now()`/`Math.random()` dans le rendu ; gate le contenu dépendant du client derrière un état monté (`useIsMounted`) ou un toggle CSS (`max-[749px]:` / `min-[750px]:`). Pour le responsive modale↔drawer, `useIsMobile()` est SSR-safe (false au 1er rendu, maj au montage) car les modales ne montent qu'à l'ouverture.

## Types API partagés (`@poplist/shared`)

Le workspace `@poplist/shared` expose le SDK **généré** (cf. section Kubb
ci-dessous) : `@poplist/shared/generated` (types, clients, hooks react-query,
consommés par front ET mobile) et `@poplist/shared/client-runtime` (transport
injectable par app). Les anciens dossiers manuels `shared/src/entities/` et
`shared/src/api/` n'existent plus.

**Côté frontend** : les modules `frontend/src/api/` (`auth`, `users`,
`watchlists`, `tmdb`) sont des adaptateurs fins sur les clients générés ; les
composants importent `import { watchlists as watchlistsApi, type Watchlist } from '@/api'`
(aliaser à l'import pour éviter le shadowing avec les variables locales).

## SDK généré par Kubb (OpenAPI → types + hooks)

Le contrat API n'est plus écrit à la main : il est **généré** depuis les schémas
zod du backend, via un spec OpenAPI (`hono-openapi`) consommé par Kubb.

**Chaîne** : schémas zod de réponse (`backend/src/schemas/<domain>.schemas.ts`) +
`describeRoute` sur les routes → `shared/openapi.json` → Kubb → types + hooks
react-query + client dans `shared/src/generated/` (commité). Le transport HTTP est
injecté par chaque app (`frontend/src/api/kubb-transport.ts` délègue à `apiFetch`).

**Une seule commande** : `npm run kubb:generate` (régénère spec + SDK).

**Tu es explicitement autorisé à lancer `npm run kubb:generate` toi-même**, sans
demander, dès qu'un changement de schéma le nécessite. C'est une commande locale,
idempotente et sans effet de bord (pas un commit, pas un deploy) : elle fait
partie de la définition de fini d'une modif de contrat, au même titre que le
typecheck. Le job CI `.github/workflows/api-codegen.yml` régénère et fait
`git diff --exit-code` : oublier de régénérer après avoir changé un schéma fait
échouer la CI (garde-fou anti-drift).

**Quand ajouter ou modifier une route backend** :
1. Écrire/ajuster le schéma zod : input dans `backend/src/validators/<domain>.validator.ts`,
   réponse dans `backend/src/schemas/<domain>.schemas.ts` (avec `.meta({ ref })` pour
   les composants réutilisables).
2. Annoter la route avec `describeRoute` (tags, `operationId`, `responses`, et les
   `request.query`/`params` sinon les query params disparaissent du spec).
3. Typer le retour du controller avec `satisfies z.infer<typeof xxxResponseSchema>`.
4. `npm run kubb:generate`, puis vérifier `npm run typecheck` (front + back).
5. Consommer le hook généré (`useXxx`) depuis `@poplist/shared/generated`. Ne pas
   réécrire de méthode SDK ni de type à la main.

**Invalidations** : les query keys générées par Kubb sont par endpoint (pas de
matching par préfixe comme l'ancienne convention `['watchlists', id]`). Utiliser
les helpers de `frontend/src/api/invalidations.ts` (un par domaine) qui regroupent
explicitement les keys générées à invalider. Tout nouveau endpoint GET d'un domaine
doit être ajouté au helper correspondant.

**Ne jamais éditer à la main** `shared/src/generated/**` ni `shared/openapi.json`
(régénérés). L'ancien contrat manuel (`shared/src/api/`, `shared/src/entities/`)
a été supprimé : tout le contrat vit dans les schémas zod backend, le reste est
généré. Pour un nouveau endpoint avec body : annoter aussi `requestBody:
jsonBody(inputSchema)` dans le describeRoute (types de requête générés).
