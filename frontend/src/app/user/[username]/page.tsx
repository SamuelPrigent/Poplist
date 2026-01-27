"use client";

import { domAnimation, LazyMotion, m } from "motion/react";
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
import type { Watchlist } from "@/lib/api-client";
import { userAPI } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";

// Skeleton components
const ListCardSkeleton = () => (
	<div className="bg-muted/30 rounded-lg p-2">
		<div className="bg-muted/50 aspect-square w-full rounded-md" />
		<div className="mt-3 space-y-2">
			<div className="bg-muted/50 h-4 w-3/4 rounded" />
			<div className="bg-muted/50 h-3 w-1/2 rounded" />
		</div>
	</div>
);

const ProfileHeaderSkeleton = () => (
	<div className="relative h-[200px] w-full overflow-hidden bg-muted/20">
		<div className="container mx-auto flex h-full w-(--sectionWidth) max-w-(--maxWidth) items-end px-4 pb-6">
			<div className="flex items-center gap-4">
				<div className="bg-muted/50 h-20 w-20 rounded-full" />
				<div className="space-y-2">
					<div className="bg-muted/50 h-6 w-32 rounded" />
					<div className="bg-muted/50 h-4 w-24 rounded" />
				</div>
			</div>
		</div>
	</div>
);

function UserProfilePageInner() {
	const params = useParams();
	const router = useRouter();
	const { content } = useLanguageStore();

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
		}
	}, [username, router]);

	useEffect(() => {
		fetchUserProfile();
	}, [fetchUserProfile]);

	if (loading) {
		return (
			<div className="bg-background min-h-screen pb-24">
				<ProfileHeaderSkeleton />
				<div className="container mx-auto min-h-[75vh] w-(--sectionWidth) max-w-(--maxWidth) px-4 py-8 pt-10 pb-16">
					<div className="bg-muted/50 mb-7 h-7 w-40 rounded" />
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-3 xl:grid-cols-5">
						{Array.from({ length: 5 }).map((_, i) => (
							<ListCardSkeleton key={i} />
						))}
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
		<LazyMotion features={domAnimation}>
			<m.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.4, ease: "easeOut" }}
			>
				<UserProfilePageInner />
			</m.div>
		</LazyMotion>
	);
}
