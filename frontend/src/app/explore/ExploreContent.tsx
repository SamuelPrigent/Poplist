'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Eye,
  Plus,
  Search,
  Star,
  X,
} from 'lucide-react';
import { AnimatePresence, domAnimation, LazyMotion, m } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Img as Image } from '@/components/ui/Img';
import { tmdbQueries, watchlistsQueries } from '@/api/queries';
import { ItemDetailsModal } from '@/components/List/modal/ItemDetailsModal';
import { WatchlistPickerMenu } from '@/components/List/WatchlistPickerMenu';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { WheelPicker } from '@/components/ui/wheel-picker';
import { useAuth } from '@/context/auth-context';
import {
  createPlaceholderItem,
  watchlists as watchlistsApi,
  type Watchlist,
  type WatchlistItem,
} from '@/api';
import { cn } from '@/lib/cn';
import { getTMDBLanguage, getTMDBRegion, tmdbPosterSrcSet } from '@/lib/utils';
import { useLanguageStore } from '@/store/language';
import type { Content } from '@/types/content';
import { Section } from '#/components/layout/Section.tsx';

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

// Function to get genres with translated names.
// Note: `drama` (id 18) volontairement retiré — 90% des contenus softcore/
// "indécence" non flaggués `adult: true` côté TMDB sont catégorisés `Drame`.
// Le user fait remonter trop d'items inappropriés via ce filtre.
const getGenres = (content: Content) => ({
  movie: [
    { id: 28, name: content.explore.genres.action },
    { id: 12, name: content.explore.genres.adventure },
    { id: 16, name: content.explore.genres.animation },
    { id: 35, name: content.explore.genres.comedy },
    { id: 80, name: content.explore.genres.crime },
    { id: 99, name: content.explore.genres.documentary },
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

  // Track active grid column count (matches Tailwind breakpoints on the grid below)
  const [gridCols, setGridCols] = useState(6);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1280) setGridCols(6);
      else if (w >= 1024) setGridCols(5);
      else if (w >= 768) setGridCols(4);
      else if (w >= 640) setGridCols(3);
      else setGridCols(2);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Filtres en state local (plus de query params dans l'URL) : le back
  // handler des drawers consomme des entrées d'historique fantômes, ce qui
  // annulait toute navigation faite pendant qu'un drawer était ouvert
  // (appliquer un filtre → URL revertée à la fermeture). Pas besoin d'URLs
  // de recherche partageables ici.
  const [mediaType, setMediaTypeState] = useState<'movie' | 'tv'>('movie');
  const [filterType, setFilterTypeState] = useState<'popular' | 'top_rated'>('popular');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  // Années au format 'YYYY' ('' = pas de filtre)
  const [yearFromParam, setYearFromParam] = useState('');
  const [yearToParam, setYearToParam] = useState('');
  const [page, setPage] = useState(1);

  // Recherche textuelle. > 3 caractères = on bascule sur le endpoint
  // /tmdb/search/:type (filtre genre/year/sort appliqués côté backend après
  // réception). Sinon, mode discover habituel.
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const isSearching = query.length > 3;

  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [addingTo] = useState<number | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    tmdbId: string;
    type: 'movie' | 'tv';
  } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const [openYearFrom, setOpenYearFrom] = useState(false);
  const [openYearTo, setOpenYearTo] = useState(false);
  const [openGenres, setOpenGenres] = useState(false);

  // Drawers mobile (Genres / Année)
  const CURRENT_YEAR = YEARS[0];
  const [genresDrawerOpen, setGenresDrawerOpen] = useState(false);
  const [yearDrawerOpen, setYearDrawerOpen] = useState(false);
  // Valeurs "settled" des roues (mêmes règles de clamp que l'app mobile).
  const [settledFrom, setSettledFrom] = useState(CURRENT_YEAR);
  const [settledTo, setSettledTo] = useState(CURRENT_YEAR);

  const handleFromSettled = useCallback((v: number) => {
    setSettledFrom(v);
    setSettledTo((prev) => (prev < v ? v : prev));
  }, []);
  const handleToSettled = useCallback((v: number) => {
    setSettledTo(v);
    setSettledFrom((prev) => (prev > v ? v : prev));
  }, []);

  // Blur le bouton déclencheur avant d'ouvrir un drawer : sinon vaul pose
  // aria-hidden sur le layout pendant que le bouton garde le focus → warning
  // Chrome "Blocked aria-hidden on an element because its descendant retained
  // focus".
  const blurActiveElement = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const openGenresDrawer = () => {
    blurActiveElement();
    setGenresDrawerOpen(true);
  };

  const openYearDrawer = () => {
    blurActiveElement();
    setSettledFrom(yearFromParam ? Number(yearFromParam) : CURRENT_YEAR);
    setSettledTo(yearToParam ? Number(yearToParam) : CURRENT_YEAR);
    setYearDrawerOpen(true);
  };
  const applyYear = () => {
    setYearFromParam(String(settledFrom));
    setYearToParam(String(settledTo));
    setPage(1);
    setYearDrawerOpen(false);
  };
  const resetYear = () => {
    setYearFromParam('');
    setYearToParam('');
    setPage(1);
    setSettledFrom(CURRENT_YEAR);
    setSettledTo(CURRENT_YEAR);
    setYearDrawerOpen(false);
  };

  // Filter yearTo list: can't be less than yearFrom
  const availableYearsTo = useMemo(() => {
    if (!yearFromParam) return YEARS;
    const fromYear = Number.parseInt(yearFromParam);
    return YEARS.filter((year) => year >= fromYear);
  }, [yearFromParam]);

  // Filter yearFrom list: can't be greater than yearTo
  const availableYearsFrom = useMemo(() => {
    if (!yearToParam) return YEARS;
    const toYear = Number.parseInt(yearToParam);
    return YEARS.filter((year) => year <= toYear);
  }, [yearToParam]);

  // Debounce de la search bar → applique la recherche (300ms). Reset `page`
  // à 1 pour ne pas pointer sur une page n d'une recherche précédente qui
  // n'aurait plus autant de résultats.
  useEffect(() => {
    if (searchInput === query) return;
    const t = window.setTimeout(() => {
      setQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput, query]);

  const setMediaType = (type: 'movie' | 'tv') => {
    if (type === mediaType) return;
    setMediaTypeState(type);
    setSelectedGenres([]); // Reset genres when changing media type (different genre IDs)
    setPage(1);
  };

  const updateFilterType = (filter: 'popular' | 'top_rated') => {
    setFilterTypeState(filter);
    setPage(1);
  };

  const toggleGenre = (genre: number) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
    setPage(1);
  };

  const clearGenres = () => {
    setSelectedGenres([]);
    setPage(1);
  };

  const updatePage = (newPage: number) => {
    setPage(newPage);
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

  // Mes watchlists côté auth via TQ (partagé avec /home, /account/lists, etc.)
  const myWatchlistsQuery = useQuery({
    ...watchlistsQueries.mine(),
    enabled: isAuthenticated,
  });
  useEffect(() => {
    if (isAuthenticated && myWatchlistsQuery.data) {
      setWatchlists(myWatchlistsQuery.data.watchlists);
    }
  }, [isAuthenticated, myWatchlistsQuery.data]);

  // Fetch media discover via 3 queries TQ en parallèle. Le cache TQ partage
  // les résultats avec d'autres pages (Home) si mêmes paramètres. TQ gère
  // l'abort automatique des queries obsolètes (plus besoin d'AbortController
  // manuel).
  const startTMDBPage = (page - 1) * 3 + 1;
  const sortBy = filterType === 'top_rated' ? 'vote_average.desc' : 'popularity.desc';
  const dateFrom = yearFromParam ? `${yearFromParam}-01-01` : '';
  const dateTo = yearToParam ? `${yearToParam}-12-31` : '';
  const releaseDateGte = dateFrom || undefined;
  const releaseDateLte = dateTo || undefined;
  const withGenres = selectedGenres.length > 0 ? selectedGenres.join('|') : undefined;

  const discoverQueries = useQueries({
    queries: [0, 1, 2].map((i) => ({
      ...tmdbQueries.discover(mediaType, {
        page: startTMDBPage + i,
        language: tmdbLanguage,
        sortBy,
        voteCountGte: 100,
        voteAverageGte: 5.0,
        releaseDateGte,
        releaseDateLte,
        withGenres,
      }),
      // Désactivé en mode search : le composant utilise searchExploreQuery
      // à la place. On garde les keys dans le cache pour cache hit au retour
      // (clear de la search).
      enabled: !isSearching,
    })),
  });

  // Recherche textuelle (> 3 caractères). Filtres genre/year/sort appliqués
  // côté backend. 1 query = 1 round-trip qui agrège 3 pages TMDB.
  const searchExploreQuery = useQuery(
    tmdbQueries.searchExplore(mediaType, {
      query,
      language: tmdbLanguage,
      page,
      withGenres: selectedGenres.length > 0 ? selectedGenres : undefined,
      yearFrom: yearFromParam ? Number(yearFromParam) : undefined,
      yearTo: yearToParam ? Number(yearToParam) : undefined,
      sortBy: filterType === 'top_rated' ? 'vote_average' : 'popularity',
    }),
  );

  const loading = isSearching
    ? searchExploreQuery.isPending
    : discoverQueries.some((q) => q.isPending);

  const media = useMemo<MediaItem[]>(() => {
    if (isSearching) {
      return (searchExploreQuery.data?.results ?? []) as MediaItem[];
    }
    const all = discoverQueries.flatMap((q) => (q.data?.results ?? []) as MediaItem[]);
    return all.slice(0, 60);
  }, [isSearching, searchExploreQuery.data, discoverQueries]);

  const totalPages = useMemo(() => {
    if (isSearching) {
      return Math.max(1, searchExploreQuery.data?.total_pages ?? 1);
    }
    const first = discoverQueries[0]?.data?.total_pages ?? 1;
    return Math.min(Math.floor(first / 3), 166);
  }, [isSearching, searchExploreQuery.data, discoverQueries]);

  const handleAddFromDetails = async (
    watchlistId: string,
    tmdbId: string,
    mediaType: 'movie' | 'tv',
  ) => {
    const idNum = Number(tmdbId);
    const placeholder = createPlaceholderItem({
      tmdbId: idNum,
      title: '',
      posterPath: null,
      mediaType,
    });
    setWatchlists((prev) =>
      prev.map((wl) =>
        wl.id === watchlistId && !wl.items.some((it) => it.tmdbId === idNum)
          ? { ...wl, items: [...wl.items, placeholder] }
          : wl,
      ),
    );
    console.log('[explore] handleAddFromDetails called', { watchlistId, tmdbId, mediaType });
    try {
      await watchlistsApi.addItem(watchlistId, {
        tmdbId,
        mediaType,
        language: tmdbLanguage,
        region: tmdbRegion,
      });
      console.log('[explore] addItem success, firing toast');
      toast.success('Ajouté à la liste');
    } catch (error) {
      console.error('[explore] Failed to add to watchlist:', error);
      setWatchlists((prev) =>
        prev.map((wl) =>
          wl.id === watchlistId
            ? { ...wl, items: wl.items.filter((it) => it.tmdbId !== idNum) }
            : wl,
        ),
      );
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleRemoveFromDetails = async (watchlistId: string, tmdbId: string) => {
    const idNum = Number(tmdbId);
    let removed: WatchlistItem | undefined;
    setWatchlists((prev) =>
      prev.map((wl) => {
        if (wl.id !== watchlistId) return wl;
        removed = wl.items.find((it) => it.tmdbId === idNum);
        return { ...wl, items: wl.items.filter((it) => it.tmdbId !== idNum) };
      }),
    );
    try {
      await watchlistsApi.removeItem(watchlistId, tmdbId);
      toast.success('Retiré de la liste');
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      if (removed) {
        const restored = removed;
        setWatchlists((prev) =>
          prev.map((wl) =>
            wl.id === watchlistId ? { ...wl, items: [...wl.items, restored] } : wl,
          ),
        );
      }
      toast.error('Erreur lors du retrait');
    }
  };

  const handleItemClick = (item: MediaItem, index: number) => {
    blurActiveElement();
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
    // Pas de padding horizontal ici : comme sur /home, c'est <Section> qui gère
    // la largeur (93% + max-w + px-12) → alignement identique navbar/home.
    <div className="bg-background mb-24 min-h-screen py-8 max-[749px]:mb-4 max-[749px]:py-4">
      <Section className="pt-2">
        {/* <div className="container mx-auto px-4"> */}
        {/* Header */}
        <div className="mb-7 text-left max-[749px]:mb-4">
          <h1 className="mb-2 text-4xl font-bold text-white max-[749px]:text-2xl">
            {content.explore.title}
          </h1>
          <p className="text-muted-foreground text-normal max-[749px]:text-sm">
            {content.explore.subtitle}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-[18px] max-[749px]:space-y-2.5">
          {/* Main Filters Row - Media Type + Sort Type.
              Mobile : les 2 groupes s'étirent sur 100% de la largeur pour que
              les 4 boutons tiennent sur une seule ligne sans rétrécir le texte. */}
          <div className="flex flex-wrap items-center gap-3 max-[749px]:gap-2">
            {/* Media Type Filter - Single select switch */}
            <div className="bg-muted/50 rounded-md max-[749px]:flex-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMediaType('movie')}
                  className={cn(
                    'cursor-pointer rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors max-[749px]:flex-1 max-[749px]:px-2 max-[749px]:py-1.5',
                    mediaType === 'movie'
                      ? 'bg-white text-black'
                      : 'text-muted-foreground hover:text-foreground bg-transparent',
                  )}
                >
                  {content.explore.filters.movies}
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('tv')}
                  className={cn(
                    'cursor-pointer rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors max-[749px]:flex-1 max-[749px]:px-2 max-[749px]:py-1.5',
                    mediaType === 'tv'
                      ? 'bg-white text-black'
                      : 'text-muted-foreground hover:text-foreground bg-transparent',
                  )}
                >
                  {content.explore.filters.series}
                </button>
              </div>
            </div>

            {/* Sort Filter - Single select in dark container */}
            <div className="bg-muted/50 rounded-md max-[749px]:flex-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updateFilterType('popular')}
                  className={cn(
                    'cursor-pointer rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors max-[749px]:flex-1 max-[749px]:px-2 max-[749px]:py-1.5',
                    filterType === 'popular'
                      ? 'bg-white text-black'
                      : 'text-muted-foreground hover:text-foreground bg-transparent',
                  )}
                >
                  {content.explore.filters.popular}
                </button>
                <button
                  type="button"
                  onClick={() => updateFilterType('top_rated')}
                  className={cn(
                    'cursor-pointer rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors max-[749px]:flex-1 max-[749px]:px-2 max-[749px]:py-1.5',
                    filterType === 'top_rated'
                      ? 'bg-white text-black'
                      : 'text-muted-foreground hover:text-foreground bg-transparent',
                  )}
                >
                  {content.explore.filters.bestRated}
                </button>
              </div>
            </div>

            {/* Filtres année (desktop) — sur mobile : drawer via le bouton "Année" */}
            <div className="flex flex-wrap items-center gap-3 max-[749px]:hidden">
              {/* Year From Picker - Combobox */}
              <Popover open={openYearFrom} onOpenChange={setOpenYearFrom}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openYearFrom}
                    aria-label={content.explore.filters.yearMin}
                    className="w-[200px] cursor-pointer justify-between max-[749px]:w-[calc(50%-6px)]"
                  >
                    {yearFromParam || content.explore.filters.yearMin}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder={content.explore.filters.search} />
                    <CommandList>
                      <CommandEmpty>{content.explore.filters.noYearFound}</CommandEmpty>
                      <CommandGroup>
                        {availableYearsFrom.map((year) => (
                          <CommandItem
                            key={year}
                            value={year.toString()}
                            onSelect={(currentValue) => {
                              const nextYear = currentValue === yearFromParam ? '' : currentValue;
                              setYearFromParam(nextYear);
                              setPage(1);
                              setOpenYearFrom(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                yearFromParam === year.toString() ? 'opacity-100' : 'opacity-0',
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
                    aria-label={content.explore.filters.yearMax}
                    className="w-[200px] cursor-pointer justify-between max-[749px]:w-[calc(50%-6px)]"
                  >
                    {yearToParam || content.explore.filters.yearMax}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder={content.explore.filters.search} />
                    <CommandList>
                      <CommandEmpty>{content.explore.filters.noYearFound}</CommandEmpty>
                      <CommandGroup>
                        {availableYearsTo.map((year) => (
                          <CommandItem
                            key={year}
                            value={year.toString()}
                            onSelect={(currentValue) => {
                              const nextYear = currentValue === yearToParam ? '' : currentValue;
                              setYearToParam(nextYear);
                              setPage(1);
                              setOpenYearTo(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                yearToParam === year.toString() ? 'opacity-100' : 'opacity-0',
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
              {(yearFromParam || yearToParam) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => {
                    setYearFromParam('');
                    setYearToParam('');
                    setPage(1);
                  }}
                >
                  {content.explore.filters.clearYears}
                </Button>
              )}

              {/* Genre Filter - Dropdown multi-select (desktop) */}
              <Popover open={openGenres} onOpenChange={setOpenGenres}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openGenres}
                    aria-label={content.explore.filters.genres}
                    className="w-[200px] cursor-pointer justify-between"
                  >
                    <span className="truncate">
                      {content.explore.filters.genres}
                      {selectedGenres.length > 0 ? ` (${selectedGenres.length})` : ''}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        <CommandItem
                          value={content.explore.filters.all}
                          onSelect={() => clearGenres()}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedGenres.length === 0 ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          {content.explore.filters.all}
                        </CommandItem>
                        {availableGenres.map((genre) => (
                          <CommandItem
                            key={genre.id}
                            value={genre.name}
                            onSelect={() => toggleGenre(genre.id)}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedGenres.includes(genre.id) ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            {genre.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Boutons filtres mobile (Genres / Année) → drawers */}
          <div className="flex gap-2 min-[750px]:hidden">
            <button
              type="button"
              onClick={openGenresDrawer}
              className={cn(
                'flex flex-1 items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors',
                selectedGenres.length > 0
                  ? 'border-white/40 text-foreground'
                  : 'border-border text-muted-foreground',
              )}
            >
              <span className="truncate">
                {content.explore.filters.genres}
                {selectedGenres.length > 0 ? ` (${selectedGenres.length})` : ''}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
            </button>
            <button
              type="button"
              onClick={openYearDrawer}
              className={cn(
                'flex flex-1 items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors',
                yearFromParam || yearToParam
                  ? 'border-white/40 text-foreground'
                  : 'border-border text-muted-foreground',
              )}
            >
              <span className="truncate">
                {yearFromParam || yearToParam
                  ? `${yearFromParam || '…'} – ${yearToParam || '…'}`
                  : content.explore.filters.year}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
            </button>
          </div>

          {/* Drawer Genres (mobile) */}
          <Drawer open={genresDrawerOpen} onOpenChange={setGenresDrawerOpen}>
            <DrawerContent className="max-h-[60vh]">
              <DrawerHeader className="text-left">
                <DrawerTitle>{content.explore.filters.genres}</DrawerTitle>
                <DrawerDescription className="sr-only">
                  {content.explore.filters.genres}
                </DrawerDescription>
              </DrawerHeader>
              <div className="overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => clearGenres()}
                  className="border-border/60 flex w-full items-center justify-between border-b py-3.5 text-left text-[15px]"
                >
                  <span
                    className={
                      selectedGenres.length === 0 ? 'text-foreground' : 'text-muted-foreground'
                    }
                  >
                    {content.explore.filters.all}
                  </span>
                  {selectedGenres.length === 0 && <Check className="h-5 w-5 text-white" />}
                </button>
                {availableGenres.map((genre) => {
                  const active = selectedGenres.includes(genre.id);
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => toggleGenre(genre.id)}
                      className="border-border/60 flex w-full items-center justify-between border-b py-3.5 text-left text-[15px] last:border-b-0"
                    >
                      <span className={active ? 'text-foreground' : 'text-muted-foreground'}>
                        {genre.name}
                      </span>
                      {active && <Check className="h-5 w-5 text-white" />}
                    </button>
                  );
                })}
              </div>
            </DrawerContent>
          </Drawer>

          {/* Drawer Année (mobile) — 2 roues + Appliquer */}
          <Drawer open={yearDrawerOpen} onOpenChange={setYearDrawerOpen}>
            <DrawerContent>
              <div className="px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2">
                <DrawerTitle className="sr-only">{content.explore.filters.year}</DrawerTitle>
                <DrawerDescription className="sr-only">
                  {content.explore.filters.year}
                </DrawerDescription>
                <div className="grid grid-cols-2">
                  <div className="text-center text-sm font-semibold">
                    {content.explore.filters.yearMin}
                  </div>
                  <div className="text-center text-sm font-semibold">
                    {content.explore.filters.yearMax}
                  </div>
                </div>
                <div className="relative mt-2 grid grid-cols-2">
                  <span className="bg-border pointer-events-none absolute inset-y-4 left-1/2 w-px" />
                  <WheelPicker
                    items={YEARS}
                    value={settledFrom}
                    onSettle={handleFromSettled}
                    isDisabled={(y) => y > settledTo}
                    ariaLabel={content.explore.filters.yearMin}
                  />
                  <WheelPicker
                    items={YEARS}
                    value={settledTo}
                    onSettle={handleToSettled}
                    isDisabled={(y) => y < settledFrom}
                    ariaLabel={content.explore.filters.yearMax}
                  />
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={applyYear}
                    className="h-11 w-full rounded-xl bg-white text-sm font-semibold text-black transition-colors hover:bg-white/90"
                  >
                    {content.explore.filters.apply}
                  </button>
                  {(yearFromParam || yearToParam) && (
                    <button
                      type="button"
                      onClick={resetYear}
                      className="text-muted-foreground hover:text-foreground h-9 w-full text-sm"
                    >
                      {content.explore.filters.clearYears}
                    </button>
                  )}
                </div>
              </div>
            </DrawerContent>
          </Drawer>

          {/* Search Bar — bascule sur l'endpoint /tmdb/search/:type quand
              la longueur de la recherche dépasse 3 caractères. Les filtres
              actuels (genre, year, sort, type) restent appliqués via le
              backend qui filtre les résultats TMDB après réception. */}
          <div className="relative w-full max-w-[410px]">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder={content.explore.searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={cn('pl-10', searchInput ? 'pr-10' : '')}
            />
            {searchInput && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchInput('')}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
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
                className="mt-12 min-h-[600px] max-[749px]:mt-11"
              />
            ) : (
              <m.div
                key={`grid-${page}-${mediaType}-${filterType}-${selectedGenres.join('-')}-${yearFromParam}-${yearToParam}`}
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
                <div className="mt-12 grid grid-cols-3 gap-1.75 max-[749px]:mt-11 sm:grid-cols-3 md:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {media.map((item, index) => (
                    <m.div
                      role="button"
                      tabIndex={0}
                      key={`${item.id}-${index}-${page}`}
                      variants={{
                        hidden: { opacity: 0, y: 8, scale: 0.95 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          transition: {
                            duration: 0.6,
                            ease: 'easeOut',
                          },
                        },
                      }}
                      className="group relative cursor-pointer overflow-hidden rounded-lg text-left max-[749px]:rounded-md"
                      onClick={() => handleItemClick(item, index)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleItemClick(item, index);
                        }
                      }}
                    >
                      {/* Poster with zoom */}
                      <div className="bg-muted relative aspect-2/3 overflow-hidden rounded-lg max-[749px]:rounded-md">
                        {item.poster_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                            srcSet={tmdbPosterSrcSet(item.poster_path)}
                            alt={item.title || item.name || ''}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            unoptimized
                            {...(index < 6 ? { priority: true } : {})}
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
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-b-lg bg-linear-to-t from-black/80 via-black/30 to-transparent max-[749px]:rounded-b-md" />

                      {/* Rating badge — masqué sur mobile (poster nu) */}
                      {item.vote_average > 0 && (
                        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 backdrop-blur-sm max-[749px]:hidden">
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
                      {isAuthenticated && (
                        <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-[749px]:hidden">
                          <WatchlistPickerMenu
                            watchlists={watchlists.filter((w) => w.isOwner || w.isCollaborator)}
                            tmdbId={item.id}
                            onAdd={(watchlistId) =>
                              handleAddFromDetails(
                                watchlistId,
                                item.id.toString(),
                                item.title ? 'movie' : 'tv',
                              )
                            }
                            onRemove={(watchlistId) =>
                              handleRemoveFromDetails(watchlistId, item.id.toString())
                            }
                            addToLabel={content.watchlists.addToWatchlist}
                            noWatchlistLabel={content.watchlists.noWatchlist}
                            side={index % gridCols === gridCols - 1 ? 'left' : 'right'}
                            align="start"
                          >
                            <DropdownMenu.Trigger asChild>
                              <button
                                type="button"
                                className="cursor-pointer rounded-full bg-black/70 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black"
                                disabled={addingTo === item.id}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </DropdownMenu.Trigger>
                          </WatchlistPickerMenu>
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
                      aria-label="Page précédente"
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
                      aria-label="Page suivante"
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
        {/* </div> */}
      </Section>

      {/* Item Details Modal */}
      {selectedItem && (
        <ItemDetailsModal
          open={detailsModalOpen}
          onOpenChange={(open) => {
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
          watchlists={watchlists.filter((w) => w.isOwner || w.isCollaborator)}
          isAuthenticated={isAuthenticated}
          onAddToWatchlist={(watchlistId) =>
            handleAddFromDetails(watchlistId, selectedItem.tmdbId, selectedItem.type)
          }
          onRemoveFromWatchlist={(watchlistId) =>
            handleRemoveFromDetails(watchlistId, selectedItem.tmdbId)
          }
        />
      )}
    </div>
  );
}
