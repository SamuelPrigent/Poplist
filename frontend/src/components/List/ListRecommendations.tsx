'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Img as Image } from '@/components/ui/Img';
import { Button } from '@/components/ui/button';
import {
  createPlaceholderItem,
  watchlists as watchlistsApi,
  type RecommendedItem,
  type Watchlist,
} from '@/api';
import { watchlistsQueries } from '@/api/queries';
import { buildPickerWatchlists, useMyWatchlists } from '@/hooks/useMyWatchlists';
import { cn } from '@/lib/cn';
import { formatItemFormat } from '@/lib/format';
import { getTMDBImageUrl, getTMDBLanguage, getTMDBRegion } from '@/lib/utils';
import { useLanguageStore } from '@/store/language';
import type { Content } from '@/types/content';
import { ItemDetailsModal } from './modal/ItemDetailsModal';
import { WatchlistPickerMenu } from './WatchlistPickerMenu';

const PAGE_SIZE = 10;

interface ListRecommendationsProps {
  watchlist: Watchlist;
  isOwner?: boolean;
  isCollaborator?: boolean;
}

export function ListRecommendations({
  watchlist,
  isOwner = false,
  isCollaborator = false,
}: ListRecommendationsProps) {
  const { content, language } = useLanguageStore();
  const tmdbLanguage = getTMDBLanguage(language);
  const tmdbRegion = getTMDBRegion(language);
  const queryClient = useQueryClient();

  const canEdit = isOwner || isCollaborator;
  const hasItems = watchlist.items.length > 0;

  const { setMyWatchlists, editableWatchlists, isInAnyOfMyLists, isAuthenticated } =
    useMyWatchlists(watchlist.id);

  const [page, setPage] = useState(0);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RecommendedItem | null>(null);

  const { data, isPending, isError } = useQuery({
    ...watchlistsQueries.recommendations(watchlist.id, tmdbLanguage),
    enabled: hasItems,
  });

  // Listes proposées dans le picker (modal + lignes non-owned) : mes listes
  // éditables, + la courante en tête si je peux l'éditer.
  const pickerWatchlists = buildPickerWatchlists(
    editableWatchlists,
    canEdit ? { ...watchlist, items: watchlist.items } : null,
    canEdit
  );

  // Ajoute l'item à la liste `wid`. Si `wid` est la liste courante (cas
  // « Recommandés » d'une liste à nous), on retire la reco de la section.
  const handleAddToList = async (wid: string, item: RecommendedItem) => {
    const key = `${item.mediaType}:${item.tmdbId}`;
    setAddingId(item.tmdbId);
    setMyWatchlists(prev =>
      prev.map(wl =>
        wl.id === wid && !wl.items.some(it => it.tmdbId === item.tmdbId)
          ? {
              ...wl,
              items: [
                ...wl.items,
                createPlaceholderItem({
                  tmdbId: item.tmdbId,
                  title: item.title,
                  posterPath: item.posterPath,
                  mediaType: item.mediaType,
                }),
              ],
            }
          : wl
      )
    );
    if (wid === watchlist.id) setRemoved(prev => new Set(prev).add(key));
    try {
      await watchlistsApi.addItem(wid, {
        tmdbId: String(item.tmdbId),
        mediaType: item.mediaType,
        language: tmdbLanguage,
        region: tmdbRegion,
      });
      queryClient.invalidateQueries({ queryKey: ['watchlists', 'mine'] });
      if (wid === watchlist.id) {
        queryClient.invalidateQueries({ queryKey: watchlistsQueries.byId(watchlist.id).queryKey });
        queryClient.invalidateQueries({
          queryKey: watchlistsQueries.publicById(watchlist.id).queryKey,
        });
      }
      toast.success('Ajouté à la liste');
    } catch (error) {
      console.error('Failed to add recommendation:', error);
      setMyWatchlists(prev =>
        prev.map(wl =>
          wl.id === wid ? { ...wl, items: wl.items.filter(it => it.tmdbId !== item.tmdbId) } : wl
        )
      );
      if (wid === watchlist.id) {
        setRemoved(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
      toast.error("Erreur lors de l'ajout");
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveFromList = async (wid: string, item: RecommendedItem) => {
    let restored: Watchlist['items'][number] | undefined;
    setMyWatchlists(prev =>
      prev.map(wl => {
        if (wl.id !== wid) return wl;
        restored = wl.items.find(it => it.tmdbId === item.tmdbId);
        return { ...wl, items: wl.items.filter(it => it.tmdbId !== item.tmdbId) };
      })
    );
    try {
      await watchlistsApi.removeItem(wid, String(item.tmdbId));
      queryClient.invalidateQueries({ queryKey: ['watchlists', 'mine'] });
      toast.success('Retiré de la liste');
    } catch (error) {
      console.error('Failed to remove from list:', error);
      if (restored) {
        const r = restored;
        setMyWatchlists(prev =>
          prev.map(wl => (wl.id === wid ? { ...wl, items: [...wl.items, r] } : wl))
        );
      }
      toast.error('Erreur lors du retrait');
    }
  };

  const openDetails = (item: RecommendedItem) => {
    setSelectedItem(item);
    setDetailsOpen(true);
  };

  // Pas de section pour une liste vide.
  if (!hasItems) return null;

  if (isPending) {
    return (
      <section className="border-border/60 mx-auto mt-12 w-[92%] border-t pt-8">
        <RecommendationsHeader content={content} canEdit={canEdit} />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-muted/30 h-16 w-full animate-pulse rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  const items = (data?.items ?? []).filter(it => !removed.has(`${it.mediaType}:${it.tmdbId}`));

  // Échec ou plus aucune reco → on n'affiche rien (ne casse pas la page).
  if (isError || items.length === 0) return null;

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageIndex = page % totalPages;
  const start = pageIndex * PAGE_SIZE;
  const displayItems = items.slice(start, start + PAGE_SIZE);
  const showRefresh = items.length > PAGE_SIZE;

  // Index de l'item ouvert dans la page courante (pour la navigation flèches du
  // modal, bornée aux 10 éléments affichés).
  const selectedIndex = selectedItem
    ? displayItems.findIndex(
        it => it.tmdbId === selectedItem.tmdbId && it.mediaType === selectedItem.mediaType
      )
    : -1;

  return (
    <section className="border-border/60 mx-auto mt-12 w-[94%] border-t pt-8">
      <RecommendationsHeader content={content} canEdit={canEdit} />

      <div className="mt-6 overflow-x-auto max-[749px]:hidden">
        <table className="w-full table-fixed">
          <tbody>
            {displayItems.map(item => (
              <RecommendationRow
                key={`${item.mediaType}-${item.tmdbId}`}
                item={item}
                content={content}
                canEdit={canEdit}
                adding={addingId === item.tmdbId}
                inMyLists={isInAnyOfMyLists(item.tmdbId)}
                pickerWatchlists={pickerWatchlists}
                onAddDirect={() => handleAddToList(watchlist.id, item)}
                onPickerAdd={wid => handleAddToList(wid, item)}
                onPickerRemove={wid => handleRemoveFromList(wid, item)}
                onOpenDetails={() => openDetails(item)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Vue cartes mobile (< 750px) */}
      <div className="mt-2 min-[750px]:hidden">
        {displayItems.map(item => {
          const posterUrl = getTMDBImageUrl(item.posterPath, 'w185');
          const inMyLists = isInAnyOfMyLists(item.tmdbId);
          return (
            <div
              key={`m-${item.mediaType}-${item.tmdbId}`}
              className="border-border/60 flex items-center gap-3 border-b py-3 last:border-b-0"
            >
              <button
                type="button"
                onClick={() => openDetails(item)}
                className="bg-muted relative h-[78px] w-[56px] shrink-0 cursor-pointer overflow-hidden rounded-md"
              >
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={item.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="from-muted to-muted/30 h-full w-full bg-linear-to-br" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => openDetails(item)}
                  className="block max-w-full cursor-pointer truncate text-left font-semibold text-white"
                >
                  {item.title}
                </button>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                      item.mediaType === 'movie'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-purple-500/10 text-purple-400'
                    )}
                  >
                    {item.mediaType === 'movie'
                      ? content.watchlists.contentTypes.movie
                      : content.watchlists.contentTypes.series}
                  </span>
                  <span className="text-muted-foreground text-sm">{formatItemFormat(item)}</span>
                </div>
              </div>

              {/* Picker +/check (même composant) */}
              <div className="shrink-0">
                <WatchlistPickerMenu
                  watchlists={pickerWatchlists}
                  tmdbId={item.tmdbId}
                  onAdd={wid => handleAddToList(wid, item)}
                  onRemove={wid => handleRemoveFromList(wid, item)}
                  addToLabel={content.watchlists.addToWatchlist}
                  noWatchlistLabel={content.watchlists.noWatchlist}
                  side="left"
                  align="start"
                >
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      className="hover:bg-muted cursor-pointer rounded p-1.5 transition-colors"
                      disabled={addingId === item.tmdbId}
                      title={content.watchlists.addToWatchlist}
                    >
                      {inMyLists ? (
                        <Image
                          src="/checkGreenFull.svg"
                          alt=""
                          width={18}
                          height={18}
                          className="h-[18px] w-[18px]"
                        />
                      ) : (
                        <Image
                          src="/plus2.svg"
                          alt=""
                          width={18}
                          height={18}
                          className="h-[18px] w-[18px] opacity-70 brightness-0 invert"
                        />
                      )}
                    </button>
                  </DropdownMenu.Trigger>
                </WatchlistPickerMenu>
              </div>
            </div>
          );
        })}
      </div>

      {showRefresh && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setPage(p => p + 1)}
            className="text-muted-foreground cursor-pointer px-[21px] py-1 text-sm font-semibold transition-colors hover:text-white"
          >
            {content.watchlists.recommendations.refresh}
          </button>
        </div>
      )}

      {selectedItem && (
        <ItemDetailsModal
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          tmdbId={String(selectedItem.tmdbId)}
          type={selectedItem.mediaType}
          watchlists={pickerWatchlists}
          isAuthenticated={isAuthenticated}
          onPrevious={
            selectedIndex > 0 ? () => setSelectedItem(displayItems[selectedIndex - 1]) : undefined
          }
          onNext={
            selectedIndex >= 0 && selectedIndex < displayItems.length - 1
              ? () => setSelectedItem(displayItems[selectedIndex + 1])
              : undefined
          }
          onAddToWatchlist={wid => handleAddToList(wid, selectedItem)}
          onRemoveFromWatchlist={wid => handleRemoveFromList(wid, selectedItem)}
        />
      )}
    </section>
  );
}

function RecommendationsHeader({ content, canEdit }: { content: Content; canEdit: boolean }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white">
        {canEdit
          ? content.watchlists.recommendations.title
          : content.watchlists.recommendations.similarTitle}
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        {content.watchlists.recommendations.subtitle}
      </p>
    </div>
  );
}

interface RecommendationRowProps {
  item: RecommendedItem;
  content: Content;
  canEdit: boolean;
  adding: boolean;
  inMyLists: boolean;
  pickerWatchlists: Watchlist[];
  onAddDirect: () => void;
  onPickerAdd: (watchlistId: string) => void;
  onPickerRemove: (watchlistId: string) => void;
  onOpenDetails: () => void;
}

function RecommendationRow({
  item,
  content,
  canEdit,
  adding,
  inMyLists,
  pickerWatchlists,
  onAddDirect,
  onPickerAdd,
  onPickerRemove,
  onOpenDetails,
}: RecommendationRowProps) {
  const posterUrl = getTMDBImageUrl(item.posterPath, 'w92');

  return (
    <tr className="group hover:bg-muted/30 transition-colors duration-150">
      {/* Poster + titre — une seule cellule : hover permissif (poster OU titre)
          déclenche l'œil + le souligné, comme la table principale */}
      <td className="w-[554px] max-w-[554px] py-2.5 pl-2 align-middle">
        <button
          type="button"
          onClick={onOpenDetails}
          className="group/cell flex max-w-full cursor-pointer items-center gap-3 text-left"
        >
          <div className="bg-muted relative h-16 w-12 shrink-0 overflow-hidden rounded">
            {posterUrl ? (
              <>
                <Image
                  src={posterUrl}
                  alt={item.title}
                  fill
                  sizes="48px"
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover/cell:opacity-100">
                  <Eye className="h-5 w-5 text-white" />
                </div>
              </>
            ) : (
              <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                ?
              </div>
            )}
          </div>
          <span className="min-w-0 truncate font-medium text-white underline-offset-2 group-hover/cell:underline">
            {item.title}
          </span>
        </button>
      </td>

      {/* Type — colonne 110px */}
      <td className="w-[110px] px-3 py-2.5 text-left align-middle">
        <span
          className={cn(
            'inline-block rounded-full px-2 py-1 text-xs font-medium',
            item.mediaType === 'movie'
              ? 'bg-blue-500/10 text-blue-400'
              : 'bg-purple-500/10 text-purple-400'
          )}
        >
          {item.mediaType === 'movie'
            ? content.watchlists.contentTypes.movie
            : content.watchlists.contentTypes.series}
        </span>
      </td>

      {/* Format — colonne extensible */}
      <td className="text-muted-foreground px-3 py-2.5 text-left align-middle text-sm">
        {formatItemFormat(item)}
      </td>

      {/* Action — colonne fixe alignée à droite */}
      <td className="w-[140px] py-2.5 pr-2 text-right align-middle">
        {canEdit ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddDirect}
            disabled={adding}
            className="rounded-full border-white/60 bg-transparent px-5 font-semibold capitalize text-white hover:border-white hover:bg-transparent hover:text-white dark:border-white/60 dark:bg-transparent dark:hover:border-white dark:hover:bg-transparent"
          >
            {content.watchlists.add}
          </Button>
        ) : (
          <div className="inline-flex px-[30px]">
            <WatchlistPickerMenu
              watchlists={pickerWatchlists}
              tmdbId={item.tmdbId}
              onAdd={onPickerAdd}
              onRemove={onPickerRemove}
              addToLabel={content.watchlists.addToWatchlist}
              noWatchlistLabel={content.watchlists.noWatchlist}
              side="left"
              align="start"
            >
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="hover:bg-muted inline-flex cursor-pointer rounded p-2 transition-colors"
                  disabled={adding}
                  title={content.watchlists.addToWatchlist}
                >
                  {inMyLists ? (
                    <Image
                      src="/checkGreenFull.svg"
                      alt=""
                      width={18}
                      height={18}
                      className="h-[18px] w-[18px]"
                    />
                  ) : (
                    <Image
                      src="/plus2.svg"
                      alt=""
                      width={18}
                      height={18}
                      className="h-[18px] w-[18px] opacity-70 brightness-0 invert"
                    />
                  )}
                </button>
              </DropdownMenu.Trigger>
            </WatchlistPickerMenu>
          </div>
        )}
      </td>
    </tr>
  );
}
