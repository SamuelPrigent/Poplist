# Project Rules — Poplist

- Never use `rm` to delete files or directories. Always use `trash` instead, to allow recovery in case of mistakes.

# Avant de valider une feature

- Vérifie toujours que le build typescript passe

## Tu ne dois jamais commit

- Tu ne dois jamais tenter de commit ou push la seul personne qui fait ça c'est moi
- la seul commande git que tu peux utiliser c'est git history pour voir l'historique des modifications d'un fichier pour le debug

## Erreurs d'hydratation Next.js

Pour toute erreur `Hydration failed because the server rendered HTML didn't match the client`, suivre le protocole du skill `.claude/skills/hydration-diagnosis/SKILL.md` : lire le diff AVANT de toucher au code, distinguer cache SSR obsolète vs vrai bug, proposer `trash .next` avant tout refactor.

## Routes backend Hono + client RPC

L'app utilise un client RPC Hono qui infère les types end-to-end. Pour ajouter, modifier ou debug une route consommée par le frontend, suivre le skill `.claude/skills/hono-rpc/SKILL.md`.

**Utiliser le typage RPC pour** : routes web auth, watchlists, users, tmdb (toutes celles appelées par le frontend Next via `honoAPI`).

**Ne PAS chaîner dans `AppType` (mounter hors chaîne)** :
- Routes mobile (`/auth/mobile/*`) — appelées uniquement par l'app Android
- Routes utilitaires non-JSON (`/image-proxy`, `/health`)

**Pièges critiques à connaître AVANT de toucher à une route** (détails dans le skill) :
1. Middleware ne doit JAMAIS `return c.json(error, 401)` — utiliser `throw HTTPException`
2. Helpers de formatage ne doivent JAMAIS prendre `(x: any)` — typer strict avec Prisma payloads
3. `Map<string, any>` ou `any[]` intermédiaire détruit l'inférence — toujours typer
4. Query params nécessitent `zValidator('query', schema)` pour être typés côté RPC
5. Composants utilisent `honoAPI.x.y()`, jamais `client.x.$y()` directement
