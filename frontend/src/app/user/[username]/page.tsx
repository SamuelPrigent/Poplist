"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ListCard } from "@/components/List/ListCard";
import { UserProfileHeader } from "@/components/User/UserProfileHeader";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { PageReveal } from "@/components/ui/PageReveal";
import { useRegisterSection } from "@/hooks/usePageReady";
import type { Watchlist } from "@/lib/api-client";
import { userAPI } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";

function UserProfilePageInner() {
	const params = useParams();
	const router = useRouter();
	const { content } = useLanguageStore();
	const { markReady } = useRegisterSection('user-profile');

	const username = params.username as string;

	const [user, setUser] = useState<{
		id: string;
		username: string;
		avatarUrl?: string;
	} | null>(null);
	const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
	const [totalPublicWatchlists, setTotalPublicWatchlists] = useState(0);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);

	const fetchUserProfile = useCallback(async () => {
		if (!username) {
			router.replace("/home");
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
			markReady();
		}
	}, [username, router, markReady]);

	useEffect(() => {
		fetchUserProfile();
	}, [fetchUserProfile]);

	if (loading) {
		return null;
	}

	if (notFound || !user) {
		return (
			<div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 py-8">
				<Empty>
					<EmptyHeader>
						<EmptyMedia />
						<EmptyTitle>
							{content.userProfile?.notFound || "Utilisateur introuvable"}
						</EmptyTitle>
						<EmptyDescription>
							{content.userProfile?.notFoundDescription ||
								"Cet utilisateur n'existe pas ou a été supprimé."}
						</EmptyDescription>
					</EmptyHeader>
					<Button onClick={() => router.push("/home")}>
						{content.userProfile?.backToHome || "Retour à l'accueil"}
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
							<EmptyTitle>
								{content.userProfile?.noPublicWatchlists ||
									"Aucune liste publique"}
							</EmptyTitle>
							<EmptyDescription>
								{content.userProfile?.noPublicWatchlistsDescription ||
									"Cet utilisateur n'a pas encore de liste publique."}
							</EmptyDescription>
						</EmptyHeader>
						<Button onClick={() => router.push("/home")}>
							{content.userProfile?.backToHome || "Retour à l'accueil"}
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

			<div className="container mx-auto min-h-[75vh] w-(--sectionWidth) max-w-(--maxWidth) px-4 py-8 pt-10 pb-16">
				<h2 className="mb-7 text-2xl font-semibold text-white">
					{content.userProfile?.publicWatchlists || "Listes publiques"}
				</h2>

				<div className="grid grid-cols-1 gap-6 sm:grid-cols-3 xl:grid-cols-5">
					{watchlists.map((watchlist) => (
						<ListCard
							key={watchlist.id}
							watchlist={watchlist}
							content={content}
							href={`/lists/${watchlist.id}`}
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

export default function UserProfilePage() {
	return (
		<PageReveal timeout={4000} minLoadingTime={200} revealDuration={0.5}>
			<UserProfilePageInner />
		</PageReveal>
	);
}
