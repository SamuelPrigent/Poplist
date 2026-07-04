'use client';

import { ArrowLeft, Check, Copy, Film, Pencil, Share, User } from 'lucide-react';
import { Img as Image } from '@/components/ui/Img';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { PosterGrid } from '@/components/List/PosterGrid';
import type { Collaborator, Watchlist } from '@/api';
import { useLanguageStore } from '@/store/language';

interface ListHeaderProps {
  watchlist: Watchlist;
  actionButton?: React.ReactNode;
  menuButton?: React.ReactNode;
  onEdit?: () => void;
  onImageClick?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  showSaveButton?: boolean;
  onDuplicate?: () => void;
  showDuplicateButton?: boolean;
  collaboratorButton?: React.ReactNode;
}

export const LIST_HEADER_BUTTON_CLASS =
  'group relative flex h-[80%] items-center justify-center rounded-lg border border-transparent p-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white';

export const LIST_HEADER_ICON_CLASS =
  'h-[23px] w-[23px] max-[749px]:h-[22px] max-[749px]:w-[22px] transition-all opacity-60 group-hover:opacity-100';

export function ListHeader({
  watchlist,
  actionButton,
  menuButton,
  onEdit,
  onImageClick,
  onShare,
  onSave,
  isSaved = false,
  showSaveButton = false,
  onDuplicate,
  showDuplicateButton = false,
  collaboratorButton,
}: ListHeaderProps) {
  const navigate = useNavigate();
  const { content } = useLanguageStore();
  const [showSaveAnimation, setShowSaveAnimation] = useState(false);
  const [showShareConfirm, setShowShareConfirm] = useState(false);

  // ---- Bandeau mobile fixe (parité app RN, cf. mobile/app/lists/[id].tsx) ----
  // 1. Le fond + le titre centré fondent (0→1 sur ~40px) au moment où le bas du
  //    <h1> passe sous le bandeau.
  // 2. La cover se réduit au scroll : scale interpolé [0,300px] → [1, ~0.6]
  //    (mêmes bornes que le RN : IMAGE_SIZE_MIN/IMAGE_SIZE_MAX = 0.73/1.22),
  //    clampé, linéaire, depuis le centre.
  // Le tout piloté en direct sur les refs DOM (pas de state → zéro re-render
  // pendant le scroll), rAF-throttled. Mobile <750px uniquement.
  const titleRef = useRef<HTMLHeadingElement>(null);
  const fixedBgRef = useRef<HTMLDivElement>(null);
  const fixedTitleRef = useRef<HTMLSpanElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // 56px = header app mobile (h-14, sticky) + 44px = hauteur du bandeau.
    const HEADER_BOTTOM = 56 + 44;
    const COVER_MIN_SCALE = 0.73 / 1.22; // ≈ 0.6, comme l'app RN
    const mq = window.matchMedia('(max-width: 749px)');
    let raf = 0;
    const update = () => {
      raf = 0;
      const title = titleRef.current;
      if (!title || !fixedBgRef.current || !fixedTitleRef.current) return;
      const rect = title.getBoundingClientRect();
      // Équivalent de l'interpolate RN [titleBottom-20, titleBottom+20] → [0,1]
      const opacity = Math.min(1, Math.max(0, (HEADER_BOTTOM + 20 - rect.bottom) / 40));
      fixedBgRef.current.style.opacity = String(opacity);
      fixedTitleRef.current.style.opacity = String(opacity);
      if (coverRef.current) {
        if (mq.matches) {
          const progress = Math.min(1, Math.max(0, window.scrollY / 300));
          const scale = 1 - progress * (1 - COVER_MIN_SCALE);
          coverRef.current.style.transform = `scale(${scale})`;
        } else {
          coverRef.current.style.transform = '';
        }
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const itemCount = watchlist.items.length;
  const ownerUsername = watchlist.owner?.username || watchlist.owner?.email || null;
  const ownerAvatarUrl = watchlist.owner?.avatarUrl || null;

  return (
    <div className="relative w-full overflow-hidden">
      {/* Background Gradient - same as category pages */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, #0c273775, transparent 60%)',
        }}
      />

      {/* ===== Bandeau mobile fixe : flèche seule + fond/titre au scroll =====
          Calé sous le header app (sticky h-14). pointer-events-none sur le
          wrapper → seuls la flèche capte les taps ; le fond opaque coupe le
          contenu qui scrolle dessous (z-30 < header app z-40 < drawers). */}
      <div className="pointer-events-none fixed inset-x-0 top-14 z-30 min-[750px]:hidden">
        <div
          ref={fixedBgRef}
          className="bg-background absolute inset-0"
          style={{ opacity: 0 }}
        />
        <div className="relative flex h-11 items-center px-1.5">
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label={content.watchlists.back}
            className="pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white"
          >
            <ArrowLeft className="h-5.5 w-5.5" />
          </button>
          <span
            ref={fixedTitleRef}
            className="pointer-events-none absolute inset-x-14 truncate text-center text-[17px] font-semibold text-white"
            style={{ opacity: 0 }}
          >
            {watchlist.name}
          </span>
        </div>
      </div>

      {/* Mobile : pt sous le bandeau fixe (44px) pour que la cover ne colle pas
          à la barre de navigation du top */}
      <div className="relative container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 pt-8 max-[749px]:pt-7">
        {/* Back Button — desktop uniquement (mobile : flèche du bandeau fixe) */}
        <div className="mb-8 max-[749px]:hidden">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="text-muted-foreground flex cursor-pointer items-center gap-2 rounded text-sm transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{content.watchlists.back}</span>
          </button>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-8">
          {/* Cover Image — centrée sur mobile (cf. app RN) */}
          <div ref={coverRef} className="shrink-0 will-change-transform max-[749px]:self-center">
            {onImageClick ? (
              <button
                type="button"
                className="group relative h-56 w-56 cursor-pointer overflow-hidden rounded-lg shadow-2xl"
                onClick={(e) => {
                  // Blur avant l'ouverture de la modale : sinon radix/vaul pose
                  // aria-hidden sur le layout pendant que le bouton garde le
                  // focus (warning Chrome)
                  e.currentTarget.blur();
                  onImageClick();
                }}
              >
                {watchlist.imageUrl ? (
                  <>
                    <Image
                      src={watchlist.imageUrl}
                      alt={watchlist.name}
                      fill
                      sizes="224px"
                      className="object-cover"
                      priority
                      unoptimized
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                      <Pencil className="h-10 w-10 text-white" />
                      <span className="mt-2 text-sm font-medium text-white">
                        {'Sélectionner une photo'}
                      </span>
                    </div>
                  </>
                ) : watchlist.items?.length > 0 ? (
                  <>
                    <PosterGrid items={watchlist.items} alt={watchlist.name} priority />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                      <Pencil className="h-10 w-10 text-white" />
                      <span className="mt-2 text-sm font-medium text-white">
                        {'Sélectionner une photo'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="bg-muted/50 flex h-full w-full items-center justify-center">
                    <Film strokeWidth={1.2} className="text-muted-foreground h-24 w-24" />
                  </div>
                )}
              </button>
            ) : (
              <div className="group relative h-56 w-56 overflow-hidden rounded-lg shadow-2xl">
                {watchlist.imageUrl ? (
                  <Image
                    src={watchlist.imageUrl}
                    alt={watchlist.name}
                    fill
                    sizes="224px"
                    className="object-cover"
                    priority
                    unoptimized
                  />
                ) : watchlist.items?.length > 0 ? (
                  <PosterGrid items={watchlist.items} alt={watchlist.name} priority />
                ) : (
                  <div className="bg-muted/50 flex h-full w-full items-center justify-center">
                    <Film strokeWidth={1.2} className="text-muted-foreground h-24 w-24" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col justify-end space-y-4">
            {/* Publique = état par défaut, on ne l'affiche pas ; seul le privé
                est signalé */}
            {!watchlist.isPublic && (
              <span className="text-muted-foreground text-sm font-normal">
                {content.watchlists.headerPrivate}
              </span>
            )}

            {/* Mobile : taille alignée sur l'app native (gain d'espace vertical) */}
            <h1 ref={titleRef} className="text-4xl font-bold text-white max-[749px]:text-2xl md:text-7xl">
              {onEdit ? (
                <button
                  type="button"
                  onClick={onEdit}
                  className="hover:text-primary cursor-pointer rounded-lg text-left transition-colors"
                >
                  {watchlist.name}
                </button>
              ) : (
                watchlist.name
              )}
            </h1>

            {watchlist.description && (
              <p className="text-muted-foreground text-[14px]">{watchlist.description}</p>
            )}

            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              {ownerUsername && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <div className="flex items-center gap-1">
                        <div className="bg-muted flex h-6 w-6 items-center justify-center overflow-hidden rounded-full">
                          {ownerAvatarUrl ? (
                            <Image
                              src={ownerAvatarUrl}
                              alt=""
                              width={24}
                              height={24}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <User className="text-muted-foreground h-3.5 w-3.5" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate({ to: `/user/${ownerUsername}` as never })}
                          className="cursor-pointer rounded-lg font-semibold text-white capitalize hover:underline"
                        >
                          {ownerUsername}
                        </button>
                      </div>
                      {watchlist.collaborators && watchlist.collaborators.length > 0 && (
                        <div>,</div>
                      )}
                    </div>
                    {/* Collaborator Avatars - overlapping */}
                    {watchlist.collaborators &&
                      watchlist.collaborators.length > 0 &&
                      Array.isArray(watchlist.collaborators) && (
                        <div className="flex -space-x-2">
                          {(watchlist.collaborators as Collaborator[])
                            .filter((c): c is Collaborator => typeof c === 'object' && c !== null)
                            .slice(0, 3)
                            .map((collaborator) => (
                              <div
                                key={collaborator.id}
                                className="bg-muted ring-background flex h-6 w-6 items-center justify-center overflow-hidden rounded-full ring-2"
                                title={collaborator.username ?? undefined}
                              >
                                {(
                                  collaborator as Collaborator & {
                                    avatarUrl?: string;
                                  }
                                ).avatarUrl ? (
                                  <Image
                                    src={
                                      (
                                        collaborator as Collaborator & {
                                          avatarUrl?: string;
                                        }
                                      ).avatarUrl || ''
                                    }
                                    alt=""
                                    width={24}
                                    height={24}
                                    className="h-full w-full object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <User className="text-muted-foreground h-3.5 w-3.5" />
                                )}
                              </div>
                            ))}
                          {(watchlist.collaborators as Collaborator[]).filter(
                            (c): c is Collaborator => typeof c === 'object' && c !== null,
                          ).length > 3 && (
                            <div
                              className="bg-muted ring-background flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ring-2"
                              title={`+${(watchlist.collaborators as Collaborator[]).filter((c): c is Collaborator => typeof c === 'object' && c !== null).length - 3} collaborateurs`}
                            >
                              +
                              {(watchlist.collaborators as Collaborator[]).filter(
                                (c): c is Collaborator => typeof c === 'object' && c !== null,
                              ).length - 3}
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                  <span>•</span>
                </>
              )}
              <span>
                {itemCount} {itemCount === 1 ? content.watchlists.item : content.watchlists.items}
              </span>
              {watchlist.likedBy && watchlist.likedBy.length >= 1 && (
                <>
                  <span>•</span>
                  <span>
                    {watchlist.likedBy.length}{' '}
                    {watchlist.likedBy.length === 1 ? 'sauvegarde' : 'sauvegardes'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Row - Below Header */}
        {(() => {
          const hasLeftButtons =
            showSaveButton || showDuplicateButton || onShare || collaboratorButton || menuButton;

          return (
            <div
              className={`mt-6 flex items-center ${hasLeftButtons ? 'justify-between' : 'justify-end'}`}
            >
              {/* Left: Icon Buttons */}
              {hasLeftButtons && (
                <div className="flex min-h-[50px] items-center justify-center gap-[12px]">
                  {showSaveButton && onSave && (
                    <button
                      type="button"
                      onClick={async () => {
                        setShowSaveAnimation(true);
                        setTimeout(() => setShowSaveAnimation(false), 200);
                        await onSave();
                      }}
                      className={LIST_HEADER_BUTTON_CLASS}
                      title={
                        isSaved
                          ? content.watchlists.tooltips.unsave
                          : content.watchlists.tooltips.save
                      }
                    >
                      <div className="relative h-6 w-6">
                        <Image
                          src="/plus2.svg"
                          alt="Save"
                          width={24}
                          height={24}
                          className={`absolute inset-0 h-6 w-6 transition-opacity ${
                            isSaved
                              ? 'opacity-0'
                              : showSaveAnimation
                                ? 'opacity-100'
                                : 'opacity-60 brightness-0 invert group-hover:opacity-100'
                          }`}
                          style={{
                            transitionDuration: isSaved ? '0ms' : '200ms',
                          }}
                        />
                        <Image
                          src="/checkGreenFull.svg"
                          alt="Saved"
                          width={24}
                          height={24}
                          className={`absolute inset-0 h-6 w-6 transition-opacity ${
                            isSaved
                              ? showSaveAnimation
                                ? 'opacity-100'
                                : 'opacity-100'
                              : 'opacity-0'
                          }`}
                          style={{
                            transitionDuration: !isSaved ? '0ms' : '200ms',
                          }}
                        />
                      </div>
                    </button>
                  )}
                  {collaboratorButton && collaboratorButton}

                  {showDuplicateButton && onDuplicate && (
                    <button
                      type="button"
                      onClick={onDuplicate}
                      className={LIST_HEADER_BUTTON_CLASS}
                      title={content.watchlists.tooltips.duplicate}
                    >
                      <Copy className={`${LIST_HEADER_ICON_CLASS} text-white`} />
                    </button>
                  )}
                  {onShare && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowShareConfirm(true);
                        onShare();
                        setTimeout(() => setShowShareConfirm(false), 1500);
                      }}
                      className={`${LIST_HEADER_BUTTON_CLASS}`}
                      title={content.watchlists.tooltips.share}
                    >
                      {showShareConfirm ? (
                        <Check
                          strokeWidth={2}
                          className="h-[23px] w-[23px] max-[749px]:h-[22px] max-[749px]:w-[22px] text-green-500"
                        />
                      ) : (
                        <Share className={`${LIST_HEADER_ICON_CLASS} text-white`} />
                      )}
                    </button>
                  )}
                  {menuButton && menuButton}
                </div>
              )}

              {/* Right: Action Button (e.g., Add Item) */}
              {actionButton && <div className="shrink-0">{actionButton}</div>}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
