'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Calendar, Clock, Star, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { NavigationArrows } from '@/components/ui/navigation-arrows';
import { type FullMediaDetails, watchlistAPI } from '@/lib/api-client';
import { getTMDBLanguage } from '@/lib/utils';
import { useLanguageStore } from '@/store/language';
import { WatchProviderList } from '../WatchProviderBubble';

interface ItemDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tmdbId: string;
  type: 'movie' | 'tv';
  platforms?: Array<{ name: string; logoPath: string }>;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function ItemDetailsModal({
  open,
  onOpenChange,
  tmdbId,
  type,
  platforms = [],
  onPrevious,
  onNext,
}: ItemDetailsModalProps) {
  const { language, content } = useLanguageStore();
  const [details, setDetails] = useState<FullMediaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [showSeeMore, setShowSeeMore] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [loadedActorImages, setLoadedActorImages] = useState<Set<string>>(new Set());
  const overviewRef = useRef<HTMLParagraphElement>(null);

  const languageCode = getTMDBLanguage(language);
  const voiceTranslation = language === 'fr' ? 'voix' : language === 'es' ? 'voz' : 'voice';

  useEffect(() => {
    if (!open) {
      return;
    }

    // Reset expanded state when modal opens
    setIsOverviewExpanded(false);
    setShowSeeMore(false);
    setPosterLoaded(false);
    setLoadedActorImages(new Set());

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const { details: data } = await watchlistAPI.getItemDetails(tmdbId, type, languageCode);
        setDetails(data);
      } catch (err) {
        console.error('Failed to fetch item details:', err);
        setError(null);
        setDetails(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchDetails();
  }, [open, tmdbId, type, languageCode]);

  // Check if overview is truncated and needs "see more" button
  useEffect(() => {
    if (!details?.overview || isOverviewExpanded) {
      setShowSeeMore(false);
      return;
    }

    const checkTruncation = () => {
      if (overviewRef.current) {
        const isTruncated = overviewRef.current.scrollHeight > overviewRef.current.clientHeight;
        setShowSeeMore(isTruncated);
      }
    };

    checkTruncation();

    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [details?.overview, isOverviewExpanded]);

  const formatRuntime = (minutes: number | undefined) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.getFullYear();
  };

  const formatRating = (rating: number) => {
    return (rating / 2).toFixed(1);
  };

  const localizeCharacter = (character: string) => {
    return character.replace(/\(voice\)/gi, `(${voiceTranslation})`);
  };

  const renderStars = (rating: number) => {
    const stars = rating / 2;
    const fullStars = Math.floor(stars);
    const hasHalfStar = stars % 1 >= 0.5;

    return (
      <div className="flex items-center gap-1">
        {[0, 1, 2, 3, 4].map(index => (
          <Star
            key={`star-${index}`}
            className={`h-4 w-4 ${
              index < fullStars
                ? 'fill-yellow-400 text-yellow-400'
                : index === fullStars && hasHalfStar
                  ? 'fill-yellow-400/50 text-yellow-400'
                  : 'text-muted-foreground'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{formatRating(rating)} / 5</span>
        <span className="ml-1 text-xs text-white/70">
          ({details?.voteCount} {content.watchlists.itemDetails.votes})
        </span>
      </div>
    );
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />

        {/* Navigation arrows */}
        <NavigationArrows onPrevious={onPrevious} onNext={onNext} enableKeyboard={open} />

        <DialogPrimitive.Content
          onPointerDownOutside={e => {
            const target = e.target as HTMLElement;
            if (target.closest('[data-nav-button]')) {
              e.preventDefault();
            }
          }}
          onInteractOutside={e => {
            const target = e.target as HTMLElement;
            if (target.closest('[data-nav-button]')) {
              e.preventDefault();
            }
          }}
          className="border-border bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 max-h-[90vh] w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-lg border shadow-lg duration-200 focus:outline-none"
        >
          {/* Hidden Title and Description for accessibility */}
          <DialogPrimitive.Title className="sr-only">
            {details?.title || content.watchlists.itemDetails.mediaDetails}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {details
              ? `${content.watchlists.itemDetails.fullDetailsFor} ${details.title}`
              : content.watchlists.itemDetails.loadingDetails}
          </DialogPrimitive.Description>

          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-muted-foreground">{content.watchlists.itemDetails.loading}</div>
            </div>
          ) : !details ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-muted-foreground">
                {content.watchlists.itemDetails.notAvailable}
              </div>
            </div>
          ) : (
            <>
              {/* Backdrop Background */}
              <div className="relative overflow-hidden">
                {/* Backdrop Image as background */}
                {details.backdropUrl ? (
                  <>
                    <div className="absolute inset-x-0 top-0 z-0 h-68">
                      <Image
                        src={details.backdropUrl}
                        alt={details.title}
                        fill
                        sizes="(max-width: 896px) 100vw, 896px"
                        className="object-cover object-top"
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
                <div className="relative z-10 min-h-[70vh] px-6 pt-6 pb-6">
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
                              src={details.posterUrl}
                              alt={details.title}
                              fill
                              sizes="128px"
                              className={`object-cover transition-opacity duration-200 ${
                                posterLoaded ? 'opacity-100' : 'opacity-0'
                              }`}
                              onLoad={() => setPosterLoaded(true)}
                            />
                          </>
                        ) : (
                          <div className="bg-muted text-muted-foreground flex h-full items-center justify-center">
                            {content.watchlists.itemDetails.notAvailable}
                          </div>
                        )}
                      </div>
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
                          {formatDate(details.releaseDate) && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(details.releaseDate)}</span>
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
                      {details.voteCount > 0 && <div>{renderStars(details.rating)}</div>}

                      {/* Genres */}
                      {details.genres.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {details.genres.map(genre => (
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
                            className={`text-muted-foreground text-sm leading-relaxed ${!isOverviewExpanded ? 'line-clamp-5' : ''}`}
                          >
                            {details.overview}
                          </p>
                          {showSeeMore && (
                            <button
                              type="button"
                              onClick={() => setIsOverviewExpanded(true)}
                              className="text-muted-foreground hover:text-foreground mt-2 text-sm font-bold underline transition-colors"
                            >
                              {content.watchlists.itemDetails.seeMore}
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
                          <span className="text-muted-foreground text-sm">{details.director}</span>
                        </div>
                      )}

                      {/* Platforms */}
                      {platforms.length > 0 && (
                        <div className="pt-1">
                          <h3 className="mb-2 text-sm font-semibold">
                            {content.watchlists.itemDetails.availableOn}
                          </h3>
                          <WatchProviderList providers={platforms} maxVisible={6} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cast */}
                  {details.cast.length > 0 && (
                    <div className="mt-6 pt-2">
                      <h3 className="mb-4 text-base font-semibold">
                        {content.watchlists.itemDetails.mainCast}
                      </h3>
                      <div className="grid grid-cols-3 gap-4 pb-2">
                        {details.cast.map(actor => (
                          <div key={`${actor.name}-${actor.character}`} className="flex gap-3">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                              {actor.profileUrl ? (
                                <>
                                  {!loadedActorImages.has(actor.profileUrl) && (
                                    <div className="bg-muted absolute inset-0 animate-pulse" />
                                  )}
                                  <Image
                                    src={actor.profileUrl}
                                    alt={actor.name}
                                    fill
                                    sizes="64px"
                                    className={`object-cover transition-opacity duration-200 ${
                                      loadedActorImages.has(actor.profileUrl)
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    }`}
                                    onLoad={() => {
                                      setLoadedActorImages(prev => {
                                        const newSet = new Set(prev);
                                        newSet.add(actor.profileUrl!);
                                        return newSet;
                                      });
                                    }}
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
                                {localizeCharacter(actor.character)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
