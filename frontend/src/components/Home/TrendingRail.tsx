'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Watchlist } from '@/api';
import { watchlistsQueries } from '@/api/queries';
import { MoviePoster } from '@/components/Home/MoviePoster';
import { TrendingCaption, TrendingFeature } from '@/components/Home/TrendingFeature';
import { getTMDBImageUrl, getTMDBLanguage } from '@/lib/utils';
import { useLanguageStore } from '@/store/language';
import { useIsMobile } from '@/hooks/useIsMobile';

export interface TrendingRailItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  media_type?: 'movie' | 'tv';
  vote_average?: number;
}

interface TrendingRailProps {
  items: TrendingRailItem[];
  watchlists: Watchlist[];
  onOpen: (item: TrendingRailItem, index: number) => void;
  onAddToWatchlist: (watchlistId: string, item: TrendingRailItem) => void;
  onRemoveFromWatchlist: (watchlistId: string, item: TrendingRailItem) => void;
  addToWatchlistLabel: string;
  noWatchlistLabel: string;
}

/** Temps entre deux changements de focus. */
const ROTATION_MS = 6000;
/** Durée de la bascule : glissement de la bande et croissance de la vignette. */
const SHIFT_MS = 600;
/** Vignettes montées dans la bande : les dernières attendent hors champ. */
const STRIP_SLOTS = 6;
/** Demi-durée du saut direct : fondu au noir du rail, puis retour. */
const JUMP_MS = 260;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * Largeur d'une vignette et pas du glissement, exprimés en CSS pour rester
 * exacts à toutes les largeurs : `--slots` porte le nombre d'emplacements
 * visibles (5 en confortable, 3 sous 1100px) et le reste se déduit du gap.
 */
const SLOT_WIDTH = 'w-[calc((100%-(var(--slots)-1)*13px)/var(--slots))]';
const SHIFT_X = 'translateX(calc(-1 * ((100% - (var(--slots) - 1) * 13px) / var(--slots) + 13px)))';

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Morph {
  item: TrendingRailItem;
  from: Box;
  to: Box;
}

function mediaTypeOf(item: TrendingRailItem): 'movie' | 'tv' {
  return item.media_type || (item.title ? 'movie' : 'tv');
}

/**
 * Rail « Tendances » desktop. L'élément en focus occupe toujours la tête de
 * ligne (2 colonnes, backdrop paysage) et la bande de vignettes défile de
 * droite à gauche derrière lui.
 *
 * La bascule est une vraie croissance, pas un simple remplacement : au moment
 * du changement, un calque prend la place et la taille exactes de la première
 * vignette, puis rejoint celles de la tête de ligne (position ET dimensions
 * animées). Pendant ce trajet, l'affiche portrait s'efface sous le backdrop
 * paysage du même titre — déjà préchargé — et le texte monte en opacité. On ne
 * déforme donc jamais une image en l'autre, c'est la boîte qui grandit pendant
 * qu'un fondu s'y opère. L'ancienne tête d'affiche s'efface en parallèle.
 *
 * Deux garde-fous : la rotation s'arrête dès que le pointeur ou le focus
 * clavier entre dans le rail, et sous `prefers-reduced-motion` il ne reste ni
 * rotation, ni glissement, ni croissance.
 */
