---
name: Poplist
description: Des listes de films et de séries, créées, partagées, suivies.
colors:
  ink: "hsl(224 15% 4%)"
  surface: "hsl(222 20% 7%)"
  surface-raised: "hsl(218 25% 14%)"
  hairline: "hsl(218 25% 16%)"
  paper: "hsl(210 25% 96%)"
  paper-muted: "hsl(215 15% 55%)"
  marquee: "#38c7ff"
  heading-top: "#fcfdff"
  heading-bottom: "#a7abb3"
  alarm: "hsl(0 62.8% 30.6%)"
typography:
  display:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 5.5vw, 4rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Instrument Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Instrument Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  label:
    fontFamily: "Instrument Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  poster: "8px"
  card: "14px"
  control: "12px"
  pill: "999px"
spacing:
  tight: "8px"
  snug: "12px"
  base: "16px"
  loose: "24px"
  section-gap: "40px"
  section-y: "96px"
components:
  button-primary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "#ffffff"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.paper-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  button-ghost-hover:
    textColor: "{colors.paper}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.paper}"
    rounded: "{rounded.card}"
    padding: "24px"
---

# Design System: Poplist

## Overview

**Creative North Star: "La salle de projection"**

Une salle avant la séance. La pièce est sombre et neutre, presque effacée, et la
seule chose qui a le droit de briller, c'est l'affiche. Tout le reste, les
sièges, les murs, la signalétique, est là pour qu'on regarde ailleurs. Poplist
applique cette règle littéralement : l'interface est le mobilier, les affiches
sont le spectacle.

Concrètement, cela veut dire une interface qui ne fabrique pas sa propre lumière.
Pas de halos, pas de dégradés de remplissage, pas de bordures lumineuses, pas de
fonds colorés qui rivalisent avec les jaquettes. La profondeur vient de trois
paliers de gris bleutés très proches et d'un filet de 1px, jamais d'une ombre
portée décorative. La couleur d'accent existe, mais elle se mérite : elle
désigne l'action à faire, et rien d'autre.

L'anti-référence assumée, c'est la landing SaaS générique : cartes bleutées à
bord dégradé, icône dans une pastille colorée, une description sous chaque titre,
une lueur floue derrière chaque section. C'est exactement ce que ce système
remplace.

**Key Characteristics:**
- Fond quasi noir légèrement bleuté, jamais du noir pur
- Trois paliers de surface seulement, séparés par des écarts très faibles
- Un filet de 1px pour délimiter, pas une ombre
- Une seule couleur d'accent, employée rarement
- Les affiches sont les seuls objets colorés et les seuls à porter une ombre
- Titres en grotesque éditorial serré, corps en grotesque neutre

## Colors

Une palette froide, quasi monochrome, dont l'unique écart chromatique est
l'accent.

### Primary
- **Marquee Cyan** (`#38c7ff`) : l'accent unique. Réservé à l'action principale,
  à l'état actif et aux quelques icônes qui portent un sens fonctionnel. Jamais
  en fond de bloc, jamais en bordure décorative, jamais en dégradé.

### Neutral
- **Encre** (`hsl(224 15% 4%)`) : le fond de la salle. Fond de page unique, sur
  toutes les sections. Aucune section n'a le droit à son propre fond.
- **Surface** (`hsl(222 20% 7%)`) : les cartes et panneaux posés sur l'encre.
  L'écart avec l'encre est volontairement minuscule ; c'est le filet qui fait la
  séparation, pas le contraste.
- **Surface haute** (`hsl(218 25% 14%)`) : contrôles secondaires, champs, états
  survolés.
- **Filet** (`hsl(218 25% 16%)`) : toutes les bordures, à 1px, sans exception.
- **Papier** (`hsl(210 25% 96%)`) : texte principal et fond des boutons
  primaires. C'est le blanc cassé du système ; le blanc pur est réservé aux
  états survolés.
- **Papier atténué** (`hsl(215 15% 55%)`) : la **méta**, celle qui doit
  s'effacer. Compteurs, années, pseudos, légendes, sur-titres. Bleuté et
  volontairement en retrait, 5.6:1 sur l'encre.
- **Copie** (`hsl(200 3% 64%)`) : la **prose qu'on lit vraiment**. Descriptions
  de section, réponses de FAQ, citations, textes de features. Gris quasi
  neutre et nettement plus clair, 7.9:1.

**Pourquoi deux niveaux.** Un seul rôle de texte secondaire faisait les deux
métiers, et aucune valeur ne peut bien faire les deux : assez claire pour lire
un paragraphe, la méta se met à crier ; assez discrète pour la méta, la prose
disparaît. Le bleu y est pour beaucoup — sur un fond froid, un gris bleuté à
55% de luminosité s'efface à la lecture, là où un gris neutre à 64% tient. La
règle : **si le texte est fait pour être lu, c'est `copy` ; s'il est fait pour
être consulté du coin de l'œil, c'est `papier atténué`.**

