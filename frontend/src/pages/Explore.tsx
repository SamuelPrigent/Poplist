import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
	Check,
	ChevronsUpDown,
	ChevronLeft,
	ChevronRight,
	Plus,
	Star,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ItemDetailsModal } from "@/components/Watchlist/modal/ItemDetailsModal";
import { useAuth } from "@/context/auth-context";
import { type Watchlist, watchlistAPI } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { getLocalWatchlistsWithOwnership } from "@/lib/localStorageHelpers";
import { deleteCachedThumbnail } from "@/lib/thumbnailGenerator";
import { useLanguageStore } from "@/store/language";
import type { Content } from "@/types/content";

interface MediaItem {
	id: number;
	title?: string;
	name?: string;
	poster_path?: string;
	media_type?: string;
	vote_average: number;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Generate 36 stable skeleton keys (6 columns × 6 rows)
const SKELETON_KEYS = Array.from({ length: 36 }, (_, i) => `skeleton-${i + 1}`);

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
		{ id: 10759, name: content.explore.genres.actionAdventure },
		{ id: 16, name: content.explore.genres.animation },
		{ id: 35, name: content.explore.genres.comedy },
		{ id: 80, name: content.explore.genres.crime },
		{ id: 99, name: content.explore.genres.documentary },
		{ id: 18, name: content.explore.genres.drama },
		{ id: 10751, name: content.explore.genres.family },
		{ id: 10762, name: content.explore.genres.kids },
		{ id: 9648, name: content.explore.genres.mystery },
		{ id: 10765, name: content.explore.genres.sciFiFantasy },
		{ id: 10766, name: content.explore.genres.soap },
		{ id: 37, name: content.explore.genres.western },
	],
});

