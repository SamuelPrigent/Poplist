'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronLeft, ChevronRight, ChevronsUpDown, Eye, Plus, Star } from 'lucide-react';
import { AnimatePresence, domAnimation, LazyMotion, m } from 'motion/react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ItemDetailsModal } from '@/components/List/modal/ItemDetailsModal';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/context/auth-context';
import { type Watchlist, watchlistAPI } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { getLocalWatchlistsWithOwnership } from '@/lib/localStorageHelpers';
import { getTMDBLanguage, getTMDBRegion } from '@/lib/utils';
import { useLanguageStore } from '@/store/language';
import type { Content } from '@/types/content';

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  media_type?: string;
  vote_average: number;
}

// Generate 36 stable skeleton keys (6 columns × 6 rows)
// const SKELETON_KEYS = Array.from({ length: 36 }, (_, i) => `skeleton-${i + 1}`);

// Generate years from 2026 to 1895 (first film)
const YEARS = Array.from({ length: 2026 - 1895 + 1 }, (_, i) => 2026 - i);

// Function to get genres with translated names
const getGenres = (content: Content) => ({
  movie: [
    { id: 28, name: content.explore.genres.action },
    { id: 12, name: content.explore.genres.adventure },
    { id: 16, name: content.explore.genres.animation },
    { id: 35, name: content.explore.genres.comedy },
    { id: 80, name: content.explore.genres.crime },
    { id: 99, name: content.explore.genres.documentary },
    { id: 18, name: content.explore.genres.drama },
    { id: 10751, name: content.explore.genres.family },
    { id: 14, name: content.explore.genres.fantasy },
    { id: 27, name: content.explore.genres.horror },
    { id: 10749, name: content.explore.genres.romance },
    { id: 878, name: content.explore.genres.scienceFiction },
    { id: 53, name: content.explore.genres.thriller },
  ],
  tv: [
    { id: 16, name: content.explore.genres.animation },
    { id: 35, name: content.explore.genres.comedy },
    { id: 80, name: content.explore.genres.crime },
    { id: 99, name: content.explore.genres.documentary },
    { id: 18, name: content.explore.genres.drama },
    { id: 10751, name: content.explore.genres.family },
    { id: 10765, name: content.explore.genres.fantasy },
    { id: 10762, name: content.explore.genres.kids },
    { id: 9648, name: content.explore.genres.mystery },
    { id: 10766, name: content.explore.genres.soap },
    { id: 37, name: content.explore.genres.western },
  ],
});

