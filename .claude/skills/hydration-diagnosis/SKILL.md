---
name: hydration-diagnosis
description: Diagnose and fix Next.js hydration mismatch errors ("Hydration failed because the server rendered HTML didn't match the client"). Use when the user reports a hydration error, pastes an error with diff showing server vs client HTML, or asks why first-load differs from client navigation. Covers the cache-SSR vs real-code-bug distinction, common triggers (window/localStorage/Date.now/Math.random in render, ungated auth branches), the `useIsMounted` pattern, and the preference for `Edit` over `Write` when editing SSR components.
---

# Diagnostic d'une erreur d'hydratation Next.js

Protocole à suivre quand l'utilisateur signale une erreur `Hydration failed because the server rendered HTML didn't match the client`.

## Étape 1 — Lire le diff AVANT de toucher au code

React affiche un diff SSR vs client dans l'overlay d'erreur. Ce diff décide tout.

**Cas A — Divergence structurelle** (ex: `<svg>` côté serveur vs `<div>` côté client, composant entièrement remplacé par un autre, enfant A devenu enfant B).
→ **Quasi-certainement un cache SSR / Turbopack obsolète**, pas un bug de code. Passer à l'étape 2.

**Cas B — Divergence de valeur sur même structure** (ex: date différente, URL différente, classe conditionnelle différente).
→ **Vrai bug de code**. Passer à l'étape 3.

## Étape 2 — Cas A : cache SSR obsolète

Déclencheur typique : un `Write` (rewrite complet) vient d'être fait sur un composant rendu côté serveur. Fast Refresh / Turbopack gère bien les `Edit` incrémentaux mais laisse parfois un module SSR obsolète après un rewrite structurel.

**Fix prioritaire à proposer à l'utilisateur avant tout refactor :**

```bash
trash .next
# relancer next dev
# puis Cmd+Shift+R dans le navigateur
```

Confirmation que c'est bien le cas A : l'erreur disparaît après le clear. Si elle persiste, c'est finalement le cas B, passer à l'étape 3.

## Étape 3 — Cas B : vrai bug dans le code

Chercher dans le composant incriminé (indiqué dans la stacktrace) :

- `typeof window !== 'undefined'`, `window.*`, `document.*`, `navigator.*` pendant le render → doit être dans un `useEffect`.
- `localStorage`, `sessionStorage` pendant le render → idem.
- `Date.now()`, `new Date()`, `Math.random()`, `performance.now()` pendant le render → idem ou calculer en amont et passer en prop stable.
- Date formatting dépendant de la locale utilisateur (`toLocaleDateString` sans passer une locale fixe) → figer la locale ou effectuer côté client.
- Branches conditionnelles basées sur un état client non SSR-compatible (auth, theme, feature flags) → gater avec le hook `useIsMounted()` du projet (`frontend/src/hooks/useIsMounted.ts`).
- Balisage HTML invalide (ex: `<p>` à l'intérieur d'un `<p>`, `<div>` dans un `<button>`) → peut aussi déclencher un mismatch.

## Règle — détection "client monté"

Utiliser exclusivement `useIsMounted()` du projet. Ne pas inventer d'autres patterns — en particulier, éviter `useSyncExternalStore` avec `getServerSnapshot`/`getSnapshot` divergents : cela déclenche des warnings en React 19 / Next 15.

Exemple correct :
```tsx
const mounted = useIsMounted();
const url = mounted && isAuthenticated ? '/account/lists' : '/local/lists';
```

## Règle d'édition préventive

Privilégier `Edit` (incrémental) à `Write` (rewrite complet) pour modifier un composant existant, même lors d'une refonte significative — y compris quand on remplace un bloc JSX par un autre totalement différent. Cela réduit les accrocs de cache SSR / Fast Refresh en dev.

Si un `Write` complet est nécessaire (création d'un nouveau fichier, refonte large), ajouter une note pour l'utilisateur : « si tu vois une erreur d'hydratation après ce changement, commence par `trash .next` + relance dev server ».
