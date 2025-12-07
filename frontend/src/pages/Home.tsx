import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Eye, Film, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MoviePoster } from "@/components/Home/MoviePoster";
import { ItemDetailsModal } from "@/components/Watchlist/modal/ItemDetailsModal";
import { WatchlistCard } from "@/components/Watchlist/WatchlistCard";
import { WatchlistCardImg } from "@/components/Watchlist/WatchlistCardImg";
import { WatchlistCardGenre } from "@/components/Watchlist/WatchlistCardGenre";
// import { WatchlistCardGenre2 } from "@/components/Watchlist/WatchlistCardGenre2";
import { WatchlistCardSmall } from "@/components/Watchlist/WatchlistCardSmall";
import { useAuth } from "@/context/auth-context";
import {
	tmdbAPI,
	type Watchlist,
	type WatchlistItem,
	watchlistAPI,
} from "@/lib/api-client";
import { getLocalWatchlistsWithOwnership } from "@/lib/localStorageHelpers";
import { useLanguageStore } from "@/store/language";
import {
	GENRE_CATEGORIES,
	getCategoryInfo,
	// PLATFORM_CATEGORIES,
	PLATFORM_CATEGORIES_WITH_LOGOS,
	// type PlatformCategory,
} from "@/types/categories";
import { getWatchProviderLogo } from "@/lib/api-client";
import { Section } from "@/components/layout/Section";

interface TrendingItem {
	id: number;
	title?: string;
	name?: string;
	poster_path?: string;
	backdrop_path?: string;
	media_type: "movie" | "tv";
	vote_average?: number;
	vote_count?: number;
	overview?: string;
	release_date?: string;
	first_air_date?: string;
}

const POPULAR_WATCHLIST_SKELETON_KEYS = [
	"popular-watchlist-skeleton-1",
	"popular-watchlist-skeleton-2",
	"popular-watchlist-skeleton-3",
	"popular-watchlist-skeleton-4",
	"popular-watchlist-skeleton-5",
];

interface FeaturedCategory {
	id: string;
	name: string;
	description: string;
	gradient?: string;
	itemCount: number;
	username: string;
}

