'use client';

import { Film, Plus } from 'lucide-react';
import Image from 'next/image';

// URLs TMDB pour films connus (w342 = 342px width)
const TMDB_BASE = 'https://image.tmdb.org/t/p/w342';

// Posters de films célèbres - URLs vérifiées sur TMDB
const POSTERS = {
  // Nostalgiques
  harryPotter: `${TMDB_BASE}/fbxQ44VRdM2PVzHSNajUseUteem.jpg`, // Harry Potter 1
  backToFuture: `${TMDB_BASE}/iCgFtDUZxN8iUzNBCisjUrBmg2q.jpg`, // Back to the Future
  gremlins: `${TMDB_BASE}/5DmmWDmfEeqeXREEfV0M5AMzfNK.jpg`, // Gremlins
  casper: `${TMDB_BASE}/pVLoHNIzKRj75YikaKAcj1d96JS.jpg`, // Casper
  goonies: `${TMDB_BASE}/7EcRgdCjQriST92SzIenogw77kJ.jpg`, // The Goonies
  et: `${TMDB_BASE}/5jl5sfhTeAlp60rM9GxoDA2dmX9.jpg`, // E.T.
  // Classiques
  lotr: `${TMDB_BASE}/5OPg6M0yHr21Ovs1fni2H1xpKuF.jpg`, // LOTR Fellowship
  titanic: `${TMDB_BASE}/vpsvHLkoeKUjceIMeNSqCp3xEyY.jpg`, // Titanic
  blade2: `${TMDB_BASE}/yDHwo3eWcMiy5LnnEnlGV9iLu9k.jpg`, // Blade 2
  forrestGump: `${TMDB_BASE}/zi6RNYK1vXjIvpSBgjatXRcFYh2.jpg`, // Forrest Gump
  // Favoris
  gladiator: `${TMDB_BASE}/5gJOu3t2QrznuJqjCG7FQDMI76t.jpg`, // Gladiator
  starWars: `${TMDB_BASE}/qelTNHrBSYjPvwdzsDBPVsqnNzc.jpg`, // Star Wars IV
  matrix: `${TMDB_BASE}/pEoqbqtLc4CcwDUDqxmEDSWpWTZ.jpg`, // Matrix
  indianaJones: `${TMDB_BASE}/kD1y7bgbkXvN3RkYogFMlyQR6Ci.jpg`, // Indiana Jones
  // Action/Sci-Fi
  jurassicPark: `${TMDB_BASE}/i268GVIlp777W1Ykws5R3LYYLIw.jpg`, // Jurassic Park
  ghostbusters: `${TMDB_BASE}/6H6zVgrRBJouPryTllhY8z3gfB.jpg`, // Ghostbusters
  terminator1: `${TMDB_BASE}/oShNrYScpLBi4pyOjytPy9BerRr.jpg`, // Terminator 1
  terminator2: `${TMDB_BASE}/mRtFOHF93zW4kTp4JOYrH71vxBh.jpg`, // Terminator 2
  alien1: `${TMDB_BASE}/l8CES84JndFlNfBNMxdLRYaLvI6.jpg`, // Alien
  aliens: `${TMDB_BASE}/uafMg29wVV4XvxPS59s8nBBbP4i.jpg`, // Aliens
  // Thrillers/Drames
  fightClub: `${TMDB_BASE}/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg`, // Fight Club
  inception: `${TMDB_BASE}/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg`, // Inception
  shawshank: `${TMDB_BASE}/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg`, // Shawshank Redemption
  darkKnight: `${TMDB_BASE}/qJ2tW6WMUDux911r6m7haRef0WH.jpg`, // The Dark Knight
  // Star Wars
  starWars2: `${TMDB_BASE}/3nqpcTkODCBhuKuDQJ1dtRhgTqZ.jpg`, // Star Wars Episode II
  // Disney/Animation
  abominable: `${TMDB_BASE}/fU54mG8yvk7VBA6BI6TDeyrzt5d.jpg`, // Abominable
  tarzan: `${TMDB_BASE}/qI9lkmsC8LURNowxsaAoCX1A97l.jpg`, // Tarzan
  lionKing: `${TMDB_BASE}/n6UChiAOSTHGih2FBactLjA4Cdt.jpg`, // The Lion King
  tangled: `${TMDB_BASE}/xZhAFR0N2r5q7tJNWaBGzHUaeb5.jpg`, // Tangled/Raiponce
  // LOTR
  lotr2: `${TMDB_BASE}/qVHBqQYLDRs7ESjP9q6o9iPHLWj.jpg`, // LOTR The Two Towers
  // Autres
  avatar: `${TMDB_BASE}/v5Y8pVwJK68SKQQ1GRbIB1hkPDy.jpg`, // Avatar
  spiderverse: `${TMDB_BASE}/7uPGS5CgvIjDcFUhw9HB9qYeDXf.jpg`, // Spider-Man: Into the Spider-Verse
  // Anime/Animation
  arcane: `${TMDB_BASE}/ypS7R36Vjcn51zZsXsta5onnaCo.jpg`, // Arcane
  castlevania: `${TMDB_BASE}/ubDtIBwdS9b29sBofAkqWz3PqkT.jpg`, // Castlevania
  cyberpunk: `${TMDB_BASE}/74Oo4hRy9xadpDZGqsWu2XqoNje.jpg`, // Cyberpunk Edgerunners
  demonSlayer: `${TMDB_BASE}/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg`, // Demon Slayer
  // Documentaires
  oceans: `${TMDB_BASE}/bNsjMkRx7TlU8in7RT6fCipYcZn.jpg`, // Oceans
  home: `${TMDB_BASE}/eAJQgFHFA9QUvvoCPOT9bXPGXUP.jpg`, // Home
  laGrotte: `${TMDB_BASE}/f2fBa4j7GepCyu4ZfHBtElwG4ce.jpg`, // La Grotte (The Rescue 2021 - National Geographic)
  fedUp: `${TMDB_BASE}/tiS6NjxcMzui3AMgOanQFrQnYUA.jpg`, // Fed Up
  // Action
  salt: `${TMDB_BASE}/xFpKPLer87KVLVrob85zVSjU9ZJ.jpg`, // Salt
  troy: `${TMDB_BASE}/pkKBYrihVm5kuBgOH04KagSids0.jpg`, // Troy
  theMask: `${TMDB_BASE}/5OBK9sksRSyrwrcMtxpdxql75Sw.jpg`, // The Mask
  earth: `${TMDB_BASE}/ofTa5x4zUSjdFjItx3L0fs6y0Mq.jpg`, // Un jour sur Terre (Earth)
  merlin: `${TMDB_BASE}/fht7xph50bzcvtfsPkcrHRSPYcT.jpg`, // Merlin l'enchanteur 1963 Disney (The Sword in the Stone)
  blackfish: `${TMDB_BASE}/kCk4mDFE96Mn1AYfEcbxkIiw7ND.jpg`, // Blackfish
  socialDilemma: `${TMDB_BASE}/9WbCW2O7x4YWszmaSy9qYHTMafd.jpg`, // Derrière nos écrans de fumée (The Social Dilemma)
  vikings: `${TMDB_BASE}/xmcOeS0BKCBg5MwM3dfMrSUqyNh.jpg`, // Vikings (série)
  breakingBad: `${TMDB_BASE}/hVVxgGZFR3JaXmkstnG1IR9Qbt6.jpg`, // Breaking Bad
  xmen: `${TMDB_BASE}/3zgG4m8ZCaR61O6OOZNAsSDn0rv.jpg`, // X-Men (2000)
};

