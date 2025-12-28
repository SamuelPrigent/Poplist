import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UserProfileHeader } from "@/components/User/UserProfileHeader";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { ListCard } from "@/components/List/ListCard";
import type { Watchlist } from "@/lib/api-client";
import { userAPI } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";

export function UserProfile() {
	const { username } = useParams<{ username: string }>();
	const navigate = useNavigate();
	const { content } = useLanguageStore();

	const [user, setUser] = useState<{
		_id: string;
		username: string;
		avatarUrl?: string;
	} | null>(null);
	const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
	const [totalPublicWatchlists, setTotalPublicWatchlists] = useState(0);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);

	const fetchUserProfile = useCallback(async () => {
		if (!username) {
			navigate("/home", { replace: true });
			return;
		}

		try {
			setLoading(true);
			setNotFound(false);

			const data = await userAPI.getUserProfileByUsername(username);
			setUser(data.user);
			setWatchlists(data.watchlists);
			setTotalPublicWatchlists(data.totalPublicWatchlists);
		} catch (err) {
			console.error("Failed to fetch user profile:", err);
			setNotFound(true);
		} finally {
			setLoading(false);
		}
	}, [username, navigate]);

	useEffect(() => {
		fetchUserProfile();
	}, [fetchUserProfile]);

	if (loading) {
		return (
			<div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 py-8">
				<div className="flex items-center justify-center py-12">
					<div className="text-muted-foreground">
						{content.userProfile.loading}
					</div>
				</div>
			</div>
		);
	}

	if (notFound || !user) {
		return (
			<div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 py-8">
				<Empty>
					<EmptyHeader>
						<EmptyMedia />
						<EmptyTitle>{content.userProfile.notFound}</EmptyTitle>
						<EmptyDescription>
							{content.userProfile.notFoundDescription}
						</EmptyDescription>
					</EmptyHeader>
					<Button onClick={() => navigate("/home")}>
						{content.userProfile.backToHome}
					</Button>
				</Empty>
			</div>
		);
	}

	// User exists but has no public watchlists
	if (totalPublicWatchlists === 0) {
		return (
			<div className="bg-background min-h-screen pb-12">
				<UserProfileHeader
					user={user}
					totalPublicWatchlists={totalPublicWatchlists}
					hasWatchlists={false}
				/>

				<div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 py-12">
					<Empty>
						<EmptyHeader>
							<EmptyMedia />
							<EmptyTitle>{content.userProfile.noPublicWatchlists}</EmptyTitle>
							<EmptyDescription>
								{content.userProfile.noPublicWatchlistsDescription}
							</EmptyDescription>
						</EmptyHeader>
						<Button onClick={() => navigate("/home")}>
							{content.userProfile.backToHome}
						</Button>
					</Empty>
				</div>
			</div>
		);
	}

	// User has public watchlists
	return (
		<div className="bg-background min-h-screen pb-24">
			<UserProfileHeader
				user={user}
				totalPublicWatchlists={totalPublicWatchlists}
				hasWatchlists={true}
			/>

			<div className="container mx-auto min-h-[75vh] w-(--sectionWidth) max-w-(--maxWidth) px-4 py-8 pt-16">
				<h2 className="mb-7 text-2xl font-semibold text-white">
					{content.userProfile.publicWatchlists}
				</h2>

				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
					{watchlists.map((watchlist) => (
						<ListCard
							key={watchlist._id}
							watchlist={watchlist}
							content={content}
							href={`/account/list/${watchlist._id}`}
							showVisibility={false}
							showSavedBadge={false}
							showCollaborativeBadge={false}
							showMenu={false}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