export function Home() {
	const { content } = useLanguageStore();
	const { user } = useAuth();

	const [userWatchlists, setUserWatchlists] = useState<Watchlist[]>([]);
	const [publicWatchlists, setPublicWatchlists] = useState<Watchlist[]>([]);
	const [recommendations, setRecommendations] = useState<TrendingItem[]>([]);
	const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
		{}
	);
	const [loading, setLoading] = useState(true);
	const [addingTo, setAddingTo] = useState<number | null>(null);
	const [detailsModalOpen, setDetailsModalOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<{
		tmdbId: string;
		type: "movie" | "tv";
	} | null>(null);

	const fetchPublicWatchlists = useCallback(async () => {
		try {
			const publicData = await watchlistAPI.getPublicWatchlists(10);
			//   console.log(
			//     "📦 [HomeApp.tsx] Public watchlists received from backend:",
			//     publicData.watchlists?.map((w) => ({
			//       name: w.name,
			//       isOwner: w.isOwner,
			//       isCollaborator: w.isCollaborator,
			//       isSaved: w.isSaved,
			//     })),
			//   );
			setPublicWatchlists(publicData.watchlists || []);
		} catch (error) {
			console.error("Failed to fetch public watchlists:", error);
		}
	}, []); // No dependencies - uses only API and setState

	// Scroll to top on component mount and disable automatic scroll restoration
	useEffect(() => {
		// Disable browser's automatic scroll restoration
		if ("scrollRestoration" in window.history) {
			window.history.scrollRestoration = "manual";
		}

		// Force scroll to top immediately
		window.scrollTo(0, 0);

		// Cleanup: restore default behavior when component unmounts
		return () => {
			if ("scrollRestoration" in window.history) {
				window.history.scrollRestoration = "auto";
			}
		};
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Fetch public watchlists
				await fetchPublicWatchlists();

				// Fetch user's watchlists first to get their items
				let userWatchlistsData: Watchlist[] = [];
				if (user) {
					const userData = await watchlistAPI.getMine();
					userWatchlistsData = userData.watchlists || [];
					setUserWatchlists(userWatchlistsData);
				} else {
					// Offline mode: get watchlists with ownership flags
					userWatchlistsData = getLocalWatchlistsWithOwnership();
					setUserWatchlists(userWatchlistsData);
				}

				// Simplified recommendations: Fetch multiple pages for more variety
				// Randomly select 2 pages to fetch for diversity
				const randomPage1 = Math.floor(Math.random() * 5) + 1; // Random page 1-5
				const randomPage2 = Math.floor(Math.random() * 5) + 1; // Random page 1-5

				// console.log(
				//   `📺 [Recommendations] Fetching trending pages: ${randomPage1} and ${randomPage2}`,
				// );

				const [trendingData1, trendingData2] = await Promise.all([
					tmdbAPI.getTrending("day", randomPage1),
					tmdbAPI.getTrending("day", randomPage2),
				]);

				// Combine results from both pages
				const allTrending = [
					...(trendingData1.results || []),
					...(trendingData2.results || []),
				];

				// Remove duplicates by ID
				const uniqueTrending = Array.from(
					new Map(allTrending.map((item) => [item.id, item])).values()
				);

				// Filter trending items by quality criteria
				const trendingFiltered = uniqueTrending
					.filter((item: TrendingItem) => item.poster_path)
					.filter(
						(item: TrendingItem) => item.vote_average && item.vote_average >= 6
					)
					.filter(
						(item: TrendingItem) => item.vote_count && item.vote_count > 100
					)
					.filter((item: TrendingItem) => {
						const dateStr = item.release_date || item.first_air_date;
						if (!dateStr) return false;
						const year = parseInt(dateStr.split("-")[0], 10);
						return year > 2015;
					});

				// Generate random offset to vary results on each load
				// Ensure we have at least 5 items after the offset
				const maxOffset = Math.max(0, trendingFiltered.length - 5);
				const randomOffset = Math.floor(Math.random() * (maxOffset + 1));

				// console.log(
				//   `📺 [Recommendations] Filtered ${trendingFiltered.length} items, using offset ${randomOffset} (range: ${randomOffset}-${randomOffset + 4})`,
				// );

				// Take exactly 5 consecutive items starting from random offset
				const selectedRecommendations = trendingFiltered.slice(
					randomOffset,
					randomOffset + 5
				);
				setRecommendations(selectedRecommendations);

				// Fetch category counts for genres and platforms
				const categoryIds = [
					"movies",
					"series",
					"anime",
					"action",
					"documentaries",
					"netflix",
					"prime-video",
					"disney-plus",
					"apple-tv",
					"crunchyroll",
				];

				const counts: Record<string, number> = {};
				await Promise.all(
					categoryIds.map(async (categoryId) => {
						try {
							const data =
								await watchlistAPI.getWatchlistsByCategory(categoryId);
							counts[categoryId] = data.watchlists?.length || 0;
						} catch (error) {
							console.error(`Failed to fetch count for ${categoryId}:`, error);
							counts[categoryId] = 0;
						}
					})
				);
				setCategoryCounts(counts);
			} catch (error) {
				console.error("Failed to fetch data:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [user, fetchPublicWatchlists]);

	const handleAddToWatchlist = async (
		watchlistId: string,
		item: TrendingItem
	) => {
		try {
			setAddingTo(item.id);

			if (user) {
				// Online mode: add via API
				await watchlistAPI.addItem(watchlistId, {
					tmdbId: item.id.toString(),
					type: item.media_type || "movie",
					language: "fr-FR",
					region: "FR",
				});
			} else {
				// Offline mode: add to localStorage
				const localWatchlists = localStorage.getItem("watchlists");
				if (localWatchlists) {
					const watchlists: Watchlist[] = JSON.parse(localWatchlists);
					const watchlistIndex = watchlists.findIndex(
						(w) => w._id === watchlistId
					);

					if (watchlistIndex !== -1) {
						// Fetch item details from backend cached route
						const API_URL =
							import.meta.env.VITE_API_URL || "http://localhost:3000";
						const type = item.media_type || "movie";
						const response = await fetch(
							`${API_URL}/watchlists/items/${item.id}/${type}/details?language=fr-FR`
						);

						if (response.ok) {
							const data = await response.json();
							const details = data.details;
							const newItem = {
								tmdbId: item.id.toString(),
								title: details.title || details.name || "",
								posterUrl: details.poster_path
									? `https://image.tmdb.org/t/p/w500${details.poster_path}`
									: "",
								type: type as "movie" | "tv",
								platformList: [],
								addedAt: new Date().toISOString(),
							};

							// Check if item already exists
							const itemExists = watchlists[watchlistIndex].items.some(
								(existingItem) => existingItem.tmdbId === newItem.tmdbId
							);

							if (!itemExists) {
								watchlists[watchlistIndex].items.push(newItem);
								watchlists[watchlistIndex].updatedAt = new Date().toISOString();
								localStorage.setItem("watchlists", JSON.stringify(watchlists));

								// Reload with ownership flags to maintain correct state
								const updatedWatchlists = getLocalWatchlistsWithOwnership();
								setUserWatchlists(updatedWatchlists);
							}
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

	const handleOpenDetails = (item: TrendingItem) => {
		setSelectedItem({
			tmdbId: item.id.toString(),
			type: item.media_type || "movie",
		});
		setDetailsModalOpen(true);
	};

	// Featured categories - using getCategoryInfo for translations
	const categories: FeaturedCategory[] = GENRE_CATEGORIES.slice(0, 5).map(
		(categoryId) => {
			const categoryInfo = getCategoryInfo(categoryId, content);
			return {
				id: categoryId,
				name: categoryInfo.name,
				description: categoryInfo.description,
				gradient: categoryInfo.cardGradient,
				itemCount: categoryCounts[categoryId] || 0,
				username: "WatchlistHub",
			};
		}
	);

	// Security: Ensure recommendations never exceed 5 items
	const safeRecommendations = useMemo(
		() => recommendations.slice(0, 5),
		[recommendations]
	);

	return (
		<div className="bg-background min-h-screen pb-20">
			{/* My Watchlists - Library Section */}
			{userWatchlists.length > 0 && (
				<Section className="pb-7">
					<div className="mb-6 flex items-center justify-between">
						<div>
							<h2 className="text-2xl font-bold text-white">
								{content.home.library.title}
							</h2>
							<p className="text-muted-foreground mt-1 text-sm">
								{content.home.library.subtitle}
							</p>
						</div>
						<Link
							to={user ? "/account/watchlists" : "/local/watchlists"}
							className="bg-muted/50 hover:bg-muted rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
						>
							{content.home.library.seeAll}
						</Link>
					</div>

					<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
						{userWatchlists.slice(0, 4).map((watchlist) => (
							<WatchlistCardSmall
								key={watchlist._id}
								watchlist={watchlist}
								onClick={() => {
									window.location.href = user
										? `/account/watchlist/${watchlist._id}`
										: `/local/watchlist/${watchlist._id}`;
								}}
							/>
						))}
					</div>
				</Section>
			)}

			{/* Categories Section */}
			<Section>
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-bold text-white">
							{content.home.categories.title}
						</h2>
						<p className="text-muted-foreground mt-1 text-sm">
							{content.home.categories.subtitle}
						</p>
					</div>
					<Link
						to="/categories"
						className="bg-muted/50 hover:bg-muted rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
					>
						{content.home.categories.seeMore}
					</Link>
				</div>

				<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
					{categories.map((category, index) => {
						const placeholderTimestamp = "1970-01-01T00:00:00.000Z";
						const placeholderItems: WatchlistItem[] = Array.from(
							{ length: category.itemCount },
							(_, index) => ({
								tmdbId: `${category.id}-item-${index}`,
								title: category.name,
								posterUrl: "",
								type: "movie",
								platformList: [],
								addedAt: placeholderTimestamp,
							})
						);

						const mockWatchlist: Watchlist = {
							_id: category.id,
							ownerId: {
								email: "featured@watchlisthub.app",
								username: category.username,
							},
							name: category.name,
							description: category.description,
							imageUrl: "",
							isPublic: true,
							collaborators: [],
							items: placeholderItems,
							createdAt: placeholderTimestamp,
							updatedAt: placeholderTimestamp,
							likedBy: [],
						};

						return (
							<WatchlistCardGenre
								key={category.id}
								watchlist={mockWatchlist}
								content={content}
								href={`/category/${category.id}`}
								genreId={category.id}
								showOwner={false}
								index={index}
							/>
						);
					})}
				</div>
			</Section>
			{/* Platforms Section */}
			<Section>
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-bold text-white">
							{content.home.platformsSection.title}
						</h2>
						<p className="text-muted-foreground mt-1 text-sm">
							{content.home.platformsSection.subtitle}
						</p>
					</div>
					<Link
						to="/platforms"
						className="bg-muted/50 hover:bg-muted rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
					>
						{content.home.platformsSection.seeAll}
					</Link>
				</div>

				<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
					{PLATFORM_CATEGORIES_WITH_LOGOS.slice(0, 5).map((platformId) => {
						const categoryInfo = getCategoryInfo(platformId, content);
						const itemCount = categoryCounts[platformId] || 0;
						const logo = getWatchProviderLogo(platformId);
						const placeholderTimestamp = "1970-01-01T00:00:00.000Z";
						const placeholderItems: WatchlistItem[] = Array.from(
							{ length: itemCount },
							(_, index) => ({
								tmdbId: `${platformId}-item-${index}`,
								title: categoryInfo.name,
								posterUrl: "",
								type: "movie",
								platformList: [],
								addedAt: placeholderTimestamp,
							})
						);

						const mockWatchlist: Watchlist = {
							_id: platformId,
							ownerId: {
								email: "featured@watchlisthub.app",
								username: "WatchlistHub",
							},
							name: categoryInfo.name,
							description: categoryInfo.description,
							imageUrl: "",
							isPublic: true,
							collaborators: [],
							items: placeholderItems,
							createdAt: placeholderTimestamp,
							updatedAt: placeholderTimestamp,
							likedBy: [],
						};

						return (
							<WatchlistCardImg
								key={platformId}
								watchlist={mockWatchlist}
								content={content}
								href={`/platform/${platformId}`}
								logoUrl={logo || ""}
							/>
						);
					})}
				</div>
			</Section>

			{/* Popular Watchlists Section */}
			<Section>
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-bold text-white">
							{content.home.popularWatchlists.title}
						</h2>
						<p className="text-muted-foreground mt-1 text-sm">
							{content.home.popularWatchlists.subtitle}
						</p>
					</div>
					<Link
						to="/community-watchlists"
						className="bg-muted/50 hover:bg-muted rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
					>
						{content.home.popularWatchlists.seeMore}
					</Link>
				</div>

				{loading ? (
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
						{POPULAR_WATCHLIST_SKELETON_KEYS.map((skeletonKey) => (
							<div
								key={skeletonKey}
								className="bg-muted aspect-square animate-pulse rounded-lg"
							/>
						))}
					</div>
				) : publicWatchlists.length > 0 ? (
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
						{publicWatchlists.slice(0, 10).map((watchlist) => {
							// Use same approach as CommunityWatchlists: cross-reference with user's watchlists
							const userWatchlist = userWatchlists.find(
								(uw) => uw._id === watchlist._id
							);
							const isOwner = userWatchlist?.isOwner ?? false;
							const isCollaborator = userWatchlist?.isCollaborator ?? false;
							const isSaved =
								userWatchlist && !userWatchlist.isOwner && !isCollaborator;

							// Show saved badge: not owner, not collaborator, but saved/followed
							const showSavedBadge = !isOwner && !isCollaborator && isSaved;
							// Show collaborative badge: user is a collaborator
							const showCollaborativeBadge = isCollaborator;

							return (
								<WatchlistCard
									key={watchlist._id}
									watchlist={watchlist}
									content={content}
									href={`/account/watchlist/${watchlist._id}`}
									showMenu={false}
									showOwner={true}
									showSavedBadge={showSavedBadge}
									showCollaborativeBadge={showCollaborativeBadge}
								/>
							);
						})}
					</div>
				) : (
					<div className="border-border bg-card rounded-lg border p-12 text-center">
						<Film className="text-muted-foreground mx-auto h-16 w-16" />
						<p className="text-muted-foreground mt-4">
							{content.home.popularWatchlists.noWatchlists}
						</p>
					</div>
				)}
			</Section>

			{/* Recommandations Section */}
			<Section>
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-bold text-white">
							{content.home.recommendations.title}
						</h2>
						<p className="text-muted-foreground mt-1 text-sm">
							{content.home.recommendations.subtitle}
						</p>
					</div>
					<Link
						to="/explore"
						className="bg-muted/50 hover:bg-muted rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
					>
						{content.home.recommendations.seeMore}
					</Link>
				</div>

				<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
					{safeRecommendations.map((item) => (
						<div key={item.id} className="group relative">
							<MoviePoster
								id={item.id}
								title={item.title}
								name={item.name}
								posterPath={item.poster_path}
								voteAverage={item.vote_average}
								overview={item.overview}
							/>

							{/* Action buttons */}
							<div className="absolute top-2 right-2 flex gap-2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
								{/* Preview button */}
								<button
									type="button"
									className="cursor-pointer rounded-full bg-black/80 p-2 text-white backdrop-blur-sm hover:bg-black"
									onClick={(e) => {
										e.stopPropagation();
										handleOpenDetails(item);
									}}
								>
									<Eye className="h-4 w-4" />
								</button>

								{/* Add button with dropdown - always visible */}
								<DropdownMenu.Root
									onOpenChange={(open) => {
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
											className="cursor-pointer rounded-full bg-black/80 p-2 text-white backdrop-blur-sm hover:bg-black"
											disabled={addingTo === item.id}
											onClick={(e) => e.stopPropagation()}
										>
											<Plus className="h-4 w-4" />
										</button>
									</DropdownMenu.Trigger>

									<DropdownMenu.Portal>
										<DropdownMenu.Content
											className="border-border bg-popover z-50 min-w-[200px] overflow-hidden rounded-xl border p-1 shadow-md"
											sideOffset={5}
											onClick={(e) => e.stopPropagation()}
										>
											<DropdownMenu.Label className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
												{content.watchlists.addToWatchlist}
											</DropdownMenu.Label>
											{userWatchlists.filter(
												(w) => w.isOwner || w.isCollaborator
											).length > 0 ? (
												userWatchlists
													.filter((w) => w.isOwner || w.isCollaborator)
													.map((watchlist) => (
														<DropdownMenu.Item
															key={watchlist._id}
															className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex cursor-pointer items-center rounded-lg px-2 py-1.5 text-sm transition-colors outline-none select-none"
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
						</div>
					))}
				</div>
			</Section>

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
