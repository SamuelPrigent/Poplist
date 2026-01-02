import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListCardGenre } from "@/components/List/ListCardGenre";
import { PageHeader } from "@/components/layout/PageHeader";
import {
	type Watchlist,
	type WatchlistItem,
	watchlistAPI,
} from "@/lib/api-client";
import { scrollToTop } from "@/lib/utils";
import { useLanguageStore } from "@/store/language";
import { GENRE_CATEGORIES, getCategoryInfo } from "@/types/categories";

export function Categories() {
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
		const fetchCategoryCounts = async () => {
			try {
				const genreIds = [...GENRE_CATEGORIES];

				const counts: Record<string, number> = {};
				await Promise.all(
					genreIds.map(async (genreId) => {
						try {
							const data = await watchlistAPI.getWatchlistsByGenre(genreId);
							counts[genreId] = data.watchlists?.length || 0;
						} catch (error) {
							console.error(`Failed to fetch count for ${genreId}:`, error);
							counts[genreId] = 0;
						}
					})
				);
				setCategoryCounts(counts);
			} catch (error) {
				console.error("Failed to fetch category counts:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchCategoryCounts();
	}, []);

	const handleBackClick = () => {
		navigate("/home");
		scrollToTop();
	};

	return (
		<div className="bg-background min-h-screen pb-20">
			<div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 pt-6.5 pb-20">
				<PageHeader
					title={content.categories.title}
					subtitle={content.categories.subtitle}
					backLabel={content.watchlists.back}
					onBack={handleBackClick}
				/>

				{/* Categories Grid */}
				{loading ? (
					<div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
						{[...Array(10)].map((_, i) => (
							<div
								key={i}
								className="aspect-square] bg-muted animate-pulse rounded-lg"
							/>
						))}
					</div>
				) : (
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
						{GENRE_CATEGORIES.map((categoryId, index) => {
							const category = getCategoryInfo(categoryId, content);
							const itemCount = categoryCounts[categoryId] || 0;
							const placeholderTimestamp = "1970-01-01T00:00:00.000Z";
							const placeholderItems: WatchlistItem[] = Array.from(
								{ length: itemCount },
								(_, index) => ({
									tmdbId: `${categoryId}-item-${index}`,
									title: category.name,
									posterUrl: "",
									type: "movie",
									platformList: [],
									addedAt: placeholderTimestamp,
								})
							);

							const mockWatchlist: Watchlist = {
								_id: categoryId,
								ownerId: {
									email: "featured@poplist.app",
									username: "Poplist",
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
								<ListCardGenre
									key={categoryId}
									watchlist={mockWatchlist}
									content={content}
									href={`/category/${categoryId}`}
									genreId={categoryId}
									showOwner={false}
									index={index}
								/>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
