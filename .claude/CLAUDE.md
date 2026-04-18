# Project Rules — Poplist

- Never use `rm` to delete files or directories. Always use `trash` instead, to allow recovery in case of mistakes.

# Avant de valider une feature

- Vérifie toujours que le build typescript passe

## Tu ne dois jamais commit

- Tu ne dois jamais tenter de commit ou push la seul personne qui fait ça c'est moi
- la seul commande git que tu peux utiliser c'est git history pour voir l'historique des modifications d'un fichier pour le debug

## Erreurs d'hydratation Next.js

Pour toute erreur `Hydration failed because the server rendered HTML didn't match the client`, suivre le protocole du skill `.claude/skills/hydration-diagnosis/SKILL.md` : lire le diff AVANT de toucher au code, distinguer cache SSR obsolète vs vrai bug, proposer `trash .next` avant tout refactor.
