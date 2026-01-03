"use client";

import { ArrowLeft, Film } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ListCard } from "@/components/List/ListCard";
import { useAuth } from "@/context/auth-context";
import { type Watchlist, watchlistAPI } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";
import { type GenreCategory, getCategoryInfo } from "@/types/categories";

// Category header colors (Hex with 35% opacity - 59 in hex)
// Based on the color variation logic with 35° hue rotation per index
const CATEGORY_HEADER_COLORS: Record<string, string> = {
	movies: "#11314475", // Index 0: bleu
	series: "#20125094", // Index 1: +35° rotation -> Greenish
	anime: "#3611449b", // Index 2: +70° rotation -> Pinkish
	enfant: "#3c114483", // Index 3: +105° rotation -> Orange
	documentaries: "#45120b85", // Index 4: +140° rotation -> Purple
	jeunesse: "#41370d74", // Index 5: Similar to above
	action: "#273a0a67", // Index 6: +210° rotation -> Red
};

export default function CategoryDetailPage() {
	const params = useParams();
	const id = params.id as string;
	const { content } = useLanguageStore();
	const { user } = useAuth();
	const router = useRouter();
	const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
	const [userWatchlists, setUserWatchlists] = useState<Watchlist[]>([]);
	const [loading, setLoading] = useState(true);

	const categoryInfo = id
		? getCategoryInfo(id as GenreCategory, content)
		: null;

	useEffect(() => {
		window.scrollTo(0, 0);
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			if (!id) return;

			try {
				// Fetch genre watchlists
				const data = await watchlistAPI.getWatchlistsByGenre(id);
				setWatchlists(data.watchlists || []);

				// Fetch user's watchlists if authenticated
				if (user) {
					try {
						const userData = await watchlistAPI.getMine();
						setUserWatchlists(userData.watchlists || []);
					} catch (error) {
						console.error("Failed to fetch user watchlists:", error);
					}
				}
			} catch (error) {
				console.error("Failed to fetch category watchlists:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [id, user]);

	if (!categoryInfo) {
		return (
			<div className="bg-background min-h-screen pb-20">
				<div className="container mx-auto max-w-(--maxWidth) px-4 py-12">
					<div className="border-border bg-card rounded-lg border p-12 text-center">
						<p className="text-muted-foreground">Catégorie non trouvée</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-background min-h-screen pb-20">
			{/* Header with subtle gradient */}
			<div className="relative w-full">
				<div
					className="relative h-[165px] w-full overflow-hidden"
					style={{
						background: `linear-gradient(to bottom, ${CATEGORY_HEADER_COLORS[id || "movies"] || "#4A90E259"}, transparent 60%)`,
					}}
				>
					{/* Content */}
					<div className="relative container mx-auto flex h-full w-(--sectionWidth) max-w-(--maxWidth) flex-col justify-start px-10 pt-[1.7rem]">
						{/* Back Button */}
						<div className="mb-4">
							<button
								type="button"
								onClick={() => router.back()}
								className="flex cursor-pointer items-center gap-2 text-sm text-white/80 transition-colors hover:text-white"
							>
								<ArrowLeft className="h-4 w-4" />
								<span>{content.watchlists.back}</span>
							</button>
						</div>

						{/* Title and Description */}
						<div>
							<h1 className="mb-2 text-5xl font-bold text-white drop-shadow-lg">
								{categoryInfo.name}
							</h1>
							<p className="text-muted-foreground max-w-2xl text-base">
								{categoryInfo.description}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Watchlists section without gradient */}
			<div className="relative w-full">
				<div className="container mx-auto min-h-[75vh] w-(--sectionWidth) max-w-(--maxWidth) px-10 py-4">
					{/* Watchlists Grid */}
					{loading ? (
						<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
							{[...Array(10)].map((_, i) => (
								<div
									key={`skeleton-${i}`}
									className="bg-muted aspect-square animate-pulse rounded-lg"
								/>
							))}
						</div>
					) : watchlists.length > 0 ? (
						<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
							{watchlists.map((watchlist) => {
								// Calculate isOwner by comparing user email with watchlist owner email
								const ownerEmail =
									typeof watchlist.ownerId === "string"
										? null
										: watchlist.ownerId?.email;
								const isOwner = user?.email === ownerEmail;

								// Check if this watchlist is in user's watchlists
								const userWatchlist = userWatchlists.find(
									(uw) => uw._id === watchlist._id,
								);
								const isCollaborator = userWatchlist?.isCollaborator === true;
								const isSaved =
									userWatchlist && !userWatchlist.isOwner && !isCollaborator;
								const showSavedBadge = !isOwner && isSaved;
								const showCollaborativeBadge = isCollaborator;

								return (
									<ListCard
										key={watchlist._id}
										watchlist={watchlist}
										content={content}
										href={`/account/list/${watchlist._id}`}
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
								Aucune watchlist dans cette catégorie pour le moment
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
