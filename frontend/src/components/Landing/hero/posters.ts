/**
 * Banque d'images du hero (`frontend/public/landing/movies/`).
 *
 * Ce sont des vignettes 16:14 (des plans de films, pas des affiches 2:3).
 * Chemins normalisés avec un `/` initial — l'ancien fichier en mélangeait
 * avec et sans, ce qui cassait la résolution depuis une route imbriquée.
 */

export const STILL = {
  saw: '/landing/movies/saw3.webp',
  pdc: '/landing/movies/pdc2.webp',
  jinx: '/landing/movies/jinx.webp',
  doa: '/landing/movies/DOA.webp',
  blade2: '/landing/movies/blade2.webp',
  kb: '/landing/movies/kb.webp',
  oceans: '/landing/movies/oceans.webp',
  jake: '/landing/movies/jake.webp',
  passion: '/landing/movies/passion.webp',
  theFifth2: '/landing/movies/theFifth2.webp',
  joker: '/landing/movies/joker.webp',
  fenetre: '/landing/movies/fenetre.webp',
  hp1: '/landing/movies/hp1.webp',
  padre: '/landing/movies/padre.webp',
  pulp: '/landing/movies/pulp.webp',
  western: '/landing/movies/western.webp',
  mercredi: '/landing/movies/mercredi.webp',
  bluetv: '/landing/movies/bluetv.webp',
  damon: '/landing/movies/damon.webp',
  agentsecret: '/landing/movies/007.webp',
  dicap: '/landing/movies/dicap.webp',
  gosling: '/landing/movies/ryangoslingcar.webp',
  brume2049: '/landing/movies/brume2049.webp',
  taxidriver: '/landing/movies/taxidriver.webp',
  herFenetre: '/landing/movies/herFenetre.webp',
  furiosa: '/landing/movies/furiosa.webp',
  madmax: '/landing/movies/madmax.webp',
  oren: '/landing/movies/oren.webp',
  amelie: '/landing/movies/amelie.webp',
  driveHammer: '/landing/movies/driveHammer.webp',
  driveNeon: '/landing/movies/driveNeon.webp',
  lalaland: '/landing/movies/lalaland.webp',
  lalalandNight: '/landing/movies/lalalandNight.webp',
  whiplashOrange: '/landing/movies/whiplashOrange.webp',
  whiplashDrums: '/landing/movies/whiplashDrums.webp',
  budapestRouge: '/landing/movies/budapestRouge.webp',
  inTheMood: '/landing/movies/inTheMood.webp',
  inTheMoodRed: '/landing/movies/inTheMoodRed.webp',
  onceUpon: '/landing/movies/onceUpon.webp',
  dunePaul: '/landing/movies/dunePaul.webp',
  dune2Fire: '/landing/movies/dune2Fire.webp',
  oppenClouds: '/landing/movies/oppenClouds.webp',
  oppenBW: '/landing/movies/oppenBW.webp',
  guns: '/landing/movies/guns.webp',
} as const;

/**
 * V1 — les 3 colonnes d'origine, dans l'ordre exact du hero historique.
 * col1 = 0-4, col2 = 5-9, col3 = 10-14.
 */
export const V1_COLUMNS: string[][] = [
  [STILL.doa, STILL.agentsecret, STILL.joker, STILL.jake, STILL.hp1],
  [STILL.padre, STILL.fenetre, STILL.theFifth2, STILL.jinx, STILL.gosling],
  [STILL.saw, STILL.blade2, STILL.guns, STILL.passion, STILL.pdc],
];

/**
 * V1 — colonnes de gauche conservées.
 *
 * Les deux colonnes les plus à gauche de l'ancienne version (G6 à ~1600px et
 * G7 à ~1150px) sont supprimées : ce sont exactement celles qui n'apparaissent
 * que sur grand écran, là où la grille débordait derrière le texte. Les trois
 * restantes gardent leurs images et leur ordre d'origine.
 */
export const V1_EXTRA_COLUMNS: string[][] = [
  [
    STILL.brume2049,
    STILL.onceUpon,
    STILL.inTheMood,
    STILL.driveNeon,
    STILL.oppenClouds,
    STILL.taxidriver,
    STILL.herFenetre,
  ],
  [
    STILL.blade2,
    STILL.blade2,
    STILL.dicap,
    STILL.saw,
    STILL.mercredi,
    STILL.western,
    STILL.blade2,
  ],
  [
    STILL.fenetre,
    STILL.bluetv,
    STILL.kb,
    STILL.damon,
    STILL.saw,
    STILL.pulp,
    STILL.blade2,
  ],
];

/** Bandeau défilant du mobile. */
export const MOBILE_STRIP: string[] = [
  STILL.doa,
  STILL.oceans,
  STILL.joker,
  STILL.jake,
  STILL.hp1,
  STILL.fenetre,
  STILL.theFifth2,
  STILL.jinx,
  STILL.kb,
  STILL.saw,
  STILL.blade2,
  STILL.pulp,
  STILL.passion,
];
