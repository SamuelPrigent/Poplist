"use client";

import { ArrowLeft, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguageStore } from "@/store/language";

interface UserProfileHeaderProps {
	user: {
		id: string;
		username: string;
		avatarUrl?: string;
	};
	totalPublicWatchlists: number;
	hasWatchlists: boolean;
}

export function UserProfileHeader({
	user,
	totalPublicWatchlists,
	hasWatchlists,
}: UserProfileHeaderProps) {
	const router = useRouter();
	const { content } = useLanguageStore();

	const handleBack = () => {
		if (hasWatchlists) {
			router.back();
		} else {
			router.push("/home");
		}
	};

	return (
		<div className="relative w-full overflow-hidden">
			{/* Background Gradient */}
			<div className="via-background/60 to-background absolute inset-0 bg-linear-to-b from-purple-900/20" />

			<div className="relative container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 pt-6">
				{/* Back Button */}
				<div className="mb-3">
					<button
						type="button"
						onClick={handleBack}
						className="text-muted-foreground flex cursor-pointer items-center gap-2 rounded text-sm transition-colors hover:text-white"
					>
						<ArrowLeft className="h-4 w-4" />
						<span>{content.watchlists.back}</span>
					</button>
				</div>

				<div className="flex items-center gap-5 pt-3.5 pb-2">
					{/* Avatar - Round */}
					<div className="shrink-0">
						<div className="relative h-28 w-28 overflow-hidden rounded-full shadow-xl">
							{user.avatarUrl ? (
								<Image
									src={user.avatarUrl}
									alt={user.username}
									fill
									sizes="112px"
									className="object-cover"
									priority
								/>
							) : (
								<div className="bg-muted/50 flex h-full w-full items-center justify-center">
									<User className="text-muted-foreground h-12 w-12" />
								</div>
							)}
						</div>
					</div>

					{/* Info */}
					<div className="flex flex-col gap-1">
						<span className="text-muted-foreground text-base">
							{content.userProfile.profile}
						</span>

						<h1 className="text-5xl leading-tight font-bold text-white">
							{user.username}
						</h1>

						<span className="text-muted-foreground text-sm">
							{totalPublicWatchlists}{" "}
							{totalPublicWatchlists === 1
								? content.userProfile.publicWatchlist
								: content.userProfile.publicWatchlists}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
