import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListCardGenre } from "@/components/List/ListCardGenre";
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
				const categoryIds = [...GENRE_CATEGORIES];

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
						Toutes les catégories
					</h1>
					<p className="text-muted-foreground text-lg">
						Explorez nos collections thématiques
					</p>
				</div>

				{/* Categories Grid */}
				{loading ? (
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
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
