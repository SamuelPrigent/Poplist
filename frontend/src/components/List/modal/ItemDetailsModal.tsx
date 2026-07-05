'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ArrowLeft, Calendar, CirclePlus, Clock, Film, Plus, Star, X } from 'lucide-react';
import { Img as Image } from '@/components/ui/Img';
import { domAnimation, LazyMotion, m } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { NavigationArrows } from '@/components/ui/navigation-arrows';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer';
import { PosterGrid } from '@/components/List/PosterGrid';
import { useBackHandler } from '@/hooks/useBackHandler';
import { useIsMobile } from '@/hooks/useIsMobile';
import { watchlists as watchlistsApi } from '@/api';
import type { FullMediaDetails, Watchlist } from '@/api';
import { fetchTMDBProviders } from '@/api';
import { cn } from '@/lib/cn';
import { getTMDBLanguage, getTMDBRegion, resizeTMDBPoster } from '@/lib/utils';
import { useLanguageStore } from '@/store/language';
import { WatchlistPickerMenu } from '../WatchlistPickerMenu';
import { WatchProviderList } from '../WatchProviderBubble';

interface ItemDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tmdbId: string;
  type: 'movie' | 'tv';
  platforms?: Array<{ name: string; logoPath: string }>;
  onPrevious?: () => void;
  onNext?: () => void;
  watchlists?: Watchlist[];
  onAddToWatchlist?: (watchlistId: string) => void;
  onRemoveFromWatchlist?: (watchlistId: string) => void;
  isAuthenticated?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers purs
// ---------------------------------------------------------------------------
function formatRuntime(minutes: number | undefined) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

function formatYear(dateString: string) {
  if (!dateString) return null;
  return new Date(dateString).getFullYear();
}

function formatRating(rating: number) {
  return (rating / 2).toFixed(1);
}

