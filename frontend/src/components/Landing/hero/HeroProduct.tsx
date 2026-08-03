'use client';

import { Plus } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Img as Image } from '@/components/ui/Img';
import type { Content } from '@/types/content';
import { HeroCopy, type HeroCopyVariant } from './HeroCopy';

/**
 * Hero « Produit ».
 *
 * Message centré, puis l'application elle-même : le panneau Bibliothèque,
 * incliné vers l'arrière, qui se redresse en parallaxe au scroll (rotateX
 * interpolé 14° → 0°, rAF, coupé par prefers-reduced-motion). C'est LE moment
 * animé de la page.
 *
 * Les cartes répliquent les dimensions réelles de la page Mes listes
 * (`ListCardGrid` : 6 colonnes en xl, gap-2, cover carrée rounded-md,
 * titre 14px semibold, méta 12px) — le panneau doit être crédible, pas
 * une maquette agrandie.
 *
 * Fond : deux spots de couleur (cyan accent + bleu profond) bas de section,
 * recouverts d'un grain SVG (`.hero-grain`) qui casse le banding — la seule
 * zone colorée autorisée de la page (cf. DESIGN.md, exception hero).
 */

const TMDB = 'https://image.tmdb.org/t/p/w154';

type MockList = { title: string; count: number; covers: string[] };

