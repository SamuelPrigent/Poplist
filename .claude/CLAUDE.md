# Project Rules — Poplist

- Never use `rm` to delete files or directories. Always use `trash` instead, to allow recovery in case of mistakes.

# Avant de valider une feature

- Vérifie toujours que le build typescript passe

## Tu ne dois jamais commit

- Tu ne dois jamais tenter de commit ou push la seul personne qui fait ça c'est moi
- la seul commande git que tu peux utiliser c'est git history pour voir l'historique des modifications d'un fichier pour le debug

## Erreurs d'hydratation Next.js

Pour toute erreur `Hydration failed because the server rendered HTML didn't match the client`, suivre le protocole du skill `.claude/skills/hydration-diagnosis/SKILL.md` : lire le diff AVANT de toucher au code, distinguer cache SSR obsolète vs vrai bug, proposer `trash .next` avant tout refactor.

## Types API partagés (`@poplist/shared`)

Le repo utilise un workspace npm `@poplist/shared` qui définit les types partagés entre backend et frontend.

**Structure** :
- `shared/src/entities/` : types des entités du domaine (User, Watchlist, WatchlistItem, Platform, etc.)
- `shared/src/api/` : contracts Request/Response par endpoint, namespaced (`AuthAPI`, `WatchlistsAPI`, etc.)

**Côté backend** : importer les types depuis `@poplist/shared` et utiliser `satisfies XxxResponse` sur les `c.json(...)` pour garantir la conformité contractuelle.

**Côté frontend** : SDK manuel dans `frontend/src/api/` (modules `auth`, `users`, `watchlists`, `tmdb`) qui utilise `apiFetch<T>` (throw on error). Les composants importent `import { watchlists as watchlistsApi, type Watchlist } from '@/api'`.

**Convention de nommage** : pour éviter le shadowing avec les variables locales (`const watchlists = ...`), aliaser à l'import : `watchlists as watchlistsApi`, `users as usersApi`, etc.

**Quand ajouter ou modifier une route backend** :
1. Définir le type Request/Response dans `shared/src/api/<domain>.ts`
2. Implémenter le handler backend en typant le retour avec `satisfies XxxResponse`
3. Ajouter la méthode dans le SDK frontend correspondant (`frontend/src/api/<domain>.ts`)
4. Si la route est consommée par mobile uniquement, pas besoin de l'ajouter au SDK frontend
