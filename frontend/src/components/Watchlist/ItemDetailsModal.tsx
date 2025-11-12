import { useState, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Star, Calendar, Clock } from "lucide-react";
import { watchlistAPI, type FullMediaDetails } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";
import { WatchProviderList } from "./WatchProviderBubble";

interface ItemDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tmdbId: string;
  type: "movie" | "tv";
  platforms?: Array<{ name: string; logoPath: string }>;
}

export function ItemDetailsModal({
  open,
  onOpenChange,
  tmdbId,
  type,
  platforms = [],
}: ItemDetailsModalProps) {
  const { language, content } = useLanguageStore(); // use it for (acteur principaux, etc)
  const [details, setDetails] = useState<FullMediaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);

  const languageCode =
    language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US";
  const voiceTranslation =
    language === "fr" ? "voix" : language === "es" ? "voz" : "voice";

  const errorMessage = content.watchlists.itemDetails.error;

  useEffect(() => {
    if (!open) {
      return;
    }

    // Reset expanded state when modal opens
    setIsOverviewExpanded(false);

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const { details: data } = await watchlistAPI.getItemDetails(
          tmdbId,
          type,
          languageCode,
        );
        setDetails(data);
      } catch (err) {
        console.error("Failed to fetch item details:", err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    void fetchDetails();
  }, [open, tmdbId, type, languageCode, errorMessage]);

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
    return (rating / 2).toFixed(1); // Convert from 10-point to 5-star scale
  };

  const localizeCharacter = (character: string) => {
    // Replace "(voice)" with localized version - TMDB doesn't always translate this
    return character.replace(/\(voice\)/gi, `(${voiceTranslation})`);
  };

  const renderStars = (rating: number) => {
    const stars = rating / 2; // Convert to 5-star scale
    const fullStars = Math.floor(stars);
    const hasHalfStar = stars % 1 >= 0.5;

    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < fullStars
                ? "fill-yellow-400 text-yellow-400"
                : i === fullStars && hasHalfStar
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "text-muted-foreground"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">
          {formatRating(rating)} / 5
        </span>
        <span className="ml-1 text-xs text-white/70">
          ({details?.voteCount} {content.watchlists.itemDetails.votes})
        </span>
      </div>
    );
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 max-h-[90vh] w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-lg border border-border bg-background shadow-lg duration-200 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Hidden Title and Description for accessibility - always rendered */}
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
              <div className="text-muted-foreground">
                {content.watchlists.itemDetails.loading}
              </div>
            </div>
          ) : error ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-red-500">{error}</div>
            </div>
          ) : details ? (
            <>
              {/* Backdrop Background */}
              <div className="relative overflow-hidden">
                {/* Backdrop Image as background - limited height */}
                {details.backdropUrl ? (
                  <>
                    {/* Image */}
                    <div className="absolute inset-x-0 top-0 z-0 h-[17rem]">
                      <img
                        src={details.backdropUrl}
                        alt={details.title}
                        className="h-full w-full object-cover object-top"
                      />
                    </div>
                    {/* Gradient overlay - independent and extended */}
                    <div className="absolute inset-x-0 top-0 z-[1] h-[calc(17rem+2px)] bg-gradient-to-b from-black/90 via-black/80 via-80% to-background" />
                  </>
                ) : (
                  <div className="absolute inset-0 z-0 bg-muted" />
                )}

                {/* Close Button - Fixed position */}
                <DialogPrimitive.Close className="absolute right-4 top-4 z-20 rounded-full bg-black/60 p-2 text-white opacity-70 transition-opacity hover:opacity-100 focus:outline-none">
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </DialogPrimitive.Close>

                {/* Content over backdrop */}
                <div className="relative z-10 min-h-[70vh] px-6 pb-6 pt-6">
                  <div className="flex gap-5">
                    {/* Poster */}
                    <div className="flex-shrink-0">
                      <div className="h-48 w-32 overflow-hidden rounded-lg bg-muted">
                        {details.posterUrl ? (
                          <img
                            src={details.posterUrl}
                            alt={details.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            {content.watchlists.itemDetails.notAvailable}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-4">
                      {/* Title (Visual) */}
                      <div>
                        <h2 className="text-3xl font-bold">{details.title}</h2>
                        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-sm text-white/90">
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
                            {type === "movie"
                              ? content.watchlists.contentTypes.movie
                              : content.watchlists.contentTypes.series}
                          </span>
                          {formatDate(details.releaseDate) && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(details.releaseDate)}</span>
                            </div>
                          )}
                          {type === "movie" && details.runtime && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatRuntime(details.runtime)}</span>
                            </div>
                          )}
                          {type === "tv" && details.numberOfSeasons && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {details.numberOfSeasons}{" "}
                                {details.numberOfSeasons > 1
                                  ? content.watchlists.seriesInfo.seasons
                                  : content.watchlists.seriesInfo.season}
                                {details.numberOfEpisodes &&
                                  ` • ${details.numberOfEpisodes} ${content.watchlists.seriesInfo.episodes}`}
                                {details.runtime &&
                                  ` (${formatRuntime(details.runtime)})`}
                              </span>
                            </div>
                          )}{" "}
                        </div>
                      </div>

                      {/* Rating */}
                      <div>{renderStars(details.rating)}</div>

                      {/* Genres */}
                      {details.genres.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {details.genres.map((genre) => (
                            <span
                              key={genre}
                              className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs"
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
                            className={`text-sm leading-relaxed text-muted-foreground ${!isOverviewExpanded ? "line-clamp-5" : ""}`}
                          >
                            {details.overview}
                          </p>
                          {!isOverviewExpanded &&
                            details.overview.length > 200 && (
                              <button
                                onClick={() => setIsOverviewExpanded(true)}
                                className="mt-2 text-sm font-bold text-muted-foreground underline transition-colors hover:text-foreground"
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
                            {type === "movie"
                              ? content.watchlists.itemDetails.director
                              : content.watchlists.itemDetails.creator}
                            :
                          </span>{" "}
                          <span className="text-sm text-muted-foreground">
                            {details.director}
                          </span>
                        </div>
                      )}

                      {/* Platforms */}
                      {platforms.length > 0 && (
                        <div className="pt-1">
                          <h3 className="mb-2 text-sm font-semibold">
                            {content.watchlists.itemDetails.availableOn}
                          </h3>
                          <WatchProviderList
                            providers={platforms}
                            maxVisible={6}
                          />
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
                        {details.cast.map((actor, index) => (
                          <div key={index} className="flex gap-3">
                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                              {actor.profileUrl ? (
                                <img
                                  src={actor.profileUrl}
                                  alt={actor.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                  {content.watchlists.itemDetails.notAvailable}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">
                                {actor.name}
                              </div>
                              <div className="text-xs text-muted-foreground/80">
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
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
