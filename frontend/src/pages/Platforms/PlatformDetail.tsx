import { ArrowLeft, Film } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ListCard } from "@/components/List/ListCard";
import { useAuth } from "@/context/auth-context";
import {
	getWatchProviderLogo,
	type Watchlist,
	watchlistAPI,
} from "@/lib/api-client";
import { scrollToTop } from "@/lib/utils";
import { useLanguageStore } from "@/store/language";
import {
	getCategoryInfo,
	PLATFORM_CATEGORIES,
	type PlatformCategory,
} from "@/types/categories";

export function PlatformDetail() {
	const { id } = useParams<{ id: string }>();
	const { content } = useLanguageStore();
	const { user } = useAuth();
	const navigate = useNavigate();
	const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
	const [userWatchlists, setUserWatchlists] = useState<Watchlist[]>([]);
	const [loading, setLoading] = useState(true);

	// Validate that the ID is a valid platform category
	const isPlatformCategory =
		id && PLATFORM_CATEGORIES.includes(id as PlatformCategory);
	const categoryInfo = isPlatformCategory
		? getCategoryInfo(id as PlatformCategory, content)
		: null;
	const logo = isPlatformCategory
		? getWatchProviderLogo(id as PlatformCategory)
		: null;

	useEffect(() => {
		scrollToTop();
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			if (!id || !isPlatformCategory) return;

			try {
				// Fetch platform watchlists
				const data = await watchlistAPI.getWatchlistsByCategory(id);
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
				console.error("Failed to fetch platform watchlists:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [id, isPlatformCategory, user]);

	if (!categoryInfo || !logo) {
		return (
			<div className="bg-background min-h-screen pb-20">
				<div className="container mx-auto max-w-(--maxWidth) px-4 py-12">
					<div className="border-border bg-card rounded-lg border p-12 text-center">
						<p className="text-muted-foreground">Plateforme non trouvée</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-background min-h-screen pb-20">
			{/* Header with platform logo */}
			<div className="relative w-full">
				<div
					className="relative h-[250px] w-full overflow-hidden"
					style={{
						background: `linear-gradient(to bottom, ${categoryInfo.headerGradient.match(/rgb\([^)]+\)/)?.[0]?.replace(")", " / 20%)") || "rgb(30, 30, 30 / 20%)"}, transparent 60%)`,
					}}
				>
					{/* Content */}
					<div className="relative container mx-auto flex h-full w-(--sectionWidth) max-w-(--maxWidth) flex-col justify-start px-4 pt-[1.7rem]">
						{/* Back Button */}
						<div className="mb-6">
							<button
								type="button"
								onClick={() => navigate(-1)}
								className="flex cursor-pointer items-center gap-2 text-sm text-white/80 transition-colors hover:text-white"
							>
								<ArrowLeft className="h-4 w-4" />
								<span>{content.watchlists.back}</span>
							</button>
						</div>

						{/* Platform Logo and Info */}
						<div className="flex items-center gap-6">
							{/* Logo */}
							<div className="bg-card border-border shrink-0 overflow-hidden rounded-2xl border p-4 shadow-lg">
								<img
									src={logo}
									alt={categoryInfo.name}
									className="h-24 w-24 object-contain"
								/>
							</div>

							{/* Title and Description */}
							<div>
								<h1 className="mb-3 text-5xl font-bold text-white drop-shadow-lg md:text-6xl">
									{categoryInfo.name}
								</h1>
								<p className="max-w-2xl text-base text-white/90 drop-shadow-md">
									{categoryInfo.description}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Watchlists section */}
			<div className="relative w-full">
				<div className="container mx-auto min-h-[75vh] w-(--sectionWidth) max-w-(--maxWidth) px-4 py-4">
					{/* Watchlists Grid */}
					{loading ? (
						<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
							{[...Array(10)].map((_, i) => (
								<div
									key={i}
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
									(uw) => uw._id === watchlist._id
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
								Aucune watchlist pour cette plateforme pour le moment
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
