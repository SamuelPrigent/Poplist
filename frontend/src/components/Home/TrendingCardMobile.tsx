'use client';

import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Img as Image } from '@/components/ui/Img';
import { watchlistsQueries } from '@/api/queries';
import { useIsMobile } from '@/hooks/useIsMobile';
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
 * Card tendance mobile (280px dans le rail horizontal, format paysage) : backdrop TMDB en
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
  // Le bloc mobile reste monté sur desktop (il n'est masqué qu'en CSS) : sans
  // ce garde, ces cartes iraient chercher leurs détails alors qu'elles ne sont
  // jamais visibles.
  const isMobile = useIsMobile();
  const detailsQuery = useQuery({
    ...watchlistsQueries.itemDetails(String(id), mediaType, getTMDBLanguage(language)),
    enabled: isMobile,
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
      className="bg-muted rounded-card relative block aspect-[2/1] w-full cursor-pointer overflow-hidden text-left"
    >
      {/* Backdrop */}
      {backdropUrl && (
        <Image
          src={backdropUrl}
          alt={displayTitle || ''}
          fill
          sizes="280px"
          className="object-cover"
          unoptimized
        />
      )}

      {/* Gradient bas pour la lisibilité du texte */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

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
          // Cible tactile de 44px, mais disque visible de 30px : à 44 le
          // bouton écrasait l'affiche. Le fond est porté par le span, pas par
          // le bouton, donc la zone tapable reste plus grande que le visuel.
          className="absolute top-1 right-1 z-10 flex h-11 w-11 cursor-pointer items-center justify-center text-white"
        >
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-black/55 transition-colors active:bg-black/75">
            <Plus className="h-4 w-4" strokeWidth={2} />
          </span>
        </button>
      )}

      {/* Titre + méta — bas. La note est un simple chiffre dans la ligne de
          méta : pas de pastille colorée, pas d'étoile (cf. DESIGN.md, la
          couleur appartient aux affiches). */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-3.5">
        <h3 className="text-title truncate text-white">{displayTitle}</h3>
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
      </div>
    </div>
  );
}