### Named Rules

**The Marquee Rule.** L'accent apparaît au maximum sur **un** élément par
viewport. S'il y en a deux, il n'y en a plus aucun qui compte.

**The One Room Rule.** Toute la page partage le même fond. Une section ne
change pas de couleur de fond, ne reçoit pas de dégradé et n'a pas de halo pour
signaler qu'elle est une section. Elle se signale par l'espace autour d'elle.

**The No Glow Rule.** Aucun `blur` décoratif, aucune forme floutée en arrière
plan, aucune bordure lumineuse animée. La lumière vient des affiches.

**The Hero Backdrop Exception.** La surface brand a droit à un fond lumineux
composé, à deux endroits seulement : le hero et le CTA final. Une seule teinte,
l'accent **Marquee** en alpha faible (`rgb(56 199 255 / 0.34)` max), posée en
UN spot radial central et toujours recouverte du grain (`.hero-grain`) pour
casser le banding. Pas de spots latéraux (essayés, écartés), jamais de violet,
jamais sans le grain.

## Typography

**Display Font:** Bricolage Grotesque Variable (fallback ui-sans-serif, system-ui)
**Body Font:** Instrument Sans Variable (fallback ui-sans-serif, system-ui)
**Accent Font:** Instrument Serif italique 400 (fallback ui-serif, Georgia) —
compagnon dessiné d'Instrument Sans. **Un seul rôle : un mot du titre du hero
en italique**, contraste de famille plutôt que de couleur (réf. Crème de la
crème). Chargé en italique uniquement. Aucun autre usage autorisé.

**Character:** Bricolage est un grotesque éditorial, un peu tendu, dessiné pour
les grandes tailles : il donne aux titres une présence d'affiche sans costume.
Instrument Sans est neutre, ouvert, très lisible en petit corps : il disparaît
derrière l'information. Le contraste entre les deux est de tension, pas de
style ; ils partagent la même famille de formes.

Les deux sont auto-hébergés via Fontsource, en fichiers variables, jamais servis
par un CDN tiers.

### Hierarchy
- **Display** (600, `clamp(2.5rem, 5.5vw, 4rem)`, lh 1.02, tracking -0.03em) :
  le h1 du hero, une seule occurrence par page.
- **Headline** (600, `clamp(1.75rem, 3vw, 2.5rem)`, lh 1.1, tracking -0.025em) :
  titres hors landing (rôle conservé pour les pages produit).
- **Section** (400, `clamp(1.75rem, 2.8vw, 2.75rem)`, lh 1.2, tracking
  -0.045em) : les h2 de section de la landing, en **Instrument Sans** et
  rendus avec `.effect-font-gradient` (dégradé vertical blanc → gris, validé
  sur le template Strix puis généralisé — exception assumée à la Weight Rule,
  scopée à ce rôle). Alignés à gauche par défaut.
- **Title** (600, 17px, lh 1.35, tracking -0.01em) : titres de carte, de feature,
  d'item de FAQ.
- **Body** (400, 16px, lh 1.6) : paragraphes. Mesure 65 à 75 caractères.
- **Label** (500, 13px, lh 1.4, tracking 0.01em) : boutons, méta, légendes.

### Named Rules

**The Weight Rule.** L'emphase passe par la graisse ou la taille. Jamais par la
couleur, jamais par un dégradé sur le texte, jamais par un soulignement décoratif.

**The Scale Rule.** Aucune taille de texte en dur dans un composant. Tout passe
par les cinq rôles ci-dessus, déclarés dans `@theme`.

**The No Kicker Rule.** Pas de sur-titre au dessus d'un titre. Si le sur-titre
dit la même chose que le titre, il est redondant ; s'il dit autre chose, il
concurrence.

## Layout

Conteneur central à `--maxWidth: 1470px`, largeur utile `--sectionWidth: 93%`.
Le breakpoint produit est **749px** : `max-[749px]:` pour le compact,
`min-[750px]:` pour le confortable. Les breakpoints Tailwind par défaut ne
servent qu'aux ajustements internes déjà en place.

Rythme vertical : les sections respirent à `96px` de padding vertical en
confortable, `56px` en compact. À l'intérieur d'une section, l'espace au dessus
d'un titre est toujours supérieur à l'espace en dessous (typiquement 40px avant,
16px après). Les éléments d'un même groupe restent à 8 ou 12px les uns des
autres.

Grille : les blocs de trois (étapes, témoignages) passent en colonne unique sous
750px, sans carte, avec un filet de séparation horizontal.