// 12 listes = 2 rangées pleines de 6. La seconde rangée est largement mangée
// par le fondu bas : quelques covers y sont réutilisées, invisible à l'écran.
const LISTS: MockList[] = [
  {
    title: 'Films préférés',
    count: 31,
    covers: [
      `${TMDB}/qJ2tW6WMUDux911r6m7haRef0WH.jpg`,
      `${TMDB}/pEoqbqtLc4CcwDUDqxmEDSWpWTZ.jpg`,
      `${TMDB}/7uPGS5CgvIjDcFUhw9HB9qYeDXf.jpg`,
      `${TMDB}/pkKBYrihVm5kuBgOH04KagSids0.jpg`,
    ],
  },
  {
    title: 'Nostalgie',
    count: 15,
    covers: [
      `${TMDB}/pVLoHNIzKRj75YikaKAcj1d96JS.jpg`,
      `${TMDB}/iCgFtDUZxN8iUzNBCisjUrBmg2q.jpg`,
      `${TMDB}/3nqpcTkODCBhuKuDQJ1dtRhgTqZ.jpg`,
      `${TMDB}/5DmmWDmfEeqeXREEfV0M5AMzfNK.jpg`,
    ],
  },
  {
    title: 'Classiques',
    count: 7,
    covers: [
      `${TMDB}/fbxQ44VRdM2PVzHSNajUseUteem.jpg`,
      `${TMDB}/vpsvHLkoeKUjceIMeNSqCp3xEyY.jpg`,
      `${TMDB}/3zgG4m8ZCaR61O6OOZNAsSDn0rv.jpg`,
      `${TMDB}/5jl5sfhTeAlp60rM9GxoDA2dmX9.jpg`,
    ],
  },
  {
    title: 'À voir à deux',
    count: 12,
    covers: [
      `${TMDB}/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg`,
      `${TMDB}/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg`,
      `${TMDB}/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg`,
      `${TMDB}/5gJOu3t2QrznuJqjCG7FQDMI76t.jpg`,
    ],
  },
  {
    title: 'Séries en cours',
    count: 9,
    covers: [
      `${TMDB}/hVVxgGZFR3JaXmkstnG1IR9Qbt6.jpg`,
      `${TMDB}/ypS7R36Vjcn51zZsXsta5onnaCo.jpg`,
      `${TMDB}/ubDtIBwdS9b29sBofAkqWz3PqkT.jpg`,
      `${TMDB}/xmcOeS0BKCBg5MwM3dfMrSUqyNh.jpg`,
    ],
  },
  {
    title: 'Documentaires',
    count: 5,
    covers: [
      `${TMDB}/bNsjMkRx7TlU8in7RT6fCipYcZn.jpg`,
      `${TMDB}/eAJQgFHFA9QUvvoCPOT9bXPGXUP.jpg`,
      `${TMDB}/kCk4mDFE96Mn1AYfEcbxkIiw7ND.jpg`,
      `${TMDB}/9WbCW2O7x4YWszmaSy9qYHTMafd.jpg`,
    ],
  },
  {
    title: 'Pépites',
    count: 18,
    covers: [
      `${TMDB}/5OPg6M0yHr21Ovs1fni2H1xpKuF.jpg`,
      `${TMDB}/i268GVIlp777W1Ykws5R3LYYLIw.jpg`,
      `${TMDB}/l8CES84JndFlNfBNMxdLRYaLvI6.jpg`,
      `${TMDB}/kD1y7bgbkXvN3RkYogFMlyQR6Ci.jpg`,
    ],
  },
  {
    title: 'En famille',
    count: 22,
    covers: [
      `${TMDB}/n6UChiAOSTHGih2FBactLjA4Cdt.jpg`,
      `${TMDB}/xZhAFR0N2r5q7tJNWaBGzHUaeb5.jpg`,
      `${TMDB}/qI9lkmsC8LURNowxsaAoCX1A97l.jpg`,
      `${TMDB}/fU54mG8yvk7VBA6BI6TDeyrzt5d.jpg`,
    ],
  },
  {
    title: 'Science-fiction',
    count: 14,
    covers: [
      `${TMDB}/qelTNHrBSYjPvwdzsDBPVsqnNzc.jpg`,
      `${TMDB}/mRtFOHF93zW4kTp4JOYrH71vxBh.jpg`,
      `${TMDB}/v5Y8pVwJK68SKQQ1GRbIB1hkPDy.jpg`,
      `${TMDB}/uafMg29wVV4XvxPS59s8nBBbP4i.jpg`,
    ],
  },
  {
    title: 'Cultes',
    count: 26,
    covers: [
      `${TMDB}/zi6RNYK1vXjIvpSBgjatXRcFYh2.jpg`,
      `${TMDB}/5OBK9sksRSyrwrcMtxpdxql75Sw.jpg`,
      `${TMDB}/6H6zVgrRBJouPryTllhY8z3gfB.jpg`,
      `${TMDB}/oShNrYScpLBi4pyOjytPy9BerRr.jpg`,
    ],
  },
  {
    title: 'Animés',
    count: 11,
    covers: [
      `${TMDB}/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg`,
      `${TMDB}/74Oo4hRy9xadpDZGqsWu2XqoNje.jpg`,
      `${TMDB}/ubDtIBwdS9b29sBofAkqWz3PqkT.jpg`,
      `${TMDB}/ypS7R36Vjcn51zZsXsta5onnaCo.jpg`,
    ],
  },
  {
    title: 'Frissons',
    count: 8,
    covers: [
      `${TMDB}/l8CES84JndFlNfBNMxdLRYaLvI6.jpg`,
      `${TMDB}/oShNrYScpLBi4pyOjytPy9BerRr.jpg`,
      `${TMDB}/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg`,
      `${TMDB}/xmcOeS0BKCBg5MwM3dfMrSUqyNh.jpg`,
    ],
  },
];

