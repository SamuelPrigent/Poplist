# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Spectateurs de films et de séries qui accumulent des envies de visionnage sans
jamais les retrouver au moment de choisir. Situation typique : le soir, devant
plusieurs plateformes de streaming, seul ou à deux, avec la question "on regarde
quoi ?". Leur job : capturer une envie quand elle passe (une recommandation, une
bande-annonce, un conseil d'ami), puis la retrouver au moment de décider.

Second public confirmé par le code : les visiteurs non inscrits. Le produit
fonctionne sans compte via des listes locales (`/local/lists`), l'inscription
n'est pas un préalable à la première liste.

*(Inféré du code et de la copy existante, pas d'un entretien. À corriger si
c'est faux.)*

## Product Purpose

Poplist permet de créer des listes de films et de séries, d'y inviter des
collaborateurs qui contribuent en temps réel, de partager une liste par un
simple lien, et de suivre les listes des autres utilisateurs.

Réussite : l'utilisateur ouvre sa liste au moment de choisir un film, et le choix
prend quelques secondes au lieu de quinze minutes de navigation entre
applications.

## Positioning

La liste est l'objet central, pas un accessoire. Les catalogues de streaming
organisent par plateforme et par algorithme ; Poplist organise par intention
humaine : ce que *toi* tu veux voir, ce que *tes amis* te recommandent.

Trois mécanismes qu'un voisin ne pourrait pas copier tels quels :
- la collaboration en temps réel sur une même liste, à plusieurs ;
- le partage par lien seul, sans que le destinataire ait besoin d'un compte ;
- l'usage sans compte, listes locales d'abord, migration ensuite.

## Operating Context

- Consultation surtout le soir, souvent sur mobile web, parfois sur grand écran.
- Décision fréquemment à plusieurs, d'où la collaboration et le partage.
- Le catalogue vient de TMDB (films, séries, affiches, backdrops).
- Exploration par catégorie, par plateforme de streaming et par année
  (`/explore`, `/categories`).
- Produit multilingue : fr, en, de, es, it, pt (`frontend/src/lib/content/`).

## Capabilities and Constraints

Confirmé dans le code :
- création et édition de listes, ajout de films et séries ;
- collaborateurs sur une liste ;
- partage par lien ;
- suivi des listes d'autres utilisateurs, pages utilisateur publiques ;
- exploration par catégorie, plateforme, année ;
- listes locales sans compte, puis compte utilisateur ;
- 6 langues, bascule par un store client (`useLanguageStore`).

Contraintes techniques :
- TanStack Start, React en SSR via Vite 8 + Nitro 3. Tout rendu doit être
  SSR-safe (pas de `window`, `Date.now()`, `Math.random()` au rendu).
- Breakpoint produit maison à **749px** (`max-[749px]:` / `min-[750px]:`),
  utilisé partout plutôt que les breakpoints Tailwind par défaut sur les zones
  déjà écrites.
- Tokens de thème dans `frontend/src/styles.css`, bloc `@theme`.
- Application mobile Expo dans `mobile/` : **hors périmètre**, ne pas y toucher.
- `shared/src/generated/**` et `shared/openapi.json` sont générés par Kubb,
  jamais édités à la main.

Gratuité : la copy annonce "Application gratuite, pas de carte requise". Aucun
modèle payant n'est décidé à ce jour. Ne pas inventer de pricing.

## Brand Commitments

- Nom : **Poplist**.
- Interface sombre. Fond quasi noir légèrement bleuté (`hsl(224 15% 4%)`),
  accent cyan/bleu. C'est l'identité incumbent, elle est conservée.
- L'objet visuel du produit, ce sont les affiches de films et de séries. Toute
  direction artistique doit rester au service de ce contenu, pas le concurrencer.

Point ouvert à trancher : la copy mélange le vouvoiement ("Créez et partagez vos
listes") et le tutoiement ("Commence à créer tes listes facilement", "Ton
univers cinéma"). Une seule voix à choisir.

## Evidence on Hand

- Catalogue réel via TMDB, affiches et backdrops disponibles.
- Une banque d'affiches locales dans `frontend/public/landing/movies/`
  (une cinquantaine de `.webp`), utilisée par le hero.
- Trois avatars dans `frontend/public/landing/avatar/`.
- **Les trois témoignages de la landing (Marie C., Thomas D., Julie M.) ne sont
  pas vérifiés.** Aucun élément du dépôt n'atteste qu'ils viennent de vrais
  utilisateurs. Tant que ce n'est pas confirmé, ne pas en ajouter, ne pas
  inventer de chiffres d'usage, de logos clients, de notes ou de volumétrie.

## Product Principles

1. **La liste avant le catalogue.** Ce que l'utilisateur a choisi passe avant ce
   que la plateforme propose.
2. **Utilisable avant d'être inscrit.** Aucune fonctionnalité de base ne se
   cache derrière un compte.
3. **Le partage se fait en un lien.** Zéro friction pour le destinataire.
4. **L'affiche est le héros.** L'interface est un cadre, pas un décor.
5. **Rien d'inventé.** Pas de preuve sociale fabriquée, pas de promesse que le
   produit ne tient pas.

## Accessibility & Inclusion

Aucune exigence produit spécifique n'a été établie. Standard retenu par défaut :
WCAG AA (contraste corps ≥ 4.5:1, grand texte ≥ 3:1), navigation clavier
complète, focus visible.