export function ExploreContent() {
  const { content, language } = useLanguageStore();
  const { isAuthenticated } = useAuth();
  const tmdbLanguage = getTMDBLanguage(language);
  const tmdbRegion = getTMDBRegion(language);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Helper to update URL params
  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  // Use useMemo to memoize derived values from searchParams
  const mediaType = useMemo(() => {
    return (searchParams.get('type') || 'movie') as 'movie' | 'tv';
  }, [searchParams]);

  const filterType = useMemo(
    () => (searchParams.get('filter') as 'popular' | 'top_rated') || 'popular',
    [searchParams]
  );

  const selectedGenres = useMemo(() => {
    const genres = searchParams.get('genres');
    return genres ? genres.split(',').map(Number) : [];
  }, [searchParams]);

  // Extract year from date params (format: YYYY-MM-DD -> YYYY)
  const yearFromParam = useMemo(() => {
    const dateStr = searchParams.get('dateFrom') || '';
    return dateStr ? dateStr.split('-')[0] : '';
  }, [searchParams]);

  const yearToParam = useMemo(() => {
    const dateStr = searchParams.get('dateTo') || '';
    return dateStr ? dateStr.split('-')[0] : '';
  }, [searchParams]);

  const page = useMemo(() => Number(searchParams.get('page')) || 1, [searchParams]);

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    tmdbId: string;
    type: 'movie' | 'tv';
  } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Year picker state
  const [yearFrom, setYearFrom] = useState<string>(yearFromParam);
  const [yearTo, setYearTo] = useState<string>(yearToParam);
  const [openYearFrom, setOpenYearFrom] = useState(false);
  const [openYearTo, setOpenYearTo] = useState(false);

  // Filter yearTo list: can't be less than yearFrom
  const availableYearsTo = useMemo(() => {
    if (!yearFrom) return YEARS;
    const fromYear = Number.parseInt(yearFrom);
    return YEARS.filter(year => year >= fromYear);
  }, [yearFrom]);

  // Filter yearFrom list: can't be greater than yearTo
  const availableYearsFrom = useMemo(() => {
    if (!yearTo) return YEARS;
    const toYear = Number.parseInt(yearTo);
    return YEARS.filter(year => year <= toYear);
  }, [yearTo]);

  // Update URL when years change
  useEffect(() => {
    // Transform year to YYYY-01-01 format for API
    const currentDateFrom = searchParams.get('dateFrom') || '';
    const currentDateTo = searchParams.get('dateTo') || '';
    const newDateFrom = yearFrom ? `${yearFrom}-01-01` : '';
    const newDateTo = yearTo ? `${yearTo}-12-31` : '';

    if (currentDateFrom !== newDateFrom || currentDateTo !== newDateTo) {
      updateSearchParams({
        dateFrom: yearFrom ? `${yearFrom}-01-01` : null,
        dateTo: yearTo ? `${yearTo}-12-31` : null,
        page: '1',
      });
    }
  }, [yearFrom, yearTo, searchParams, updateSearchParams]);

  // Helper functions to update URL params
  const setMediaType = (type: 'movie' | 'tv') => {
    if (type === mediaType) return;
    updateSearchParams({
      type,
      genres: null, // Reset genres when changing media type (different genre IDs)
      page: '1',
    });
  };

  const updateFilterType = (filter: 'popular' | 'top_rated') => {
    updateSearchParams({
      filter,
      page: '1',
    });
  };

  const toggleGenre = (genre: number) => {
    let newGenres = [...selectedGenres];

    if (newGenres.includes(genre)) {
      newGenres = newGenres.filter(g => g !== genre);
    } else {
      newGenres.push(genre);
    }

    updateSearchParams({
      genres: newGenres.length > 0 ? newGenres.join(',') : null,
      page: '1',
    });
  };

  const clearGenres = () => {
    updateSearchParams({
      genres: null,
      page: '1',
    });
  };

  const updatePage = (newPage: number) => {
    updateSearchParams({
      page: newPage.toString(),
    });
  };

  // Ref to track if this is initial mount (skip animation on first load)
  const isInitialMount = useRef(true);
  const gridRef = useRef<HTMLDivElement>(null);

  // Smooth scroll to top when page changes
  useEffect(() => {
    if (isInitialMount.current) {
      // On initial mount, scroll instantly to top
      window.scrollTo({ top: 0, behavior: 'instant' });
      isInitialMount.current = false;
    } else {
      // On subsequent page changes, smooth scroll with a nice easing
      const scrollToTop = () => {
        const start = window.scrollY;
        const duration = 600;
        const startTime = performance.now();

        const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

        const animateScroll = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = easeOutCubic(progress);

          window.scrollTo(0, start * (1 - easedProgress));

          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          }
        };

        requestAnimationFrame(animateScroll);
      };

      scrollToTop();
    }
  }, [page]);

  // Fetch user watchlists (authenticated or offline)
  useEffect(() => {
    if (isAuthenticated) {
      watchlistAPI
        .getMine()
        .then(data => {
          setWatchlists(data.watchlists);
        })
        .catch(console.error);
    } else {
      const localWatchlists = getLocalWatchlistsWithOwnership();
      setWatchlists(localWatchlists);
    }
  }, [isAuthenticated]);

  // Fetch media based on filters using discover API
  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      try {
        const itemsPerDisplayPage = 60; // 6 columns × 10 rows = exactly 3 TMDB pages
        const pagesNeeded = 3; // 60 items / 20 per TMDB page = 3 pages exactly
        const startTMDBPage = (page - 1) * pagesNeeded + 1;

        let allResults: MediaItem[] = [];
        let fetchedTotalPages = 1;

        for (let i = 0; i < pagesNeeded; i++) {
          const currentTMDBPage = startTMDBPage + i;
          const params = new URLSearchParams({
            language: tmdbLanguage,
            page: currentTMDBPage.toString(),
          });

          // Always use discover endpoint
          const sortBy = filterType === 'top_rated' ? 'vote_average.desc' : 'popularity.desc';
          params.append('sort_by', sortBy);

          // Always add minimum vote count and rating to avoid absurd results
          params.append('vote_count.gte', '100');
          params.append('vote_average.gte', '5.0');

          // Add genre filter (OR logic with pipe separator)
          if (selectedGenres.length > 0) {
            params.append('with_genres', selectedGenres.join('|'));
          }

          // Add date filters (year transformed to YYYY-01-01 and YYYY-12-31)
          const dateFrom = yearFrom ? `${yearFrom}-01-01` : '';
          const dateTo = yearTo ? `${yearTo}-12-31` : '';

          // Use correct date field based on media type
          // Movies: primary_release_date | TV Shows: first_air_date
          const dateField = mediaType === 'movie' ? 'primary_release_date' : 'first_air_date';

          if (dateFrom) {
            params.append(`${dateField}.gte`, dateFrom);
          }
          if (dateTo) {
            params.append(`${dateField}.lte`, dateTo);
          }

          const url = `/api/tmdb/discover/${mediaType}?${params.toString()}`;

          const response = await fetch(url);
          const data = await response.json();

          allResults = [...allResults, ...(data.results || [])];
          fetchedTotalPages = data.total_pages || 1;
        }

        // Take exactly 60 items for this page
        const displayResults = allResults.slice(0, itemsPerDisplayPage);

        setMedia(displayResults);

        // Each display page = 3 TMDB pages, so divide by 3
        const totalDisplayPages = Math.floor(fetchedTotalPages / pagesNeeded);
        setTotalPages(Math.min(totalDisplayPages, 166)); // 166 * 3 = 498 TMDB pages (under 500 limit)
      } catch (error) {
        console.error('Failed to fetch media:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [mediaType, filterType, selectedGenres, page, yearFrom, yearTo, tmdbLanguage]);

  const handleAddToWatchlist = async (watchlistId: string, mediaItem: MediaItem) => {
    try {
      setAddingTo(mediaItem.id);

      // Determine media type for this item
      const itemType: 'movie' | 'tv' = mediaItem.title ? 'movie' : 'tv';

      if (isAuthenticated) {
        await watchlistAPI.addItem(watchlistId, {
          tmdbId: mediaItem.id.toString(),
          mediaType: itemType,
          language: tmdbLanguage,
          region: tmdbRegion,
        });
      } else {
        const localWatchlists = localStorage.getItem('watchlists');
        if (localWatchlists) {
          const watchlistsData: Watchlist[] = JSON.parse(localWatchlists);
          const watchlistIndex = watchlistsData.findIndex(w => w.id === watchlistId);

          if (watchlistIndex !== -1) {
            const itemExists = watchlistsData[watchlistIndex].items.some(
              item => item.tmdbId === mediaItem.id
            );

            if (!itemExists) {
              const [platformList, mediaDetails] = await Promise.all([
                watchlistAPI.fetchTMDBProviders(mediaItem.id.toString(), itemType, tmdbRegion),
                watchlistAPI.getItemDetails(mediaItem.id.toString(), itemType, tmdbLanguage),
              ]);

              const newItem = {
                tmdbId: mediaItem.id,
                title: mediaItem.title || mediaItem.name || '',
                posterPath: mediaItem.poster_path || null,
                mediaType: itemType,
                platformList,
                runtime: mediaDetails.details.runtime,
                addedAt: new Date().toISOString(),
              };

              watchlistsData[watchlistIndex].items.push(newItem);
              watchlistsData[watchlistIndex].updatedAt = new Date().toISOString();
              localStorage.setItem('watchlists', JSON.stringify(watchlistsData));

              const updatedWatchlists = getLocalWatchlistsWithOwnership();
              setWatchlists(updatedWatchlists);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    } finally {
      setAddingTo(null);
    }
  };

  const handleItemClick = (item: MediaItem, index: number) => {
    const itemType = item.title ? 'movie' : 'tv';
    setSelectedItem({
      tmdbId: item.id.toString(),
      type: itemType,
    });
    setSelectedIndex(index);
    setDetailsModalOpen(true);
  };

  const handleNavigatePrevious = () => {
    if (selectedIndex > 0) {
      const prevItem = media[selectedIndex - 1];
      handleItemClick(prevItem, selectedIndex - 1);
    }
  };

  const handleNavigateNext = () => {
    if (selectedIndex < media.length - 1) {
      const nextItem = media[selectedIndex + 1];
      handleItemClick(nextItem, selectedIndex + 1);
    }
  };

  // Get available genres based on selected media types
  const availableGenres = useMemo(() => {
    const genres = getGenres(content);
    return mediaType === 'movie' ? genres.movie : genres.tv;
  }, [mediaType, content]);

  return (
    <div className="bg-background mb-24 min-h-screen p-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12 text-left">
          <h1 className="mb-4 text-5xl font-bold text-white">{content.explore.title}</h1>
          <p className="text-muted-foreground text-lg">{content.explore.subtitle}</p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Main Filters Row - Media Type + Sort Type */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Media Type Filter - Single select switch */}
            <div className="bg-muted/50 rounded-md p-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMediaType('movie')}
                  className={cn(
                    'cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors',
                    mediaType === 'movie'
                      ? 'bg-white text-black'
                      : 'text-muted-foreground hover:text-foreground bg-transparent'
                  )}
                >
                  {content.explore.filters.movies}
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('tv')}
                  className={cn(
                    'cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors',
                    mediaType === 'tv'
                      ? 'bg-white text-black'
                      : 'text-muted-foreground hover:text-foreground bg-transparent'
                  )}
                >
                  {content.explore.filters.series}
                </button>
              </div>
            </div>

            {/* Sort Filter - Single select in dark container */}
            <div className="bg-muted/50 rounded-md p-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updateFilterType('popular')}
                  className={cn(
                    'cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors',
                    filterType === 'popular'
                      ? 'bg-white text-black'
                      : 'text-muted-foreground hover:text-foreground bg-transparent'
                  )}
                >
                  {content.explore.filters.popular}
                </button>
                <button
                  type="button"
                  onClick={() => updateFilterType('top_rated')}
                  className={cn(
                    'cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors',
                    filterType === 'top_rated'
                      ? 'bg-white text-black'
                      : 'text-muted-foreground hover:text-foreground bg-transparent'
                  )}
                >
                  {content.explore.filters.bestRated}
                </button>
              </div>
            </div>
          </div>

          {/* Year Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Year From Picker - Combobox */}
            <Popover open={openYearFrom} onOpenChange={setOpenYearFrom}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openYearFrom}
                  className="w-[200px] cursor-pointer justify-between"
                >
                  {yearFrom || content.explore.filters.yearMin}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder={content.explore.filters.search} />
                  <CommandList>
                    <CommandEmpty>{content.explore.filters.noYearFound}</CommandEmpty>
                    <CommandGroup>
                      {availableYearsFrom.map(year => (
                        <CommandItem
                          key={year}
                          value={year.toString()}
                          onSelect={currentValue => {
                            setYearFrom(currentValue === yearFrom ? '' : currentValue);
                            setOpenYearFrom(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              yearFrom === year.toString() ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {year}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Year To Picker - Combobox */}
            <Popover open={openYearTo} onOpenChange={setOpenYearTo}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openYearTo}
                  className="w-[200px] cursor-pointer justify-between"
                >
                  {yearTo || content.explore.filters.yearMax}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder={content.explore.filters.search} />
                  <CommandList>
                    <CommandEmpty>{content.explore.filters.noYearFound}</CommandEmpty>
                    <CommandGroup>
                      {availableYearsTo.map(year => (
                        <CommandItem
                          key={year}
                          value={year.toString()}
                          onSelect={currentValue => {
                            setYearTo(currentValue === yearTo ? '' : currentValue);
                            setOpenYearTo(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              yearTo === year.toString() ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {year}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Clear years button */}
            {(yearFrom || yearTo) && (
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                onClick={() => {
                  setYearFrom('');
                  setYearTo('');
                }}
              >
                {content.explore.filters.clearYears}
              </Button>
            )}
          </div>

          {/* Genre Filter Row */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => clearGenres()}
              className="cursor-pointer"
            >
              {selectedGenres.length === 0 ? (
                <span className="flex animate-fade-in items-center rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black">
                  {content.explore.filters.all}
                </span>
              ) : (
                <span className="bg-muted text-muted-foreground hover:text-foreground flex animate-fade-in items-center rounded-lg px-3 py-1.5 text-sm font-medium">
                  {content.explore.filters.all}
                </span>
              )}
            </button>
            {availableGenres.map(genre => (
              <button
                type="button"
                key={genre.id}
                onClick={() => toggleGenre(genre.id)}
                className="cursor-pointer"
              >
                {selectedGenres.includes(genre.id) ? (
                  <span className="flex animate-fade-in items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black">
                    <Check className="h-3.5 w-3.5" />
                    {genre.name}
                  </span>
                ) : (
                  <span className="bg-muted text-muted-foreground hover:text-foreground flex animate-fade-in items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium">
                    {genre.name}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Media Grid */}
        <LazyMotion features={domAnimation}>
          <AnimatePresence mode="wait">
            {loading ? (
              // Minimal loading state - just reserve space, no skeleton
              // The stagger animation on cards provides visual feedback
              <m.div
                key="loading-spacer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="mt-12 min-h-[600px]"
              />
            ) : (
              <m.div
                key={`grid-${page}-${mediaType}-${filterType}-${selectedGenres.join('-')}-${yearFrom}-${yearTo}`}
                ref={gridRef}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.03,
                      delayChildren: 0.1,
                    },
                  },
                }}
              >
                <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {media.map((item, index) => (
                    <m.div
                      role="button"
                      tabIndex={0}
                      key={`${item.id}-${index}-${page}`}
                      variants={{
                        hidden: { opacity: 0, y: 20, scale: 0.95 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          transition: {
                            duration: 0.4,
                            ease: [0.25, 0.46, 0.45, 0.94],
                          },
                        },
                      }}
                      className="group relative cursor-pointer overflow-hidden rounded-lg text-left"
                      onClick={() => handleItemClick(item, index)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleItemClick(item, index);
                        }
                      }}
                    >
                      {/* Poster with zoom */}
                      <div className="bg-muted relative aspect-2/3 overflow-hidden rounded-lg">
                        {item.poster_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                            alt={item.title || item.name || ''}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            unoptimized
                          />
                        ) : (
                          <div className="text-muted-foreground flex h-full items-center justify-center">
                            ?
                          </div>
                        )}
                      </div>

                      {/* Dark overlay with centered eye icon on hover */}
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 transition-all duration-300 group-hover:bg-black/50">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <Eye className="h-7 w-7 text-white" />
                        </div>
                      </div>

                      {/* Bottom gradient - always visible */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-b-lg bg-linear-to-t from-black/80 via-black/30 to-transparent" />

                      {/* Rating badge */}
                      {item.vote_average > 0 && (
                        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 backdrop-blur-sm">
                          <Star
                            className="h-3.5 w-3.5 fill-yellow-500/70 stroke-yellow-500"
                            strokeWidth={1.5}
                          />
                          <span className="text-sm font-semibold text-white">
                            {item.vote_average.toFixed(1)}
                          </span>
                        </div>
                      )}

                      {/* Add button in top right */}
                      {(isAuthenticated || watchlists.length > 0) && (
                        <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                          <DropdownMenu.Root
                            onOpenChange={open => {
                              if (!open) {
                                setTimeout(() => {
                                  if (document.activeElement instanceof HTMLElement) {
                                    document.activeElement.blur();
                                  }
                                }, 0);
                              }
                            }}
                          >
                            <DropdownMenu.Trigger asChild>
                              <button
                                type="button"
                                className="cursor-pointer rounded-full bg-black/70 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black"
                                disabled={addingTo === item.id}
                                onClick={e => e.stopPropagation()}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </DropdownMenu.Trigger>

                            <DropdownMenu.Portal>
                              <DropdownMenu.Content
                                className="border-border bg-popover z-50 min-w-[200px] overflow-hidden rounded-md border p-1 shadow-md"
                                sideOffset={5}
                                onClick={e => e.stopPropagation()}
                              >
                                <DropdownMenu.Label className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
                                  {content.watchlists.addToWatchlist}
                                </DropdownMenu.Label>
                                {watchlists.filter(w => w.isOwner || w.isCollaborator).length >
                                0 ? (
                                  watchlists
                                    .filter(w => w.isOwner || w.isCollaborator)
                                    .map(watchlist => (
                                      <DropdownMenu.Item
                                        key={watchlist.id}
                                        className="hover:bg-accent hover:text-accent-foreground relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none"
                                        onSelect={() => handleAddToWatchlist(watchlist.id, item)}
                                      >
                                        {watchlist.name}
                                      </DropdownMenu.Item>
                                    ))
                                ) : (
                                  <div className="text-muted-foreground px-2 py-1.5 text-sm">
                                    {content.watchlists.noWatchlist}
                                  </div>
                                )}
                              </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                          </DropdownMenu.Root>
                        </div>
                      )}
                    </m.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="cursor-pointer"
                      onClick={() => updatePage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="text-muted-foreground text-sm">
                      {content.explore.pagination.pageOf
                        .replace('{page}', String(page))
                        .replace('{totalPages}', String(totalPages))}
                    </span>

                    <Button
                      variant="outline"
                      size="icon"
                      className="cursor-pointer"
                      onClick={() => updatePage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </m.div>
            )}
          </AnimatePresence>
        </LazyMotion>
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <ItemDetailsModal
          open={detailsModalOpen}
          onOpenChange={open => {
            setDetailsModalOpen(open);
            if (!open) {
              setSelectedItem(null);
              setSelectedIndex(-1);
            }
          }}
          tmdbId={selectedItem.tmdbId}
          type={selectedItem.type}
          onPrevious={selectedIndex > 0 ? handleNavigatePrevious : undefined}
          onNext={selectedIndex < media.length - 1 ? handleNavigateNext : undefined}
        />
      )}
    </div>
  );
}
