import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListCardImg } from "@/components/List/ListCardImg";
import {
	getWatchProviderLogo,
	watchlistAPI,
	type Watchlist,
	type WatchlistItem,
} from "@/lib/api-client";
import { scrollToTop } from "@/lib/utils";
import { useLanguageStore } from "@/store/language";
import {
	getCategoryInfo,
	PLATFORM_CATEGORIES_WITH_LOGOS,
	type PlatformCategory,
} from "@/types/categories";

export function Platforms() {
	const { content } = useLanguageStore();
	const navigate = useNavigate();
	const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
		{}
	);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		scrollToTop();
	}, []);

	useEffect(() => {
		const fetchPlatformCounts = async () => {
			try {
				const counts: Record<string, number> = {};
				await Promise.all(
					PLATFORM_CATEGORIES_WITH_LOGOS.map(async (platformId) => {
						try {
							const data =
								await watchlistAPI.getWatchlistsByCategory(platformId);
							counts[platformId] = data.watchlists?.length || 0;
						} catch (error) {
							console.error(`Failed to fetch count for ${platformId}:`, error);
							counts[platformId] = 0;
						}
					})
				);
				setCategoryCounts(counts);
			} catch (error) {
				console.error("Failed to fetch platform counts:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchPlatformCounts();
	}, []);

	const handleBackClick = () => {
		navigate("/home");
		scrollToTop();
	};

	return (
		<div className="bg-background min-h-screen pb-20">
			<div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 py-12">
				{/* Back Button */}
				<div className="mb-8">
					<button
						type="button"
						onClick={handleBackClick}
						className="text-muted-foreground flex cursor-pointer items-center gap-2 text-sm transition-colors hover:text-white"
					>
						<ArrowLeft className="h-4 w-4" />
						<span>{content.watchlists.back}</span>
					</button>
				</div>

				{/* Header */}
				<div className="mb-12">
					<h1 className="mb-4 text-4xl font-bold text-white">
						{content.home.platformsSection.title}
					</h1>
					<p className="text-muted-foreground text-lg">
						{content.home.platformsSection.subtitle}
					</p>
				</div>

				{/* Platforms Grid */}
				{loading ? (
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
						{[...Array(7)].map((_, i) => (
							<div
								key={i}
								className="bg-muted aspect-square animate-pulse rounded-lg"
							/>
						))}
					</div>
				) : (
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
						{PLATFORM_CATEGORIES_WITH_LOGOS.map(
							(platformId: PlatformCategory) => {
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
										email: "featured@poplist.app",
										username: "Poplist",
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
									<ListCardImg
										key={platformId}
										watchlist={mockWatchlist}
										content={content}
										href={`/platform/${platformId}`}
										logoUrl={logo || ""}
									/>
								);
							}
						)}
					</div>
				)}
			</div>
		</div>
	);
}