function StarRating({
  rating,
  voteCount,
  votesLabel,
}: {
  rating: number;
  voteCount: number;
  votesLabel: string;
}) {
  const stars = rating / 2;
  const fullStars = Math.floor(stars);
  const hasHalfStar = stars % 1 >= 0.5;
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4].map((index) => (
        <Star
          key={`star-${index}`}
          className={cn(
            'h-4 w-4',
            index < fullStars
              ? 'fill-yellow-400 text-yellow-400'
              : index === fullStars && hasHalfStar
                ? 'fill-yellow-400/50 text-yellow-400'
                : 'text-muted-foreground',
          )}
        />
      ))}
      <span className="ml-2 text-sm font-medium">{formatRating(rating)} / 5</span>
      <span className="ml-1 text-xs text-white/70">
        ({voteCount} {votesLabel})
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hook partagé : fetch + états UI, consommé par les deux shells.
// ---------------------------------------------------------------------------
function useItemDetails({
  open,
  tmdbId,
  type,
  platforms,
  skipProviders = false,
}: {
  open: boolean;
  tmdbId: string;
  type: 'movie' | 'tv';
  platforms: Array<{ name: string; logoPath: string }>;
  /** true → ne fetch jamais les providers TMDB (drawer mobile : non affichés) */
  skipProviders?: boolean;
}) {
  const { language, content } = useLanguageStore();
  const [details, setDetails] = useState<FullMediaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [showSeeMore, setShowSeeMore] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [loadedActorImages, setLoadedActorImages] = useState<Set<string>>(new Set());
  const [fetchedPlatforms, setFetchedPlatforms] = useState<
    Array<{ name: string; logoPath: string }>
  >([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const overviewRef = useRef<HTMLParagraphElement>(null);
  const prevTmdbIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);

  const languageCode = getTMDBLanguage(language);
  const region = getTMDBRegion(language);
  const voiceTranslation = language === 'fr' ? 'voix' : language === 'es' ? 'voz' : 'voice';

  useEffect(() => {
    if (!open) {
      prevTmdbIdRef.current = null;
      hasLoadedRef.current = false;
      return;
    }

    const isNavigation =
      prevTmdbIdRef.current !== null && prevTmdbIdRef.current !== tmdbId && hasLoadedRef.current;
    prevTmdbIdRef.current = tmdbId;

    setIsOverviewExpanded(false);
    setShowSeeMore(false);
    setPosterLoaded(false);
    setLoadedActorImages(new Set());
    setFetchedPlatforms([]);

    if (isNavigation) {
      setIsNavigating(true);
    } else {
      setLoading(true);
    }

    const fetchDetails = async () => {
      setError(null);
      try {
        const detailsPromise = watchlistsApi.getItemDetails(tmdbId, type, languageCode);
        const providersPromise =
          !skipProviders && platforms.length === 0
            ? fetchTMDBProviders(tmdbId, type, region)
            : Promise.resolve([]);

        const [detailsRes, providersRes] = await Promise.all([detailsPromise, providersPromise]);
        setDetails(detailsRes.details);
        if (providersRes.length > 0) setFetchedPlatforms(providersRes);
        hasLoadedRef.current = true;
      } catch (err) {
        console.error('Failed to fetch item details:', err);
        setError(null);
        setDetails(null);
        hasLoadedRef.current = false;
      } finally {
        setLoading(false);
        setIsNavigating(false);
      }
    };

    void fetchDetails();
  }, [open, tmdbId, type, languageCode, platforms.length, region, skipProviders]);

  // Check if overview is truncated and needs "see more" button
  useEffect(() => {
    if (!details?.overview || isOverviewExpanded) {
      setShowSeeMore(false);
      return;
    }
    const checkTruncation = () => {
      if (overviewRef.current) {
        setShowSeeMore(overviewRef.current.scrollHeight > overviewRef.current.clientHeight);
      }
    };
    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [details?.overview, isOverviewExpanded]);

  const markActorLoaded = (url: string) =>
    setLoadedActorImages((prev) => {
      const next = new Set(prev);
      next.add(url);
      return next;
    });

  return {
    content,
    details,
    loading,
    isNavigating,
    isOverviewExpanded,
    setIsOverviewExpanded,
    showSeeMore,
    overviewRef,
    posterLoaded,
    setPosterLoaded,
    loadedActorImages,
    markActorLoaded,
    effectivePlatforms: platforms.length > 0 ? platforms : fetchedPlatforms,
    voiceTranslation,
  };
}

// ===========================================================================
// Switcher : < 750px → drawer bottom (maquette), sinon modale desktop.
// ===========================================================================
export function ItemDetailsModal(props: ItemDetailsModalProps) {
  const isMobile = useIsMobile();
  return isMobile ? <ItemDetailsDrawerShell {...props} /> : <ItemDetailsModalShell {...props} />;
}

// ===========================================================================
// Shell drawer (mobile) — selon la maquette.
// ===========================================================================
function ItemDetailsDrawerShell({
  open,
  onOpenChange,
  tmdbId,
  type,
  platforms = [],
  watchlists,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  isAuthenticated = false,
}: ItemDetailsModalProps) {
  const {
    content,
    details,
    loading,
    isNavigating,
    isOverviewExpanded,
    setIsOverviewExpanded,
    showSeeMore,
    overviewRef,
    loadedActorImages,
    markActorLoaded,
    voiceTranslation,
  } = useItemDetails({ open, tmdbId, type, platforms, skipProviders: true });

  const canPick = !!(isAuthenticated && watchlists && onAddToWatchlist && onRemoveFromWatchlist);
  // Sous-vue interne : 'details' (fiche) ou 'pick' (liste des watchlists, cf. maquette).
  const [view, setView] = useState<'details' | 'pick'>('details');
  useEffect(() => {
    if (!open) setView('details');
  }, [open]);

  // Bouton retour (Android) sur la sous-vue "pick" → revient à la fiche (le
  // niveau drawer est géré par le composant Drawer partagé).
  useBackHandler(open && view === 'pick', () => setView('details'));

  const metaParts = details
    ? [
        type === 'movie'
          ? content.watchlists.contentTypes.movie
          : content.watchlists.contentTypes.series,
        type === 'movie'
          ? formatRuntime(details.runtime)
          : details.numberOfSeasons
            ? `${details.numberOfSeasons} ${details.numberOfSeasons > 1 ? content.watchlists.seriesInfo.seasons : content.watchlists.seriesInfo.season}`
            : null,
        formatYear(details.releaseDate),
      ].filter(Boolean)
    : [];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {/* Hauteur naturelle (plafonnée) : le drawer épouse son contenu au lieu
          d'imposer 85dvh avec du vide sous le bouton Ajouter */}
      <DrawerContent className="max-h-[78dvh]">
        <DrawerTitle className="sr-only">
          {details?.title || content.watchlists.itemDetails.mediaDetails}
        </DrawerTitle>
        <DrawerDescription className="sr-only">
          {details
            ? `${content.watchlists.itemDetails.mediaDetails} — ${details.title}`
            : content.watchlists.itemDetails.loadingDetails}
        </DrawerDescription>

        {loading || isNavigating ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-muted-foreground">{content.watchlists.itemDetails.loading}</div>
          </div>
        ) : !details ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-muted-foreground">
              {content.watchlists.itemDetails.notAvailable}
            </div>
          </div>
        ) : view === 'pick' && canPick ? (
          // ---- Sous-vue : ajouter à une liste ----
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-border/60 relative flex items-center justify-center border-b px-4 pb-3">
              <button
                type="button"
                onClick={() => setView('details')}
                className="text-muted-foreground hover:text-foreground absolute left-3 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                aria-label="Retour"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h3 className="text-base font-semibold">{content.watchlists.addToWatchlist}</h3>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              {watchlists!.length === 0 ? (
                <div className="text-muted-foreground px-2 py-6 text-center text-sm">
                  {content.watchlists.noWatchlist}
                </div>
              ) : (
                watchlists!.map((wl) => {
                  const isIn = wl.items.some((it) => it.tmdbId === Number(tmdbId));
                  return (
                    <button
                      key={wl.id}
                      type="button"
                      onClick={() =>
                        isIn ? onRemoveFromWatchlist!(wl.id) : onAddToWatchlist!(wl.id)
                      }
                      className="hover:bg-muted/50 flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors"
                    >
                      <div className="bg-muted relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                        {wl.imageUrl ? (
                          <Image
                            src={wl.imageUrl}
                            alt={wl.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : wl.items.length > 0 ? (
                          <PosterGrid items={wl.items} alt={wl.name} imageSize="w92" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Film strokeWidth={1} className="text-muted-foreground h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{wl.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {wl.items.length} {content.watchlists.items}
                        </div>
                      </div>
                      {isIn ? (
                        <Image
                          src="/checkGreenFull.svg"
                          alt=""
                          width={24}
                          height={24}
                          className="h-6 w-6 shrink-0"
                        />
                      ) : (
                        <CirclePlus
                          className="text-muted-foreground h-6 w-6 shrink-0"
                          strokeWidth={1.6}
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          // ---- Vue fiche ----
          <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pt-1 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            {/* Close */}
            <DrawerClose className="text-muted-foreground hover:text-foreground absolute top-[-2.5px] right-[7px] z-10 flex h-8 w-8 items-center justify-center rounded-full bg-transparent transition-colors">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DrawerClose>

            {/* Header : poster + méta */}
            <div className="flex gap-4 pr-9">
              <div className="bg-muted relative h-36 w-24 shrink-0 overflow-hidden rounded-lg">
                {details.posterUrl ? (
                  <Image
                    src={resizeTMDBPoster(details.posterUrl, 'w185')}
                    alt={details.title}
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="from-muted to-muted/30 h-full w-full bg-linear-to-br" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="line-clamp-2 text-xl leading-tight font-bold mask-[linear-gradient(to_right,black,black_85%,transparent)]">
                  {details.title}
                </h2>
                <p className="text-muted-foreground mt-1.5 text-sm">{metaParts.join(' · ')}</p>
                {/* Note — 3e ligne, sous la méta (les genres ont été retirés) */}
                {details.voteCount > 0 && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-foreground font-semibold">
                      {(details.rating / 2).toFixed(1)}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Synopsis */}
            {details.overview && (
              <div className="mt-3">
                <h3 className="mb-1.5 text-base font-semibold">
                  {content.watchlists.itemDetails.synopsis}
                </h3>
                <p
                  ref={overviewRef}
                  className={cn(
                    'text-muted-foreground text-sm leading-relaxed',
                    !isOverviewExpanded && 'line-clamp-2',
                  )}
                >
                  {details.overview}
                </p>
                {(showSeeMore || isOverviewExpanded) && (
                  <button
                    type="button"
                    onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                    className="text-foreground mt-1 text-sm font-bold underline"
                  >
                    {isOverviewExpanded
                      ? content.watchlists.itemDetails.seeLess
                      : content.watchlists.itemDetails.seeMore}
                  </button>
                )}
              </div>
            )}

            {/* Providers volontairement absents du drawer mobile (affichés
                uniquement dans la modale desktop) — allège la fiche */}

            {/* Acteurs principaux */}
            {details.cast.length > 0 && (
              <div className="mt-3">
                <h3 className="mb-3 text-base font-semibold">
                  {content.watchlists.itemDetails.mainCast}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {details.cast.slice(0, 6).map((actor) => (
                    <div
                      key={`${actor.name}-${actor.character}`}
                      className="flex flex-col items-center text-center"
                    >
                      <div className="bg-muted relative h-12 w-12 overflow-hidden rounded-xl">
                        {actor.profileUrl ? (
                          <Image
                            src={resizeTMDBPoster(actor.profileUrl, 'w185')}
                            alt={actor.name}
                            fill
                            sizes="48px"
                            className={cn(
                              'object-cover transition-opacity duration-200',
                              loadedActorImages.has(actor.profileUrl) ? 'opacity-100' : 'opacity-0',
                            )}
                            onLoad={() => markActorLoaded(actor.profileUrl!)}
                            unoptimized
                          />
                        ) : (
                          <div className="from-muted to-muted/30 h-full w-full bg-linear-to-br" />
                        )}
                      </div>
                      <div className="mt-1.5 text-xs leading-tight font-medium">{actor.name}</div>
                      <div className="text-muted-foreground/80 text-[11px] leading-tight">
                        {actor.character.replace(/\(voice\)/gi, `(${voiceTranslation})`)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bouton Ajouter (ouvre la sous-vue picker) */}
            {canPick && (
              <button
                type="button"
                onClick={() => setView('pick')}
                className="mt-6 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-black transition-colors hover:bg-white/90"
              >
                <Plus className="h-4 w-4" />
                {content.watchlists.addToWatchlist}
              </button>
            )}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

// ===========================================================================
// Shell modale (desktop) — inchangé.
// ===========================================================================
function ItemDetailsModalShell({
  open,
  onOpenChange,
  tmdbId,
  type,
  platforms = [],
  onPrevious,
  onNext,
  watchlists,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  isAuthenticated = false,
}: ItemDetailsModalProps) {
  const {
    content,
    details,
    loading,
    isNavigating,
    isOverviewExpanded,
    setIsOverviewExpanded,
    showSeeMore,
    overviewRef,
    posterLoaded,
    setPosterLoaded,
    loadedActorImages,
    markActorLoaded,
    effectivePlatforms,
    voiceTranslation,
  } = useItemDetails({ open, tmdbId, type, platforms });

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />

        {/* Navigation arrows */}
        <NavigationArrows onPrevious={onPrevious} onNext={onNext} enableKeyboard={open} />

        <DialogPrimitive.Content
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('[data-nav-button]')) {
              e.preventDefault();
            }
          }}
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('[data-nav-button]')) {
              e.preventDefault();
            }
          }}
          className="border-border bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 h-[620px] max-h-[85vh] w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-lg border shadow-lg duration-200 focus:outline-none"
        >
          <DialogPrimitive.Title className="sr-only">
            {details?.title || content.watchlists.itemDetails.mediaDetails}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {details
              ? `${content.watchlists.itemDetails.fullDetailsFor} ${details.title}`
              : content.watchlists.itemDetails.loadingDetails}
          </DialogPrimitive.Description>

          {loading || isNavigating ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-muted-foreground">{content.watchlists.itemDetails.loading}</div>
            </div>
          ) : !details ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-muted-foreground">
                {content.watchlists.itemDetails.notAvailable}
              </div>
            </div>
          ) : (
            <LazyMotion features={domAnimation}>
              <m.div
                key={details.tmdbId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex min-h-full flex-col"
              >
                {/* Backdrop Background */}
                <div className="relative flex flex-1 flex-col overflow-hidden">
                  {details.backdropUrl ? (
                    <>
                      <div className="absolute inset-x-0 top-0 z-0 h-68">
                        <Image
                          src={resizeTMDBPoster(details.backdropUrl, 'w1280')}
                          alt={details.title}
                          fill
                          sizes="(max-width: 896px) 100vw, 896px"
                          className="object-cover object-top"
                          unoptimized
                        />
                      </div>
                      <div className="to-background absolute inset-x-0 top-0 z-1 h-[calc(17rem+2px)] bg-linear-to-b from-black/90 via-black/80 via-80%" />
                    </>
                  ) : (
                    <div className="bg-muted absolute inset-0 z-0" />
                  )}

                  {/* Close Button */}
                  <DialogPrimitive.Close className="absolute top-4 right-4 z-20 cursor-pointer rounded-full bg-black/60 p-2 text-white opacity-70 transition-opacity hover:opacity-100">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                  </DialogPrimitive.Close>

                  {/* Content over backdrop */}
                  <div className="relative z-10 flex flex-1 flex-col justify-between px-6 pt-6 pb-6">
                    <div>
                      <div className="flex gap-5">
                        {/* Poster */}
                        <div className="shrink-0">
                          <div className="relative h-48 w-32 overflow-hidden rounded-lg">
                            {details.posterUrl ? (
                              <>
                                {!posterLoaded && (
                                  <div className="bg-muted absolute inset-0 animate-pulse" />
                                )}
                                <Image
                                  src={resizeTMDBPoster(details.posterUrl, 'w185')}
                                  alt={details.title}
                                  fill
                                  sizes="128px"
                                  className={`object-cover transition-opacity duration-200 ${
                                    posterLoaded ? 'opacity-100' : 'opacity-0'
                                  }`}
                                  onLoad={() => setPosterLoaded(true)}
                                  unoptimized
                                />
                              </>
                            ) : (
                              <div className="bg-muted text-muted-foreground flex h-full items-center justify-center">
                                {content.watchlists.itemDetails.notAvailable}
                              </div>
                            )}
                          </div>

                          {isAuthenticated &&
                            watchlists &&
                            onAddToWatchlist &&
                            onRemoveFromWatchlist && (
                              <div className="mt-3 w-32">
                                <WatchlistPickerMenu
                                  watchlists={watchlists}
                                  tmdbId={Number(tmdbId)}
                                  onAdd={onAddToWatchlist}
                                  onRemove={onRemoveFromWatchlist}
                                  addToLabel={content.watchlists.addToWatchlist}
                                  noWatchlistLabel={content.watchlists.noWatchlist}
                                  side="right"
                                  align="start"
                                >
                                  <DropdownMenu.Trigger asChild>
                                    <Button variant="outline" className="w-full cursor-pointer">
                                      {content.watchlists.add}
                                    </Button>
                                  </DropdownMenu.Trigger>
                                </WatchlistPickerMenu>
                              </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1 space-y-4">
                          {/* Title */}
                          <div>
                            <h2 className="truncate pr-12 text-3xl font-bold">{details.title}</h2>
                            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-sm text-white/90">
                              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
                                {type === 'movie'
                                  ? content.watchlists.contentTypes.movie
                                  : content.watchlists.contentTypes.series}
                              </span>
                              {formatYear(details.releaseDate) && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatYear(details.releaseDate)}</span>
                                </div>
                              )}
                              {type === 'movie' && details.runtime && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{formatRuntime(details.runtime)}</span>
                                </div>
                              )}
                              {type === 'tv' && details.numberOfSeasons && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {details.numberOfSeasons}{' '}
                                    {details.numberOfSeasons > 1
                                      ? content.watchlists.seriesInfo.seasons
                                      : content.watchlists.seriesInfo.season}
                                    {details.numberOfEpisodes &&
                                      ` • ${details.numberOfEpisodes} ${content.watchlists.seriesInfo.episodes}`}
                                  </span>
                                </div>
                              )}{' '}
                            </div>
                          </div>

                          {/* Rating */}
                          {details.voteCount > 0 && (
                            <div>
                              <StarRating
                                rating={details.rating}
                                voteCount={details.voteCount}
                                votesLabel={content.watchlists.itemDetails.votes}
                              />
                            </div>
                          )}

                          {/* Genres */}
                          {details.genres.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {details.genres.map((genre) => (
                                <span
                                  key={genre}
                                  className="border-border bg-muted/50 rounded-full border px-3 py-1 text-xs"
                                >
                                  {genre}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Overview */}
                          {details.overview && (
                            <div className="pt-1">
                              <h3 className="mb-2 text-base font-semibold">
                                {content.watchlists.itemDetails.synopsis}
                              </h3>
                              <p
                                ref={overviewRef}
                                className={`text-muted-foreground min-h-18 text-sm leading-relaxed ${!isOverviewExpanded ? 'line-clamp-3' : ''}`}
                              >
                                {details.overview}
                              </p>
                              {(showSeeMore || isOverviewExpanded) && (
                                <button
                                  type="button"
                                  onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                                  className="text-muted-foreground hover:text-foreground text-sm font-bold underline transition-colors"
                                >
                                  {isOverviewExpanded
                                    ? content.watchlists.itemDetails.seeLess
                                    : content.watchlists.itemDetails.seeMore}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Director */}
                          {details.director && (
                            <div className="pt-1">
                              <span className="text-sm font-semibold">
                                {type === 'movie'
                                  ? content.watchlists.itemDetails.director
                                  : content.watchlists.itemDetails.creator}
                                :
                              </span>{' '}
                              <span className="text-muted-foreground text-sm">
                                {details.director}
                              </span>
                            </div>
                          )}

                          {/* Platforms */}
                          {effectivePlatforms.length > 0 && (
                            <div className="pt-1">
                              <h3 className="mb-2 text-sm font-semibold">
                                {content.watchlists.itemDetails.availableOn}
                              </h3>
                              <WatchProviderList providers={effectivePlatforms} maxVisible={6} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cast */}
                    {details.cast.length > 0 && (
                      <div className="mt-6 pt-2">
                        <h3 className="mb-4 text-base font-semibold">
                          {content.watchlists.itemDetails.mainCast}
                        </h3>
                        <div className="grid grid-cols-3 gap-4 pb-2">
                          {details.cast.map((actor) => (
                            <div key={`${actor.name}-${actor.character}`} className="flex gap-3">
                              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                                {actor.profileUrl ? (
                                  <>
                                    {!loadedActorImages.has(actor.profileUrl) && (
                                      <div className="bg-muted absolute inset-0 animate-pulse" />
                                    )}
                                    <Image
                                      src={resizeTMDBPoster(actor.profileUrl, 'w185')}
                                      alt={actor.name}
                                      fill
                                      sizes="64px"
                                      className={`object-cover transition-opacity duration-200 ${
                                        loadedActorImages.has(actor.profileUrl)
                                          ? 'opacity-100'
                                          : 'opacity-0'
                                      }`}
                                      onLoad={() => markActorLoaded(actor.profileUrl!)}
                                      unoptimized
                                    />
                                  </>
                                ) : (
                                  <div className="bg-muted text-muted-foreground flex h-full items-center justify-center text-xs">
                                    {content.watchlists.itemDetails.notAvailable}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium">{actor.name}</div>
                                <div className="text-muted-foreground/80 text-xs">
                                  {actor.character.replace(/\(voice\)/gi, `(${voiceTranslation})`)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </m.div>
            </LazyMotion>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
