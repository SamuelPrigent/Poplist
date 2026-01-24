'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowLeft, Calendar, Check, Eye, Search, Star, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NavigationArrows } from '@/components/ui/navigation-arrows';
import type { FullMediaDetails, Watchlist, WatchlistItem } from '@/lib/api-client';
import { watchlistAPI } from '@/lib/api-client';
import { getLocalWatchlists } from '@/lib/localStorageHelpers';
import { deleteCachedThumbnail } from '@/lib/thumbnailGenerator';
import { getTMDBLanguage, getTMDBRegion, resizeTMDBPoster } from '@/lib/utils';
import { useLanguageStore } from '@/store/language';

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  watchlist: Watchlist;
  onSuccess: () => void;
  offline?: boolean;
}

interface SearchResult {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
}

export function AddItemModal({
  open,
  onOpenChange,
  watchlist,
  onSuccess,
  offline = false,
}: AddItemModalProps) {
  const { content, language } = useLanguageStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState<Set<number>>(new Set());
  const [removedItemIds, setRemovedItemIds] = useState<Set<number>>(new Set());
  const searchTimeoutRef = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // State for inline details view
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [itemDetails, setItemDetails] = useState<FullMediaDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fresh watchlist items - fetched when modal opens
  const [freshWatchlistItems, setFreshWatchlistItems] = useState<WatchlistItem[]>(watchlist.items);

  // Get language code from store
  const languageCode = getTMDBLanguage(language);
  const region = getTMDBRegion(language);

  // Fetch fresh watchlist items when modal opens
  useEffect(() => {
    if (!open) return;

    const fetchFreshItems = async () => {
      try {
        if (offline) {
          const localWatchlists = getLocalWatchlists();
          const freshWatchlist = localWatchlists.find(w => w.id === watchlist.id);
          if (freshWatchlist) {
            setFreshWatchlistItems(freshWatchlist.items);
          }
        } else {
          const { watchlist: freshWatchlist } = await watchlistAPI.getById(watchlist.id);
          setFreshWatchlistItems(freshWatchlist.items);
        }
      } catch (error) {
        console.error('Failed to fetch fresh watchlist items:', error);
        setFreshWatchlistItems(watchlist.items);
      }
    };

    fetchFreshItems();
  }, [open, watchlist.id, offline, watchlist.items]);

  // Call onSuccess when modal closes if items were added/removed
  useEffect(() => {
    if (!open) {
      if (addedItemIds.size > 0 || removedItemIds.size > 0) {
        onSuccess();
        setAddedItemIds(new Set());
        setRemovedItemIds(new Set());
      }
      const timer = setTimeout(() => {
        setSearchQuery('');
        setSearchResults([]);
        setSelectedItem(null);
        setSelectedIndex(-1);
        setItemDetails(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, addedItemIds.size, removedItemIds.size, onSuccess]);

  // Debounced search
  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await watchlistAPI.searchTMDB({
          query: query.trim(),
          language: languageCode,
          region,
        });
        setSearchResults(data.results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    },
    [languageCode, region]
  );

  const onSearchChange = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      handleSearch(value);
    }, 500);
  };

  // Virtualizer setup
  const virtualizer = useVirtualizer({
    count: searchResults.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  const isItemInWatchlist = (tmdbId: number) => {
    const existsInWatchlist = freshWatchlistItems.some(item => item.tmdbId === tmdbId);
    const wasAddedThisSession = addedItemIds.has(tmdbId);
    const wasRemovedThisSession = removedItemIds.has(tmdbId);

    if (wasRemovedThisSession) return false;
    return existsInWatchlist || wasAddedThisSession;
  };

  // Handle viewing item details inline
  const handleViewDetails = async (item: SearchResult, index: number) => {
    setSelectedItem(item);
    setSelectedIndex(index);
    setLoadingDetails(true);
    setItemDetails(null);

    try {
      const { details } = await watchlistAPI.getItemDetails(
        item.id.toString(),
        item.media_type,
        languageCode
      );
      setItemDetails(details);
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBackFromDetails = () => {
    setSelectedItem(null);
    setSelectedIndex(-1);
    setItemDetails(null);
  };

  const handleNavigatePrevious = () => {
    if (selectedIndex > 0) {
      const prevItem = searchResults[selectedIndex - 1];
      handleViewDetails(prevItem, selectedIndex - 1);
    }
  };

  const handleNavigateNext = () => {
    if (selectedIndex < searchResults.length - 1) {
      const nextItem = searchResults[selectedIndex + 1];
      handleViewDetails(nextItem, selectedIndex + 1);
    }
  };

  const handleAddItem = async (item: SearchResult) => {
    if (isItemInWatchlist(item.id)) return;

    try {
      if (offline) {
        const STORAGE_KEY = 'watchlists';
        const localWatchlists = localStorage.getItem(STORAGE_KEY);
        if (!localWatchlists) return;

        const watchlists: Watchlist[] = JSON.parse(localWatchlists);
        const watchlistIndex = watchlists.findIndex(w => w.id === watchlist.id);

        if (watchlistIndex === -1) return;

        const [platformList, mediaDetails] = await Promise.all([
          watchlistAPI.fetchTMDBProviders(item.id.toString(), item.media_type, region),
          watchlistAPI.getItemDetails(item.id.toString(), item.media_type, languageCode),
        ]);

        const newItem = {
          tmdbId: item.id,
          title: item.title || item.name || '',
          posterPath: item.poster_path,
          mediaType: item.media_type,
          platformList,
          runtime: mediaDetails.details.runtime,
          addedAt: new Date().toISOString(),
        };

        watchlists[watchlistIndex].items.push(newItem);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlists));
        deleteCachedThumbnail(watchlist.id);
      } else {
        await watchlistAPI.addItem(watchlist.id, {
          tmdbId: item.id.toString(),
          mediaType: item.media_type,
          language: languageCode,
          region,
        });
      }

      setAddedItemIds(prev => new Set(prev).add(item.id));
      setRemovedItemIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleRemoveItem = async (item: SearchResult) => {
    try {
      if (offline) {
        const STORAGE_KEY = 'watchlists';
        const localWatchlists = localStorage.getItem(STORAGE_KEY);
        if (!localWatchlists) return;

        const watchlists: Watchlist[] = JSON.parse(localWatchlists);
        const watchlistIndex = watchlists.findIndex(w => w.id === watchlist.id);

        if (watchlistIndex === -1) return;

        watchlists[watchlistIndex].items = watchlists[watchlistIndex].items.filter(
          i => i.tmdbId !== item.id
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlists));
        deleteCachedThumbnail(watchlist.id);
      } else {
        await watchlistAPI.removeItem(watchlist.id, item.id.toString());
      }

      setRemovedItemIds(prev => new Set(prev).add(item.id));
      setAddedItemIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const getYear = (item: SearchResult) => {
    const date = item.release_date || item.first_air_date;
    return date ? new Date(date).getFullYear() : null;
  };

  const getMediaType = (type: 'movie' | 'tv') => {
    return type === 'movie'
      ? content.watchlists.contentTypes.movie
      : content.watchlists.contentTypes.series;
  };

  const formatRuntime = (minutes: number | undefined) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const buildPosterUrl = (path: string | null) => {
    if (!path) return '';
    return `https://image.tmdb.org/t/p/w185${path}`;
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />

        {selectedItem && (
          <NavigationArrows
            onPrevious={selectedIndex > 0 ? handleNavigatePrevious : undefined}
            onNext={selectedIndex < searchResults.length - 1 ? handleNavigateNext : undefined}
            enableKeyboard={!!selectedItem}
          />
        )}

        <DialogPrimitive.Content className="border-border bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 w-full max-w-[1000px] translate-x-[-50%] translate-y-[-50%] rounded-lg border shadow-lg duration-200">
          <div className="flex max-h-[80vh] flex-col">
            {/* Header */}
            <div className="border-border flex items-center justify-between border-b p-6">
              <div>
                <DialogPrimitive.Title className="text-xl font-semibold">
                  {content.watchlists.addItem}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-muted-foreground mt-1 text-sm">
                  {content.watchlists.searchMoviesAndSeries}
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close className="cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>

            {/* Search Bar */}
            {!selectedItem && (
              <div className="p-6 pb-4">
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder={content.watchlists.searchPlaceholder}
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Inline Details View */}
            {selectedItem && (
              <div className="flex-1 overflow-y-auto px-6 pt-6 pb-10">
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-muted-foreground text-sm">
                      {content.watchlists.itemDetails.loading}
                    </div>
                  </div>
                ) : itemDetails ? (
                  <>
                    <button
                      type="button"
                      onClick={handleBackFromDetails}
                      className="text-muted-foreground mb-6 flex cursor-pointer items-center gap-2 text-sm transition-colors hover:text-white"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Retour</span>
                    </button>

                    <div className="flex gap-5">
                      <div className="shrink-0">
                        <div className="relative h-48 w-32 overflow-hidden rounded-lg shadow-lg">
                          {itemDetails.posterUrl ? (
                            <Image
                              src={resizeTMDBPoster(itemDetails.posterUrl, 'w185')}
                              alt={itemDetails.title}
                              fill
                              sizes="128px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center">
                              N/A
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <h2 className="text-2xl font-bold">{itemDetails.title}</h2>
                          {isItemInWatchlist(selectedItem.id) ? (
                            <Button
                              variant="outline"
                              onClick={() => handleRemoveItem(selectedItem)}
                              className="group/btn w-[105px] shrink-0 cursor-pointer gap-2 border-green-600/50 bg-green-800/35 text-[#0bd42c] transition-all duration-200 hover:border-red-600/50 hover:bg-red-900/35 hover:text-red-400"
                            >
                              <span className="relative h-4 w-4">
                                <Check className="absolute inset-0 h-4 w-4 transition-opacity duration-200 group-hover/btn:opacity-0" />
                                <X className="absolute inset-0 h-4 w-4 opacity-0 transition-opacity duration-200 group-hover/btn:opacity-100" />
                              </span>
                              <span className="relative">
                                <span className="transition-opacity duration-200 group-hover/btn:opacity-0">
                                  {content.watchlists.added}
                                </span>
                                <span className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover/btn:opacity-100">
                                  Retirer
                                </span>
                              </span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              onClick={() => handleAddItem(selectedItem)}
                              className="w-[105px] shrink-0 cursor-pointer"
                            >
                              {content.watchlists.add}
                            </Button>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
                            {selectedItem.media_type === 'movie'
                              ? content.watchlists.contentTypes.movie
                              : content.watchlists.contentTypes.series}
                          </span>
                          {itemDetails.releaseDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(itemDetails.releaseDate).getFullYear()}</span>
                            </div>
                          )}
                          {selectedItem.media_type === 'movie' && itemDetails.runtime && (
                            <span>{formatRuntime(itemDetails.runtime)}</span>
                          )}
                          {selectedItem.media_type === 'tv' && itemDetails.numberOfSeasons && (
                            <span>
                              {itemDetails.numberOfSeasons}{' '}
                              {itemDetails.numberOfSeasons > 1
                                ? content.watchlists.seriesInfo.seasons
                                : content.watchlists.seriesInfo.season}
                              {itemDetails.numberOfEpisodes &&
                                ` • ${itemDetails.numberOfEpisodes} ${content.watchlists.seriesInfo.episodes}`}
                            </span>
                          )}
                        </div>

                        {itemDetails.voteCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">
                              {(itemDetails.rating / 2).toFixed(1)} / 5
                            </span>
                            <span className="text-muted-foreground ml-1 text-xs">
                              ({itemDetails.voteCount} {content.watchlists.itemDetails.votes})
                            </span>
                          </div>
                        )}

                        {itemDetails.genres.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {itemDetails.genres.map(genre => (
                              <span
                                key={genre}
                                className="border-border bg-muted/50 rounded-full border px-3 py-1 text-xs"
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                        )}

                        {itemDetails.overview && (
                          <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
                            {itemDetails.overview}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-muted-foreground text-sm">
                      {content.watchlists.itemDetails.notAvailable}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Results */}
            {!selectedItem && (
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-6 pb-6"
                style={{
                  maxHeight: 'calc(80vh - 200px)',
                }}
              >
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-muted-foreground text-sm">
                      {content.watchlists.searching}
                    </div>
                  </div>
                )}

                {!loading && searchQuery && searchResults.length === 0 && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-muted-foreground text-sm">
                      {content.watchlists.noResults}
                    </div>
                  </div>
                )}

                {!loading && !searchQuery && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-muted-foreground text-sm">
                      {content.watchlists.startSearching}
                    </div>
                  </div>
                )}

                {!loading && searchResults.length > 0 && (
                  <div
                    style={{
                      height: `${virtualizer.getTotalSize()}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {virtualizer.getVirtualItems().map(virtualItem => {
                      const item = searchResults[virtualItem.index];
                      const year = getYear(item);
                      const posterUrl = buildPosterUrl(item.poster_path);
                      const isInWatchlist = isItemInWatchlist(item.id);

                      return (
                        <div
                          key={virtualItem.key}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualItem.start}px)`,
                          }}
                        >
                          <div className="hover:bg-muted/50 flex items-center gap-4 rounded-md p-3 transition-colors">
                            <button
                              type="button"
                              onClick={() => handleViewDetails(item, virtualItem.index)}
                              className="group/cell flex flex-1 cursor-pointer items-center gap-4 text-left"
                            >
                              <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md">
                                {posterUrl ? (
                                  <>
                                    <Image
                                      src={posterUrl}
                                      alt={item.title || item.name || ''}
                                      fill
                                      sizes="64px"
                                      className="object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover/cell:opacity-100">
                                      <Eye className="h-5 w-5 text-white" />
                                    </div>
                                  </>
                                ) : (
                                  <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                                    N/A
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 space-y-1">
                                <h3 className="line-clamp-1 font-semibold underline-offset-2 group-hover/cell:underline">
                                  {item.title || item.name}
                                </h3>

                                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                  <span className="bg-muted rounded-sm px-1.5 py-0.5 text-xs font-medium">
                                    {getMediaType(item.media_type)}
                                  </span>
                                  {year && (
                                    <>
                                      <span>•</span>
                                      <span>{year}</span>
                                    </>
                                  )}
                                  {formatRuntime(item.runtime) && (
                                    <>
                                      <span>•</span>
                                      <span>{formatRuntime(item.runtime)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </button>

                            <div className="shrink-0">
                              {isInWatchlist ? (
                                <Button
                                  variant="outline"
                                  onClick={() => handleRemoveItem(item)}
                                  className="group/btn w-[105px] cursor-pointer gap-2 border-green-600/50 bg-green-800/35 text-[#0bd42c] transition-all duration-200 hover:border-red-600/50 hover:bg-red-900/35 hover:text-red-400"
                                >
                                  <span className="relative h-4 w-4">
                                    <Check className="absolute inset-0 h-4 w-4 transition-opacity duration-200 group-hover/btn:opacity-0" />
                                    <X className="absolute inset-0 h-4 w-4 opacity-0 transition-opacity duration-200 group-hover/btn:opacity-100" />
                                  </span>
                                  <span className="relative">
                                    <span className="transition-opacity duration-200 group-hover/btn:opacity-0">
                                      {content.watchlists.added}
                                    </span>
                                    <span className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover/btn:opacity-100">
                                      Retirer
                                    </span>
                                  </span>
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  onClick={() => handleAddItem(item)}
                                  className="w-[105px] cursor-pointer"
                                >
                                  {content.watchlists.add}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