export function TrendingRail({
  items,
  watchlists,
  onOpen,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  addToWatchlistLabel,
  noWatchlistLabel,
}: TrendingRailProps) {
  const count = items.length;
  const [active, setActive] = useState(0);
  const [shifting, setShifting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [morph, setMorph] = useState<Morph | null>(null);
  /** false = calque à la position de départ, true = transition lancée. */
  const [morphRunning, setMorphRunning] = useState(false);
  /** Saut direct vers un élément non adjacent : 'out' puis 'in'. */
  const [jumping, setJumping] = useState<false | 'out' | 'in'>(false);

  const queryClient = useQueryClient();
  const { language } = useLanguageStore();
  // Le rail est masqué en CSS sous 750px mais reste monté : inutile d'y
  // précharger quoi que ce soit.
  const isMobile = useIsMobile();

  /**
   * Précharge tout ce dont la tête de rail aura besoin : le backdrop ET les
   * détails (durée / saisons). Sans ça, la ligne de méta n'arrive qu'une fois
   * l'élément déjà en place, et on la voit se remplir après coup.
   */
  const prefetch = useCallback(
    (item?: TrendingRailItem) => {
      if (!item || isMobile) return;
      queryClient.prefetchQuery(
        watchlistsQueries.itemDetails(String(item.id), mediaTypeOf(item), getTMDBLanguage(language)),
      );
      const url = getTMDBImageUrl(item.backdrop_path, 'w780');
      if (url && typeof window !== 'undefined') {
        const img = new window.Image();
        img.src = url;
      }
    },
    [queryClient, language, isMobile],
  );

  const railRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const firstSlotRef = useRef<HTMLDivElement>(null);
  const pendingIndex = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const safeActive = count > 0 ? active % count : 0;
  const featured = items[safeActive];
  const incoming = count > 1 ? items[(safeActive + 1) % count] : undefined;

  /** Mesure les deux boîtes et arme le calque de croissance. */
  const startShift = useCallback(() => {
    const rail = railRef.current;
    const feat = featuredRef.current;
    const slot = firstSlotRef.current;
    if (!rail || !feat || !slot || !incoming) return;

    const railBox = rail.getBoundingClientRect();
    const rel = (el: Element): Box => {
      const r = el.getBoundingClientRect();
      return {
        left: r.left - railBox.left,
        top: r.top - railBox.top,
        width: r.width,
        height: r.height,
      };
    };

    setMorph({ item: incoming, from: rel(slot), to: rel(feat) });
    setMorphRunning(false);
    setShifting(true);
  }, [incoming]);

  // Le calque doit être peint à sa position de départ avant qu'on lance la
  // transition, sinon le navigateur fusionne les deux états et rien ne bouge.
  useEffect(() => {
    if (!morph || morphRunning) return;
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setMorphRunning(true)));
    return () => cancelAnimationFrame(raf);
  }, [morph, morphRunning]);

  useEffect(() => {
    if (paused || reducedMotion || count < 2 || jumping) return;
    const id = setInterval(startShift, ROTATION_MS);
    return () => clearInterval(id);
  }, [paused, reducedMotion, count, jumping, startShift]);

  // Saut direct : tout le rail s'efface, on remonte la nouvelle disposition
  // pendant qu'il est invisible, puis il revient. Le changement simultané de
  // toutes les images se fait donc à couvert.
  useEffect(() => {
    if (jumping !== 'out') return;
    const t = setTimeout(() => {
      if (pendingIndex.current !== null) setActive(pendingIndex.current);
      pendingIndex.current = null;
      setJumping('in');
    }, JUMP_MS);
    return () => clearTimeout(t);
  }, [jumping]);

  useEffect(() => {
    if (jumping !== 'in') return;
    const t = setTimeout(() => setJumping(false), JUMP_MS);
    return () => clearTimeout(t);
  }, [jumping]);

  // L'élément en 2e position est le prochain à passer en tête : on le
  // précharge dès qu'il change, sans attendre la bascule.
  useEffect(() => {
    prefetch(incoming);
  }, [incoming, prefetch]);

  useEffect(() => {
    if (!shifting) return;
    const t = setTimeout(() => {
      setActive((i) => (i + 1) % count);
      setShifting(false);
      setMorph(null);
      setMorphRunning(false);
    }, SHIFT_MS);
    return () => clearTimeout(t);
  }, [shifting, count]);

  if (!featured) return null;

  // La bande reprend la suite cyclique juste après l'élément en focus.
  const strip = Array.from(
    { length: Math.min(STRIP_SLOTS, count - 1) },
    (_, k) => items[(safeActive + 1 + k) % count],
  );

  /**
   * Un pas en avant (y compris le retour du dernier au premier, le rail étant
   * cyclique) rejoue exactement l'animation de croissance. Un vrai saut passe
   * par le fondu, parce qu'aucune image à l'écran ne se retrouverait à sa
   * place : les faire toutes changer à découvert donnerait un clignotement.
   */
  const goTo = (i: number) => {
    if (i === safeActive || shifting || jumping) return;
    if (count > 1 && i === (safeActive + 1) % count) {
      startShift();
      return;
    }
    if (reducedMotion) {
      setActive(i);
      return;
    }
    pendingIndex.current = i;
    setJumping('out');
  };

  const box = (b: Box) => ({ left: b.left, top: b.top, width: b.width, height: b.height });

  return (
    <div
      className="max-[749px]:hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        ref={railRef}
        className="relative grid grid-cols-7 items-stretch gap-[13px] max-[1099px]:grid-cols-5"
        style={{
          opacity: jumping === 'out' ? 0 : 1,
          transition: jumping ? `opacity ${JUMP_MS}ms ${EASE}` : undefined,
        }}
      >
        <div
          ref={featuredRef}
          className="col-span-2"
          style={{
            opacity: shifting && !reducedMotion ? 0 : 1,
            transition: shifting && !reducedMotion ? `opacity ${SHIFT_MS}ms ${EASE}` : undefined,
          }}
        >
          <TrendingFeature
            id={featured.id}
            title={featured.title}
            name={featured.name}
            backdropPath={featured.backdrop_path}
            mediaType={mediaTypeOf(featured)}
            voteAverage={featured.vote_average}
            onClick={() => onOpen(featured, safeActive)}
            watchlists={watchlists}
            onAddToWatchlist={(watchlistId) => onAddToWatchlist(watchlistId, featured)}
            onRemoveFromWatchlist={(watchlistId) => onRemoveFromWatchlist(watchlistId, featured)}
            addToWatchlistLabel={addToWatchlistLabel}
            noWatchlistLabel={noWatchlistLabel}
          />
        </div>

        {/* Fondu à droite uniquement, là où la vignette suivante se révèle.
            Rien de visible ne traverse le bord gauche : la vignette qui sort
            est justement celle que le calque de croissance a reprise, donc
            masquée, et la suivante arrive pile au bord. Un fondu à gauche n'y
            ajouterait qu'un voile noir permanent sur l'affiche au repos. */}
        <div className="col-span-5 overflow-hidden mask-[linear-gradient(to_right,black,black_93%,transparent)] [--slots:5] max-[1099px]:col-span-3 max-[1099px]:[--slots:3]">
          <div
            className="flex w-full gap-[13px]"
            style={{
              transform: shifting && !reducedMotion ? SHIFT_X : undefined,
              transition: shifting && !reducedMotion ? `transform ${SHIFT_MS}ms ${EASE}` : undefined,
            }}
          >
            {strip.map((item, i) => (
              <div
                key={item.id}
                ref={i === 0 ? firstSlotRef : undefined}
                className={`${SLOT_WIDTH} shrink-0`}
                // La première vignette est reprise par le calque de croissance
                // pendant la bascule : on ne la montre pas en double.
                style={i === 0 && shifting && !reducedMotion ? { opacity: 0 } : undefined}
              >
                <MoviePoster
                  id={item.id}
                  title={item.title}
                  name={item.name}
                  posterPath={item.poster_path ?? undefined}
                  priority
                  onClick={() => onOpen(item, items.indexOf(item))}
                  watchlists={watchlists}
                  onAddToWatchlist={(watchlistId) => onAddToWatchlist(watchlistId, item)}
                  onRemoveFromWatchlist={(watchlistId) => onRemoveFromWatchlist(watchlistId, item)}
                  addToWatchlistLabel={addToWatchlistLabel}
                  noWatchlistLabel={noWatchlistLabel}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Préchargement du backdrop du prochain focus : quand le calque de
            croissance le révèle, l'image est déjà en cache. */}
        {incoming?.backdrop_path && (
          <img
            src={getTMDBImageUrl(incoming.backdrop_path, 'w780') ?? ''}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute h-px w-px opacity-0"
          />
        )}

        {/* Calque de croissance : de la boîte de la vignette à celle de la
            tête de ligne, pendant que l'affiche cède la place au backdrop. */}
        {morph && !reducedMotion && (
          <div
            aria-hidden="true"
            className="rounded-poster shadow-poster-front pointer-events-none absolute z-20 overflow-hidden"
            style={{
              ...box(morphRunning ? morph.to : morph.from),
              transition: `left ${SHIFT_MS}ms ${EASE}, top ${SHIFT_MS}ms ${EASE}, width ${SHIFT_MS}ms ${EASE}, height ${SHIFT_MS}ms ${EASE}`,
            }}
          >
            {morph.item.poster_path && (
              <img
                src={getTMDBImageUrl(morph.item.poster_path, 'w342') ?? ''}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  opacity: morphRunning ? 0 : 1,
                  transition: `opacity ${SHIFT_MS}ms ${EASE}`,
                }}
              />
            )}
            {morph.item.backdrop_path && (
              <img
                src={getTMDBImageUrl(morph.item.backdrop_path, 'w780') ?? ''}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  opacity: morphRunning ? 1 : 0,
                  transition: `opacity ${SHIFT_MS}ms ${EASE}`,
                }}
              />
            )}
            <div
              className="absolute inset-x-0 bottom-0 p-5"
              style={{ opacity: morphRunning ? 1 : 0, transition: `opacity ${SHIFT_MS}ms ${EASE}` }}
            >
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[200%] bg-linear-to-t from-black/85 via-black/35 to-transparent" />
              {/* Exactement le bloc de la tête de rail : à l'arrivée, il n'y a
                  plus rien à réajuster, donc plus de saut du titre. */}
              <div className="relative">
                <TrendingCaption
                  id={morph.item.id}
                  title={morph.item.title || morph.item.name}
                  mediaType={mediaTypeOf(morph.item)}
                  voteAverage={morph.item.vote_average}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {count > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={item.title || item.name}
              aria-current={i === safeActive ? 'true' : undefined}
              onClick={() => goTo(i)}
              onMouseEnter={() => prefetch(item)}
              onFocus={() => prefetch(item)}
              className="group flex h-11 w-6 cursor-pointer items-center justify-center outline-none"
            >
              <span
                className={
                  i === safeActive
                    ? 'bg-foreground h-1.5 w-5 rounded-full transition-all duration-300'
                    : 'bg-muted-foreground/40 group-hover:bg-muted-foreground group-focus-visible:bg-muted-foreground h-1.5 w-1.5 rounded-full transition-all duration-300'
                }
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