// Sets d'images pour chaque liste - AUCUN DOUBLON entre listes
const LIST_IMAGES = {
  // Ligne 1
  classiques: [POSTERS.harryPotter, POSTERS.titanic, POSTERS.xmen, POSTERS.et],
  nostalgie: [POSTERS.casper, POSTERS.backToFuture, POSTERS.starWars2, POSTERS.gremlins],
  aventure: [POSTERS.home, POSTERS.laGrotte, POSTERS.blackfish, POSTERS.socialDilemma],
  // Ligne 2
  favorites: [POSTERS.troy, POSTERS.darkKnight, POSTERS.matrix, POSTERS.spiderverse],
  toWatch: [POSTERS.abominable, POSTERS.tarzan, POSTERS.lionKing, POSTERS.merlin],
  thrillers: [POSTERS.vikings, POSTERS.inception, POSTERS.breakingBad, POSTERS.shawshank],
};

// ============================================
// Schéma fidèle au vrai design ListCard
// Grille 2x2 de posters + footer avec titre/count
// ============================================

// Mode d'affichage: 'poster' = grille 2x2, 'backdrop' = image bannière horizontale
type ThumbnailMode = 'poster' | 'backdrop';

// Mock d'une ListCard (basé sur le vrai composant)
function MockListCard({
  title,
  count,
  posters = 4,
  variant = 'default',
  images,
  thumbnailMode = 'poster',
}: {
  title: string;
  count: number;
  posters?: number;
  variant?: 'default' | 'empty' | 'create';
  images?: string[];
  thumbnailMode?: ThumbnailMode;
}) {
  if (variant === 'create') {
    return (
      <div className="group cursor-pointer rounded-lg p-2 transition-colors hover:bg-[#36363780]">
        {/* Cover - bouton créer */}
        <div className="bg-muted/30 relative mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-white/20 transition-all group-hover:border-blue-500/50 group-hover:bg-blue-500/10">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
              <Plus className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-xs text-gray-400">Nouvelle liste</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'empty') {
    return (
      <div className="rounded-lg p-2 opacity-40">
        {/* Cover vide */}
        <div className="bg-muted/20 relative mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-md">
          <Film className="h-8 w-8 text-gray-600" />
        </div>
      </div>
    );
  }

  // Mode backdrop: une seule image bannière horizontale
  if (thumbnailMode === 'backdrop') {
    return (
      <div className="group cursor-pointer rounded-lg p-2 transition-colors hover:bg-[#36363780]">
        {/* Cover - Image bannière horizontale */}
        <div className="bg-muted relative mb-3 aspect-video w-full overflow-hidden rounded-md">
          {images && images[0] && (
            <Image src={images[0]} alt="" fill className="object-cover" sizes="160px" />
          )}
          {(!images || !images[0]) && (
            <div className="h-full w-full bg-linear-to-br from-gray-600/60 to-gray-700/60" />
          )}
        </div>

        {/* Footer - Titre + Count */}
        <div className="flex items-center gap-1">
          <h3 className="line-clamp-1 text-sm font-semibold text-white">{title}</h3>
        </div>
        <div className="text-muted-foreground mt-1 text-xs">
          {count} {count === 1 ? 'élément' : 'éléments'}
        </div>
      </div>
    );
  }

  // Mode poster: Grille 2x2 de posters (par défaut)
  return (
    <div className="group cursor-pointer rounded-lg p-2 transition-colors hover:bg-[#36363780]">
      {/* Cover - Grille 2x2 de posters (comme le vrai thumbnail) */}
      <div className="bg-muted relative mb-3 aspect-square w-full overflow-hidden rounded-md">
        <div className="grid h-full w-full grid-cols-2 grid-rows-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`relative ${i < posters ? '' : 'bg-gray-800/40'}`}>
              {i < posters && images && images[i] && (
                <Image src={images[i]} alt="" fill className="object-cover" sizes="80px" />
              )}
              {i < posters && (!images || !images[i]) && (
                <div className="h-full w-full bg-linear-to-br from-gray-600/60 to-gray-700/60" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer - Titre + Count (comme le vrai ListCard) */}
      <div className="flex items-center gap-1">
        <h3 className="line-clamp-1 text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="text-muted-foreground mt-1 text-xs">
        {count} {count === 1 ? 'élément' : 'éléments'}
      </div>
    </div>
  );
}

// ============================================
// V1 - Preview simple "Mes listes" (grille de cards)
// ============================================
export function RightSectionPreviewV1() {
  return (
    <div className="relative">
      {/* Container avec effet glass */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a1628]/80 p-4 backdrop-blur-sm">
        {/* Header */}
        <div className="mb-4 px-2">
          <h3 className="text-base font-semibold text-white">Bibliothèque</h3>
          <p className="text-xs text-gray-400">Vos listes personnelles</p>
        </div>

        {/* Grille de ListCards mockées */}
        <div className="grid grid-cols-2 gap-1">
          <MockListCard title="Films 2024" count={12} posters={4} />
          <MockListCard title="Séries à voir" count={8} posters={3} />
          <MockListCard title="" count={0} variant="create" />
          <MockListCard title="" count={0} variant="empty" />
        </div>

        {/* Gradient fade en bas */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-[#0a1628] to-transparent" />
      </div>
    </div>
  );
}

// ============================================
// V2 - Preview avec overflow - cards qui débordent du parent
// ============================================
export function RightSectionPreviewV2() {
  return (
    <div className="relative">
      {/* Parent avec taille fixe - les enfants débordent et sont coupés */}
      <div className="relative h-[450px] w-full max-w-[550px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a1628]/80 p-4 backdrop-blur-sm">
        {/* Header avec tabs */}
        <div className="mb-3 px-2">
          <h3 className="text-base font-semibold text-white">Bibliothèque</h3>
          <div className="mt-2 flex gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              Mes listes
            </span>
            <span className="rounded-full px-3 py-1 text-xs text-gray-500">Suivies</span>
          </div>
        </div>

        {/* Grille qui déborde - cards 35% plus grandes grâce à min-width */}
        <div className="grid min-w-[530px] grid-cols-3 gap-3">
          {/* Ligne 1 */}
          <MockListCard
            title="Films préférés"
            count={31}
            posters={4}
            images={LIST_IMAGES.favorites}
          />
          <MockListCard title="Nostalgie" count={15} posters={4} images={LIST_IMAGES.nostalgie} />
          <MockListCard title="Classiques" count={7} posters={4} images={LIST_IMAGES.classiques} />
          {/* Ligne 2 */}
          <MockListCard title="Aventure" count={12} posters={4} images={LIST_IMAGES.aventure} />
          <MockListCard title="À voir" count={9} posters={4} images={LIST_IMAGES.toWatch} />
          <MockListCard title="Thrillers" count={5} posters={4} images={LIST_IMAGES.thrillers} />
        </div>

        {/* Gradient fade right - coupe la 3ème colonne */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[25%] bg-linear-to-l from-[#0b1120] via-[#0b1120]/90 to-transparent" />
        {/* Gradient fade bottom - coupe la 2ème rangée */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-[#0b1120] via-[#0b1120]/80 to-transparent" />
      </div>
    </div>
  );
}

// ============================================
// V3 - Test avec thumbnails backdrop (bannière horizontale)
// ============================================
export function RightSectionPreviewV3() {
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a1628]/80 p-4 backdrop-blur-sm">
        {/* Header avec tabs */}
        <div className="mb-3 px-2">
          <h3 className="text-base font-semibold text-white">Bibliothèque</h3>
          <div className="mt-2 flex gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              Mes listes
            </span>
            <span className="rounded-full px-3 py-1 text-xs text-gray-500">Suivies</span>
          </div>
        </div>

        {/* Grille 2 colonnes avec thumbnails backdrop */}
        <div className="grid grid-cols-2 gap-2">
          <MockListCard
            title="Classiques"
            count={31}
            images={LIST_IMAGES.classiques}
            thumbnailMode="backdrop"
          />
          <MockListCard
            title="Nostalgie"
            count={15}
            images={LIST_IMAGES.nostalgie}
            thumbnailMode="backdrop"
          />
          <MockListCard
            title="Aventure"
            count={7}
            images={LIST_IMAGES.aventure}
            thumbnailMode="backdrop"
          />
          <MockListCard
            title="Favorites"
            count={12}
            images={LIST_IMAGES.favorites}
            thumbnailMode="backdrop"
          />
        </div>

        {/* Gradient fade right */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[10%] bg-linear-to-l from-[#0a1628] to-transparent" />
        {/* Gradient fade bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-[#0a1628] to-transparent" />
      </div>
    </div>
  );
}

// ============================================
// Export par défaut
// ============================================
// export function RightSectionPreview() {
//   return <RightSectionPreviewV1 />;
//   // return <RightSectionPreviewV2 />;
//   // return <RightSectionPreviewV3 />; // Test backdrop thumbnails
// }

// ============================================
// ANCIEN CODE (screenshot)
// ============================================

export function RightSectionPreview() {
  return (
    <div className="relative">
      <div className="border-border relative overflow-hidden rounded-[30px] border-4">
        <div className="relative aspect-9/6">
          <Image
            src="/preview/watchlists1.webp"
            alt="Apercu de l'application Poplist"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1920px) 45vw, 900px"
            className="relative top-[10px] left-[-21px] object-cover object-left"
            quality={95}
            priority
          />
        </div>
        <div className="to-background pointer-events-none absolute inset-0 bg-linear-to-r from-transparent via-transparent"></div>
      </div>
    </div>
  );
}