### Named Rules

**The Breathing Rule.** Quand une section paraît chargée, on augmente l'espace
avant de réduire le contenu ; si l'espace ne suffit pas, on supprime, on ne
compresse pas.

## Elevation & Depth

Le système est **tonal, pas ombré**. La profondeur vient de l'écart entre
l'encre, la surface et la surface haute, plus un filet de 1px. Aucun composant
d'interface ne porte d'ombre portée.

L'unique exception, et elle est structurante : **les affiches**. Une affiche est
un objet physique dans la pièce, elle a le droit à une ombre douce et à une
perspective. C'est le seul endroit du système où la profondeur est simulée.

### Shadow Vocabulary
- **poster-rest** (`box-shadow: 0 18px 40px -24px rgb(0 0 0 / 0.9)`) : affiche au
  repos dans une composition.
- **poster-front** (`box-shadow: 0 40px 80px -32px rgb(0 0 0 / 0.95)`) : affiche
  au premier plan d'une composition en profondeur.

### Named Rules

**The Flat Interface Rule.** Boutons, cartes, champs et menus sont plats. Si un
élément a besoin de se détacher, il change de palier tonal ou reçoit un filet,
il ne reçoit pas d'ombre.

## Shapes

Rayons : affiches 8px, cartes et panneaux 14px, contrôles 12px, pastilles
totalement arrondies. Les bordures sont toujours à 1px et toujours dans la
couleur filet, jamais en dégradé, jamais simulées par un wrapper coloré d'un
pixel.

La géométrie récurrente du produit, c'est le rectangle d'affiche en 2:3 et la
vignette 16:14 utilisée dans les compositions du hero. Ces deux ratios sont les
seuls formats d'image du système.

## Components

### Buttons
- **Shape:** angles doux (12px), hauteur 44px en confortable, 40px en compact.
- **Primary:** fond papier, texte encre, label 13px en 500. Une seule action
  primaire par écran de défilement. Peut porter une flèche fine
  (`ArrowRight`, stroke 1.5, 16px) quand l'action mène ailleurs.
- **Hover / Focus:** le fond passe au blanc pur, transition 150ms ease-out.
  Focus visible : anneau 2px couleur papier, décalé de 2px.
- **Ghost:** pas de fond, pas de bordure, texte papier atténué qui passe à
  papier au survol. C'est l'action secondaire par défaut du système. Une action
  secondaire n'a jamais de bordure : deux boutons bordés côte à côte, c'est deux
  actions primaires, donc aucune.

### Cards / Containers
- **Corner Style:** 14px.
- **Background:** surface, uni.
- **Shadow Strategy:** aucune, voir Elevation.
- **Border:** filet 1px.
- **Internal Padding:** 24px, 20px en compact.
- La carte est un contenant de dernier recours. Trois blocs de texte alignés dans
  une grille n'ont pas besoin d'être trois cartes.

### Accordion (FAQ)
- Lignes séparées par un filet, pas de carte, pas de fond.
- Le déclencheur est un titre 17px en 600 ; le chevron est le seul indicateur
  d'état, il tourne de 180deg en 200ms.

### Poster
- Ratio 2:3 pour les affiches, 16:14 pour les vignettes de composition.
- Rayon 8px, filet 1px très sombre pour détacher l'affiche du fond,
  ombre `poster-rest` ou `poster-front`.
- Ne jamais animer une affiche au survol. Si un retour visuel est nécessaire,
  c'est le conteneur qui le porte.

## Do's and Don'ts

### Do:
- **Do** n'utiliser qu'un seul fond de page (`ink`) sur toute la longueur.
- **Do** délimiter avec un filet de 1px en `hairline`.
- **Do** réserver `marquee` à une seule chose par viewport.
- **Do** faire porter l'emphase par la graisse et la taille.
- **Do** laisser les affiches être les seuls objets colorés et ombrés.
- **Do** passer par les cinq rôles typographiques déclarés dans `@theme`.
- **Do** supprimer une description qui répète son titre.

### Don't:
- **Don't** utiliser un dégradé pour remplir un fond, simuler une bordure ou
  colorer du texte.
- **Don't** poser une forme floutée en arrière plan d'une section.
- **Don't** mettre une icône dans une pastille ou un carré coloré.
- **Don't** écrire un sur-titre au dessus d'un titre.
- **Don't** utiliser un caractère unicode comme icône ; les icônes viennent de
  lucide-react, en stroke 1.5.
- **Don't** animer une bordure, ni faire tourner un dégradé conique.
- **Don't** empiler une carte dans une carte pour obtenir un effet de bord.
- **Don't** écrire une taille de texte en dur (`text-[40px]`).