export function Explore() {
	const { content } = useLanguageStore();
	const { isAuthenticated } = useAuth();
	const [searchParams, setSearchParams] = useSearchParams();

	// Use useMemo to memoize derived values from searchParams
	const mediaTypes = useMemo(() => {
		const typesParam = searchParams.get("types") || "movie";
		return typesParam.split(",") as ("movie" | "tv")[];
	}, [searchParams]);

	const filterType = useMemo(
		() => (searchParams.get("filter") as "popular" | "top_rated") || "popular",
		[searchParams]
	);

	const selectedGenre = useMemo(() => {
		const genre = searchParams.get("genre");
		return genre ? Number(genre) : null;
	}, [searchParams]);

	// Extract year from date params (format: YYYY-MM-DD -> YYYY)
	const yearFromParam = useMemo(() => {
		const dateStr = searchParams.get("dateFrom") || "";
		return dateStr ? dateStr.split("-")[0] : "";
	}, [searchParams]);

	const yearToParam = useMemo(() => {
		const dateStr = searchParams.get("dateTo") || "";
		return dateStr ? dateStr.split("-")[0] : "";
	}, [searchParams]);

	const page = useMemo(
		() => Number(searchParams.get("page")) || 1,
		[searchParams]
	);

	const [media, setMedia] = useState<MediaItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
	const [addingTo, setAddingTo] = useState<number | null>(null);
	const [totalPages, setTotalPages] = useState(1);
	const [detailsModalOpen, setDetailsModalOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<{
		tmdbId: string;
		type: "movie" | "tv";
	} | null>(null);

	// Year picker state
	const [yearFrom, setYearFrom] = useState<string>(yearFromParam);
	const [yearTo, setYearTo] = useState<string>(yearToParam);
	const [openYearFrom, setOpenYearFrom] = useState(false);
	const [openYearTo, setOpenYearTo] = useState(false);

	// Filter yearTo list: can't be less than yearFrom
	const availableYearsTo = useMemo(() => {
		if (!yearFrom) return YEARS;
		const fromYear = Number.parseInt(yearFrom);
		return YEARS.filter((year) => year >= fromYear);
	}, [yearFrom]);

	// Filter yearFrom list: can't be greater than yearTo
	const availableYearsFrom = useMemo(() => {
		if (!yearTo) return YEARS;
		const toYear = Number.parseInt(yearTo);
		return YEARS.filter((year) => year <= toYear);
	}, [yearTo]);

	// Update URL when years change
	useEffect(() => {
		const newParams = new URLSearchParams(searchParams);

		// Transform year to YYYY-01-01 format for API
		if (yearFrom) {
			newParams.set("dateFrom", `${yearFrom}-01-01`);
		} else {
			newParams.delete("dateFrom");
		}
		if (yearTo) {
			newParams.set("dateTo", `${yearTo}-12-31`);
		} else {
			newParams.delete("dateTo");
		}

		// Only update if changed to avoid infinite loop
		const currentDateFrom = searchParams.get("dateFrom") || "";
		const currentDateTo = searchParams.get("dateTo") || "";
		const newDateFrom = yearFrom ? `${yearFrom}-01-01` : "";
		const newDateTo = yearTo ? `${yearTo}-12-31` : "";

		if (currentDateFrom !== newDateFrom || currentDateTo !== newDateTo) {
			newParams.set("page", "1");
			setSearchParams(newParams);
		}
	}, [yearFrom, yearTo, searchParams, setSearchParams]);

	// Helper functions to update URL params
	const toggleMediaType = (type: "movie" | "tv") => {
		const newParams = new URLSearchParams(searchParams);
		let newTypes = [...mediaTypes];

		if (newTypes.includes(type)) {
			newTypes = newTypes.filter((t) => t !== type);
			// Prevent empty selection
			if (newTypes.length === 0) return;
		} else {
			newTypes.push(type);
		}

		newParams.set("types", newTypes.join(","));
		newParams.set("page", "1");
		setSearchParams(newParams);
	};

	const updateFilterType = (filter: "popular" | "top_rated") => {
		const newParams = new URLSearchParams(searchParams);
		newParams.set("filter", filter);
		newParams.set("page", "1");
		setSearchParams(newParams);
	};

	const updateGenre = (genre: number | null) => {
		const newParams = new URLSearchParams(searchParams);
		if (genre === null) {
			newParams.delete("genre");
		} else {
			newParams.set("genre", genre.toString());
		}
		newParams.set("page", "1");
		setSearchParams(newParams);
	};

	const updatePage = (newPage: number) => {
		const newParams = new URLSearchParams(searchParams);
		newParams.set("page", newPage.toString());
		setSearchParams(newParams);
	};

	// Scroll to top on mount and whenever URL params change
	// biome-ignore lint/correctness/useExhaustiveDependencies: We want to scroll on any param change
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, [searchParams]);

	// Fetch user watchlists (authenticated or offline)
	useEffect(() => {
		if (isAuthenticated) {
			watchlistAPI
				.getMine()
				.then((data) => {
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
				const itemsPerDisplayPage = 36; // 6 columns × 6 rows
				const itemsPerTMDBPage = 20;
				const startTMDBPage =
					Math.floor(((page - 1) * itemsPerDisplayPage) / itemsPerTMDBPage) + 1;
				const pagesNeeded = Math.ceil(itemsPerDisplayPage / itemsPerTMDBPage);

				// Fetch for each selected media type
				const fetchPromises = mediaTypes.map(async (type) => {
					let allResults: MediaItem[] = [];
					let totalPages = 1;

					for (let i = 0; i < pagesNeeded; i++) {
						const currentTMDBPage = startTMDBPage + i;
						const params = new URLSearchParams({
							language: "fr-FR",
							page: currentTMDBPage.toString(),
						});

						// Always use discover endpoint
						let sortBy = "popularity.desc";

						if (filterType === "popular") {
							sortBy = "popularity.desc";
						} else if (filterType === "top_rated") {
							sortBy = "vote_average.desc";
						}

						params.append("sort_by", sortBy);

						// Always add minimum vote count to avoid absurd results
						params.append("vote_count.gte", "100");

						// Add genre filter
						if (selectedGenre) {
							params.append("with_genres", selectedGenre.toString());
						}

						// Add date filters (year transformed to YYYY-01-01 and YYYY-12-31)
						const dateFrom = yearFrom ? `${yearFrom}-01-01` : "";
						const dateTo = yearTo ? `${yearTo}-12-31` : "";

						// Use correct date field based on media type
						// Movies: primary_release_date | TV Shows: first_air_date
						const dateField =
							type === "movie" ? "primary_release_date" : "first_air_date";

						if (dateFrom) {
							params.append(`${dateField}.gte`, dateFrom);
						}
						if (dateTo) {
							params.append(`${dateField}.lte`, dateTo);
						}

						const url = `${API_URL}/tmdb/discover/${type}`;
						const fullUrl = `${url}?${params.toString()}`;

						const response = await fetch(fullUrl);
						const data = await response.json();

						allResults = [...allResults, ...(data.results || [])];
						totalPages = data.total_pages || 1;
					}

					return { type, results: allResults, totalPages };
				});

				const fetchedData = await Promise.all(fetchPromises);

				// If both movie and tv are selected, alternate results
				let combinedResults: MediaItem[] = [];
				if (mediaTypes.length === 2) {
					const movieResults =
						fetchedData.find((d) => d.type === "movie")?.results || [];
					const tvResults =
						fetchedData.find((d) => d.type === "tv")?.results || [];
					const maxLength = Math.max(movieResults.length, tvResults.length);

					for (let i = 0; i < maxLength; i++) {
						if (movieResults[i]) combinedResults.push(movieResults[i]);
						if (tvResults[i]) combinedResults.push(tvResults[i]);
					}
				} else {
					// Single type selected
					combinedResults = fetchedData[0]?.results || [];
				}

				// Calculate the starting index for this display page
				const startIndex =
					((page - 1) * itemsPerDisplayPage) % itemsPerTMDBPage;

				// Slice to get exactly 36 items for this page
				const displayResults = combinedResults.slice(
					startIndex,
					startIndex + itemsPerDisplayPage
				);

				setMedia(displayResults);

				// Use the highest total pages from all fetched types
				const maxTotalPages = Math.max(...fetchedData.map((d) => d.totalPages));
				const totalDisplayPages = Math.ceil(
					(maxTotalPages * itemsPerTMDBPage) / itemsPerDisplayPage
				);
				setTotalPages(Math.min(totalDisplayPages, 500));
			} catch (error) {
				console.error("Failed to fetch media:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchMedia();
	}, [mediaTypes, filterType, selectedGenre, page, yearFrom, yearTo]);

	const handleAddToWatchlist = async (
		watchlistId: string,
		mediaItem: MediaItem
	) => {
		try {
			setAddingTo(mediaItem.id);

			// Determine media type for this item
			const itemType: "movie" | "tv" = mediaItem.title ? "movie" : "tv";

			if (isAuthenticated) {
				await watchlistAPI.addItem(watchlistId, {
					tmdbId: mediaItem.id.toString(),
					type: itemType,
					language: "fr-FR",
					region: "FR",
				});
			} else {
				const localWatchlists = localStorage.getItem("watchlists");
				if (localWatchlists) {
					const watchlists: Watchlist[] = JSON.parse(localWatchlists);
					const watchlistIndex = watchlists.findIndex(
						(w) => w._id === watchlistId
					);

					if (watchlistIndex !== -1) {
						const itemExists = watchlists[watchlistIndex].items.some(
							(item) => item.tmdbId === mediaItem.id.toString()
						);

						if (!itemExists) {
							// Fetch providers and details from TMDB via backend
							console.log("[Explore] Fetching providers and details for:", mediaItem.id, itemType);

							const [platformList, mediaDetails] = await Promise.all([
								watchlistAPI.fetchTMDBProviders(
									mediaItem.id.toString(),
									itemType,
									"FR"
								),
								watchlistAPI.getItemDetails(
									mediaItem.id.toString(),
									itemType,
									"fr-FR"
								),
							]);

							console.log("[Explore] Received platformList:", platformList);
							console.log("[Explore] Received runtime:", mediaDetails.details.runtime);

							const newItem = {
								tmdbId: mediaItem.id.toString(),
								title: mediaItem.title || mediaItem.name || "",
								posterUrl: mediaItem.poster_path
									? `https://image.tmdb.org/t/p/w500${mediaItem.poster_path}`
									: "",
								type: itemType,
								platformList,
								runtime: mediaDetails.details.runtime,
								addedAt: new Date().toISOString(),
							};

							console.log("[Explore] Adding new item:", newItem);

							watchlists[watchlistIndex].items.push(newItem);
							watchlists[watchlistIndex].updatedAt = new Date().toISOString();
							localStorage.setItem("watchlists", JSON.stringify(watchlists));

							// Invalidate thumbnail cache so it regenerates with new item
							deleteCachedThumbnail(watchlistId);

							console.log("[Explore] Item added successfully!");

							const updatedWatchlists = getLocalWatchlistsWithOwnership();
							setWatchlists(updatedWatchlists);
						}
					}
				}
			}
		} catch (error) {
			console.error("Failed to add to watchlist:", error);
		} finally {
			setAddingTo(null);
		}
	};

	const handleItemClick = (item: MediaItem) => {
		const itemType = item.title ? "movie" : "tv";
		setSelectedItem({
			tmdbId: item.id.toString(),
			type: itemType,
		});
		setDetailsModalOpen(true);
	};

	// Get available genres based on selected media types
	const availableGenres = useMemo(() => {
		const genres = getGenres(content);
		if (mediaTypes.length === 2) {
			const combined = [...genres.movie, ...genres.tv];
			// Deduplicate by id
			const uniqueGenres = Array.from(
				new Map(combined.map((g) => [g.id, g])).values()
			);
			return uniqueGenres;
		}
		return mediaTypes[0] === "movie" ? genres.movie : genres.tv;
	}, [mediaTypes, content]);

	return (
		<div className="bg-background mb-24 min-h-screen py-12">
			<div className="container mx-auto px-4">
				{/* Header */}
				<div className="mb-12 text-left">
					<h1 className="mb-4 text-5xl font-bold text-white">
						{content.explore.title}
					</h1>
					<p className="text-muted-foreground text-lg">
						{content.explore.subtitle}
					</p>
				</div>

				{/* Filters */}
				<div className="mb-8 space-y-4">
					{/* Main Filters Row - Media Type + Sort Type */}
					<div className="flex flex-wrap items-center gap-3">
						{/* Media Type Filter - Multi-select in dark container */}
						<div className="bg-muted/50 rounded-md p-1">
							<div
								className={cn(
									"flex items-center rounded-md",
									mediaTypes.length === 2 && "bg-white"
								)}
							>
								<button
									type="button"
									onClick={() => toggleMediaType("movie")}
									className={cn(
										"cursor-pointer px-4 py-2 text-sm font-medium transition-colors",
										mediaTypes.includes("movie")
											? "bg-white text-black"
											: "text-muted-foreground hover:text-foreground bg-transparent",
										mediaTypes.length === 2
											? "rounded-l-md bg-transparent"
											: "rounded-md"
									)}
								>
									{content.explore.filters.movies}
								</button>
								<button
									type="button"
									onClick={() => toggleMediaType("tv")}
									className={cn(
										"cursor-pointer px-4 py-2 text-sm font-medium transition-colors",
										mediaTypes.includes("tv")
											? "bg-white text-black"
											: "text-muted-foreground hover:text-foreground bg-transparent",
										mediaTypes.length === 2
											? "rounded-r-md bg-transparent"
											: "rounded-md"
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
									onClick={() => updateFilterType("popular")}
									className={cn(
										"cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors",
										filterType === "popular"
											? "bg-white text-black"
											: "text-muted-foreground hover:text-foreground bg-transparent"
									)}
								>
									{content.explore.filters.popular}
								</button>
								<button
									type="button"
									onClick={() => updateFilterType("top_rated")}
									className={cn(
										"cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors",
										filterType === "top_rated"
											? "bg-white text-black"
											: "text-muted-foreground hover:text-foreground bg-transparent"
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
											{availableYearsFrom.map((year) => (
												<CommandItem
													key={year}
													value={year.toString()}
													onSelect={(currentValue) => {
														setYearFrom(
															currentValue === yearFrom ? "" : currentValue
														);
														setOpenYearFrom(false);
													}}
												>
													<Check
														className={cn(
															"mr-2 h-4 w-4",
															yearFrom === year.toString()
																? "opacity-100"
																: "opacity-0"
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
											{availableYearsTo.map((year) => (
												<CommandItem
													key={year}
													value={year.toString()}
													onSelect={(currentValue) => {
														setYearTo(
															currentValue === yearTo ? "" : currentValue
														);
														setOpenYearTo(false);
													}}
												>
													<Check
														className={cn(
															"mr-2 h-4 w-4",
															yearTo === year.toString()
																? "opacity-100"
																: "opacity-0"
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
									setYearFrom("");
									setYearTo("");
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
							onClick={() => updateGenre(null)}
							className={cn(
								"cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
								selectedGenre === null
									? "bg-white text-black"
									: "bg-muted text-muted-foreground hover:bg-muted/80"
							)}
						>
							{content.explore.filters.all}
						</button>
						{availableGenres.map((genre) => (
							<button
								type="button"
								key={genre.id}
								onClick={() => updateGenre(genre.id)}
								className={cn(
									"cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
									selectedGenre === genre.id
										? "bg-white text-black"
										: "bg-muted text-muted-foreground hover:bg-muted/80"
								)}
							>
								{genre.name}
							</button>
						))}
					</div>
				</div>

				{/* Media Grid */}
				{loading ? (
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
						{SKELETON_KEYS.map((skeletonKey) => (
							<div
								key={skeletonKey}
								className="bg-muted aspect-2/3 animate-pulse rounded-lg"
							/>
						))}
					</div>
				) : (
					<>
						<div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
							{media.map((item, index) => (
								<div
									key={`${item.id}-${index}-${page}`}
									className="group relative overflow-hidden rounded-lg text-left transition-opacity"
								>
									{/* Main Click Action */}
									<button
										type="button"
										className="absolute inset-0 z-0 h-full w-full cursor-pointer opacity-0"
										onClick={() => handleItemClick(item)}
										aria-label={`Voir les détails de ${item.title || item.name}`}
									/>

									{/* Poster */}
									<div className="bg-muted pointer-events-none aspect-2/3 overflow-hidden rounded-lg">
										{item.poster_path ? (
											<img
												src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
												alt={item.title || item.name}
												className="h-full w-full object-cover transition-transform group-hover:scale-105"
											/>
										) : (
											<div className="text-muted-foreground flex h-full items-center justify-center">
												?
											</div>
										)}
									</div>

									{/* Add button */}
									{(isAuthenticated || watchlists.length > 0) && (
										<div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
											<DropdownMenu.Root
												onOpenChange={(open) => {
													if (!open) {
														setTimeout(() => {
															if (
																document.activeElement instanceof HTMLElement
															) {
																document.activeElement.blur();
															}
														}, 0);
													}
												}}
											>
												<DropdownMenu.Trigger asChild>
													<button
														type="button"
														className="cursor-pointer rounded-full bg-black/80 p-2 text-white backdrop-blur-sm hover:bg-black"
														disabled={addingTo === item.id}
														onClick={(e) => e.stopPropagation()}
													>
														<Plus className="h-4 w-4" />
													</button>
												</DropdownMenu.Trigger>

												<DropdownMenu.Portal>
													<DropdownMenu.Content
														className="border-border bg-popover z-50 min-w-[200px] overflow-hidden rounded-md border p-1 shadow-md"
														sideOffset={5}
														onClick={(e) => e.stopPropagation()}
													>
														<DropdownMenu.Label className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
															{content.watchlists.addToWatchlist}
														</DropdownMenu.Label>
														{watchlists.filter(
															(w) => w.isOwner || w.isCollaborator
														).length > 0 ? (
															watchlists
																.filter((w) => w.isOwner || w.isCollaborator)
																.map((watchlist) => (
																	<DropdownMenu.Item
																		key={watchlist._id}
																		className="hover:bg-accent hover:text-accent-foreground relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none"
																		onSelect={() =>
																			handleAddToWatchlist(watchlist._id, item)
																		}
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

									{/* Info overlay */}
									<div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
										<h3 className="line-clamp-2 text-sm font-semibold text-white">
											{item.title || item.name}
										</h3>
										{item.vote_average > 0 && (
											<div className="mt-1 flex items-center gap-1 text-xs text-gray-300">
												<Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
												{item.vote_average.toFixed(1)}
											</div>
										)}
									</div>
								</div>
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
										.replace("{page}", String(page))
										.replace("{totalPages}", String(totalPages))}
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
					</>
				)}
			</div>

			{/* Item Details Modal */}
			{selectedItem && (
				<ItemDetailsModal
					open={detailsModalOpen}
					onOpenChange={(open) => {
						setDetailsModalOpen(open);
						if (!open) {
							setSelectedItem(null);
						}
					}}
					tmdbId={selectedItem.tmdbId}
					type={selectedItem.type}
				/>
			)}
		</div>
	);
}
