"use client";

import { Film } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ListCard } from "@/components/List/ListCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/auth-context";
import { type Watchlist, watchlistAPI } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";

const SKELETONS = Array.from({ length: 10 }, (_, i) => i);

export default function CommunityListsPage() {
	const { content } = useLanguageStore();
	const { user } = useAuth();
	const router = useRouter();
	const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
	const [userWatchlists, setUserWatchlists] = useState<Watchlist[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		window.scrollTo(0, 0);
	}, []);

	const handleBackClick = () => {
		router.push("/home");
		window.scrollTo(0, 0);
	};

	const fetchWatchlists = useCallback(async () => {
		try {
			// Fetch all public watchlists with higher limit for community page
			const data = await watchlistAPI.getPublicWatchlists(1000);
			setWatchlists(data.watchlists || []);
		} catch (error) {
			console.error("Failed to fetch community watchlists:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			// Fetch public watchlists
			await fetchWatchlists();

			// Fetch user's watchlists if authenticated
			if (user) {
				try {
					const userData = await watchlistAPI.getMine();
					setUserWatchlists(userData.watchlists || []);
				} catch (error) {
					console.error("Failed to fetch user watchlists:", error);
				}
			}
		};

		fetchData();
	}, [user, fetchWatchlists]);

	return (
		<div className="bg-background min-h-screen pb-20">
			<div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 pt-6.5 pb-20">
				<PageHeader
					title={content.home.communityWatchlists.title}
					subtitle={content.home.communityWatchlists.subtitle}
					backLabel={content.watchlists.back}
					onBack={handleBackClick}
				/>

				{/* Watchlists Grid */}
				{loading ? (
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
						{SKELETONS.map((id) => (
							<div
								key={`skeleton-${id}`}
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

							// Find this watchlist in user's watchlists to check status
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
							Aucune watchlist publique pour le moment
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