/** Réplique fidèle d'une carte de la page Mes listes (mêmes proportions). */
function ListCard({ list, eager }: { list: MockList; eager: boolean }) {
  return (
    <div>
      <div className="bg-secondary grid aspect-square grid-cols-2 overflow-hidden rounded-md">
        {list.covers.map((src, i) => (
          <div key={`${list.title}-${i}`} className="relative">
            <Image
              src={src}
              alt=""
              fill
              sizes="110px"
              className="object-cover"
              loading={eager ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-foreground">{list.title}</p>
      <p className="text-muted-foreground mt-0.5 text-xs">{list.count} titres</p>
    </div>
  );
}

function LibraryPanel({ content }: { content: Content }) {
  // Fond opaque, pas de backdrop-blur : le flou de fond sur un panneau de
  // cette taille coûte cher en compositing pour un effet invisible ici.
  return (
    <div className="border-border bg-card rounded-card border p-6 max-[749px]:p-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-title text-foreground">Bibliothèque</h3>
        {/* Réplique du bouton réel de la page Mes listes (non interactif,
            la zone entière est aria-hidden). */}
        <span className="corner-squircle bg-primary text-primary-foreground inline-flex h-9 items-center gap-2 rounded-2xl px-4 text-sm font-medium">
          <Plus className="h-4 w-4" strokeWidth={2} />
          {content.watchlists.createWatchlist}
        </span>
      </div>

      <div className="border-border mt-3 flex gap-1 border-b pb-3">
        <span className="text-label bg-secondary text-foreground rounded-control px-3 py-1.5">
          Mes listes
        </span>
        <span className="text-label text-muted-foreground rounded-control px-3 py-1.5">
          Suivies
        </span>
      </div>

      {/* Mêmes dimensions que ListCardGrid produit : 6 colonnes, gap serré. */}
      <div className="mt-5 grid grid-cols-6 gap-x-2 gap-y-4 max-[749px]:grid-cols-3">
        {LISTS.map((list, i) => (
          <ListCard key={list.title} list={list} eager={i < 6} />
        ))}
      </div>
    </div>
  );
}

export function HeroProduct({
  content,
  ctaUrl,
  copyVariant = 'sobre',
}: {
  content: Content;
  ctaUrl: string;
  copyVariant?: HeroCopyVariant;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Parallaxe : le panneau se redresse (14° → 0°) à mesure qu'il monte dans
  // le viewport. rAF + listener passif, désactivé si reduced-motion.
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.transform = 'perspective(1600px) rotateX(0deg)';
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 quand le haut du panneau est au bas du viewport, 1 vers 25% du haut.
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.75)));
      const angle = 14 * (1 - progress);
      el.style.transform = `perspective(1600px) rotateX(${angle}deg)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="bg-background relative overflow-hidden">
      {/* ── Fond : spots de couleur bas de hero + grain par-dessus ─────────
          Le seul moment coloré de la page. Cyan accent + bleu profond, même
          famille froide que le thème, jamais de violet. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Un seul spot, celui qui culmine sous les boutons / au-dessus du
            panneau (les spots latéraux ont été écartés : validé). */}
        <div
          className="absolute inset-x-0 bottom-0 h-[72%]"
          style={{
            background:
              'radial-gradient(46% 38% at 50% 30%, rgb(56 199 255 / 0.34) 0%, rgb(56 199 255 / 0.12) 45%, transparent 72%)',
          }}
        />
        <div className="hero-grain absolute inset-x-0 bottom-0 h-[72%] opacity-50" />
      </div>

      <div className="relative mx-auto w-[93%] max-w-(--maxWidth)">
        <div className="flex flex-col items-center pt-24 max-[749px]:pt-12">
          <HeroCopy
            content={content}
            ctaUrl={ctaUrl}
            variant={copyVariant}
            align="center"
          />
        </div>
      </div>

      {/* Le produit. Zone décorative, retirée de l'arbre d'accessibilité. */}
      <div aria-hidden className="relative mt-14 max-[749px]:mt-10">
        <div
          ref={panelRef}
          className="mx-auto w-[93%] max-w-[1080px] origin-top will-change-transform"
          style={{ transform: 'perspective(1600px) rotateX(14deg)' }}
        >
          <LibraryPanel content={content} />
        </div>

        {/* Fondu bas : le panneau se dissout dans la section suivante. */}
        <div className="from-background via-background/75 pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-linear-to-t via-45% to-transparent max-[749px]:h-32" />
      </div>
    </section>
  );
}
