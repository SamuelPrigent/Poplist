'use client';

import { Plus, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Img as Image } from '@/components/ui/Img';
import { watchlistsQueries } from '@/api/queries';
import { getTMDBImageUrl, getTMDBLanguage } from '@/lib/utils';
import { useLanguageStore } from '@/store/language';

interface TrendingCardMobileProps {
  id: number;
  title?: string;
  name?: string;
  backdropPath?: string | null;
  mediaType: 'movie' | 'tv';
  voteAverage?: number;
  onClick: () => void;
  /** Ouvre le drawer "Ajouter à une liste" (géré par le parent). Absent → pas de bouton +. */
  onAddClick?: () => void;
}

// "2h 05 min" (format maquette, minutes sur 2 chiffres)
function formatRuntime(minutes: number | undefined) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${String(mins).padStart(2, '0')} min` : `${hours}h`;
}

/**
 * Card tendance mobile (pleine largeur, format paysage) : backdrop TMDB en
 * fond (la bannière utilisée dans ItemDetailsModal, pas le poster portrait),
 * note en haut à gauche, "+" en haut à droite, titre + type + durée/saisons
 * en bas. Le clic sur la card ouvre la fiche, le "+" ouvre directement le
 * drawer d'ajout à une liste.
 */
export function TrendingCardMobile({
  id,
  title,
  name,
  backdropPath,
  mediaType,
  voteAverage,
  onClick,
  onAddClick,
}: TrendingCardMobileProps) {
  const { content, language } = useLanguageStore();
  const displayTitle = title || name;

  // Durée (film) / saisons + épisodes (série) : absents de l'API trending,
  // on lit les détails via TQ (cache partagé avec ItemDetailsModal).
  const detailsQuery = useQuery(
    watchlistsQueries.itemDetails(String(id), mediaType, getTMDBLanguage(language)),
  );
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
          }${details.numberOfEpisodes ? `, ${details.numberOfEpisodes} ep` : ''}`
        : null;

  const backdropUrl = getTMDBImageUrl(backdropPath, 'w780');

  return (
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
      className="bg-muted relative block aspect-[2/1] w-full cursor-pointer overflow-hidden rounded-2xl text-left"
    >
      {/* Backdrop */}
      {backdropUrl && (
        <Image
          src={backdropUrl}
          alt={displayTitle || ''}
          fill
          sizes="100vw"
          className="object-cover"
          unoptimized
        />
      )}

      {/* Gradient bas pour la lisibilité du texte */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

      {/* Note — top left */}
      {voteAverage && voteAverage > 0 ? (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm">
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-semibold text-white">{voteAverage.toFixed(1)}</span>
        </div>
      ) : null}

      {/* + — top right, ouvre le drawer d'ajout */}
      {onAddClick && (
        <button
          type="button"
          aria-label={content.watchlists.addToWatchlist}
          onClick={(e) => {
            e.stopPropagation();
            // Blur avant l'ouverture du drawer : sinon vaul pose aria-hidden
            // sur le layout pendant que le bouton garde le focus (warning Chrome)
            e.currentTarget.blur();
            onAddClick();
          }}
          className="absolute top-3 right-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors active:bg-black/70"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}

      {/* Titre + méta — bas */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-3.5">
        <h3 className="truncate text-lg leading-tight font-bold text-white">{displayTitle}</h3>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="rounded-md bg-white/15 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {typeLabel}
          </span>
          {meta && <span className="text-sm text-white/90">{meta}</span>}
        </div>
      </div>
    </div>
  );
}
