'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Film, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Img as Image } from '@/components/ui/Img';
import { WatchlistPickerMenu } from '@/components/List/WatchlistPickerMenu';
import { watchlistsQueries } from '@/api/queries';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Watchlist } from '@/api';
import { getTMDBImageUrl, getTMDBLanguage } from '@/lib/utils';
import { useLanguageStore } from '@/store/language';

interface TrendingFeatureProps {
  id: number;
  title?: string;
  name?: string;
  backdropPath?: string | null;
  mediaType: 'movie' | 'tv';
  voteAverage?: number;
  onClick: () => void;
  watchlists?: Watchlist[];
  onAddToWatchlist?: (watchlistId: string) => void;
  onRemoveFromWatchlist?: (watchlistId: string) => void;
  addToWatchlistLabel: string;
  noWatchlistLabel: string;
}

// « 2h 05 min » — même format que la card mobile.
function formatRuntime(minutes: number | undefined) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${String(mins).padStart(2, '0')} min` : `${hours}h`;
}

/**
 * Titre + ligne de méta de la tête de rail. Exporté parce que le calque de
 * croissance de `TrendingRail` doit rendre **rigoureusement le même bloc** :
 * s'il n'affichait que le titre, la ligne de méta apparaîtrait à la fin de
 * l'animation et pousserait le titre vers le haut — un saut de mise en page
 * qu'on prend pour un temps de chargement.
 */
export function TrendingCaption({
  id,
  title,
  mediaType,
  voteAverage,
}: {
  id: number;
  title?: string;
  mediaType: 'movie' | 'tv';
  voteAverage?: number;
}) {
  const { content, language } = useLanguageStore();
  const isMobile = useIsMobile();
  const detailsQuery = useQuery({
    ...watchlistsQueries.itemDetails(String(id), mediaType, getTMDBLanguage(language)),
    enabled: !isMobile,
  });
  const details = detailsQuery.data?.details;

  const typeLabel =
    mediaType === 'movie'
      ? content.watchlists.contentTypes.movie
      : content.watchlists.contentTypes.series;

  const meta =
    mediaType === 'movie'
      ? formatRuntime(details?.runtime)
      : details?.numberOfSeasons
        ? `${details.numberOfSeasons} ${
            details.numberOfSeasons > 1
              ? content.watchlists.seriesInfo.seasons
              : content.watchlists.seriesInfo.season
          }`
        : null;

  return (
    <>
      <h3 className="text-title text-foreground">{title}</h3>
      <div className="text-label mt-1 flex items-center gap-2 text-white/80">
        <span>{typeLabel}</span>
        {meta && (
          <>
            <span aria-hidden="true">·</span>
            <span>{meta}</span>
          </>
        )}
        {voteAverage && voteAverage > 0 ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-white">{voteAverage.toFixed(1)}</span>
          </>
        ) : null}
      </div>
    </>
  );
}

/**
 * Tête du rail « Tendances » sur desktop : une seule affiche en grand format
 * paysage (backdrop TMDB), posée sur 2 colonnes de la grille.
 *
 * Quand le focus change, l'ancienne image reste montée sous la nouvelle le
 * temps d'un fondu (`crossfade`, ease-out) : on ne remplace pas une image par
 * un trou. Les deux couches sont démontées dès la fin de l'animation, et sous
 * `prefers-reduced-motion` la bascule est instantanée.
 */
export function TrendingFeature({
  id,
  title,
  name,
  backdropPath,
  mediaType,
  voteAverage,
  onClick,
  watchlists,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  addToWatchlistLabel,
  noWatchlistLabel,
}: TrendingFeatureProps) {
  const displayTitle = title || name;
  const ownedWatchlists = watchlists?.filter((w) => w.isOwner || w.isCollaborator) ?? [];
  const showAddButton = onAddToWatchlist && onRemoveFromWatchlist;

  const backdropUrl = getTMDBImageUrl(backdropPath, 'w780');

  return (
    <div className="group relative h-full">
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        className="bg-muted shadow-poster-front rounded-poster relative h-full w-full cursor-pointer overflow-hidden text-left outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        {/* Pas de fondu interne : la transition d'un titre à l'autre est jouée
            par le calque de croissance du rail (cf. TrendingRail). En rejouer
            un ici ferait réapparaître l'ancienne image en fin d'animation. */}
        {backdropUrl ? (
          <>
            <Image
              src={backdropUrl}
              alt={displayTitle || ''}
              fill
              sizes="(max-width: 1024px) 50vw, 34vw"
              className="object-cover"
              priority
              unoptimized
            />
            {/* Voile de lisibilité en bas */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/85 via-black/35 to-transparent" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Film strokeWidth={1} className="text-muted-foreground h-16 w-16" />
          </div>
        )}

        {/* Retour de survol porté par le conteneur, jamais par l'affiche */}
        <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/20 group-focus-within:bg-black/20" />

        <div className="absolute inset-x-0 bottom-0 z-10 p-5">
          <TrendingCaption
            id={id}
            title={displayTitle}
            mediaType={mediaType}
            voteAverage={voteAverage}
          />
        </div>
      </div>

      {showAddButton && (
        <div className="absolute top-2.5 right-2.5 z-10 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-[749px]:hidden">
          <WatchlistPickerMenu
            watchlists={ownedWatchlists}
            tmdbId={id}
            onAdd={onAddToWatchlist!}
            onRemove={onRemoveFromWatchlist!}
            addToLabel={addToWatchlistLabel}
            noWatchlistLabel={noWatchlistLabel}
            side="left"
            align="start"
          >
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                aria-label={addToWatchlistLabel}
                className="cursor-pointer rounded-full bg-black/70 p-2.5 text-white transition-colors outline-none hover:bg-black focus-visible:ring-2 focus-visible:ring-white"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.preventDefault()}
              >
                <Plus className="h-4 w-4" />
              </button>
            </DropdownMenu.Trigger>
          </WatchlistPickerMenu>
        </div>
      )}
    </div>
  );
}
