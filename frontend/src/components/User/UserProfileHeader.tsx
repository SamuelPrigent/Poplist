import { ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguageStore } from "@/store/language";

interface UserProfileHeaderProps {
	user: {
		_id: string;
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
	const navigate = useNavigate();
	const { content } = useLanguageStore();

	const handleBack = () => {
		if (hasWatchlists) {
			navigate(-1);
		} else {
			navigate("/home");
		}
	};

	return (
		<div className="relative w-full overflow-hidden">
			{/* Background Gradient */}
			<div className="via-background/60 to-background absolute inset-0 bg-linear-to-b from-purple-900/20" />

			<div className="relative container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 pt-8">
				{/* Back Button */}
				<div className="mb-4">
					<button
						type="button"
						onClick={handleBack}
						className="text-muted-foreground flex items-center gap-2 rounded text-sm transition-colors hover:text-white"
					>
						<ArrowLeft className="h-4 w-4" />
						<span>{content.watchlists.back}</span>
					</button>
				</div>

				<div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-8">
					{/* Avatar - Round */}
					<div className="shrink-0">
						<div className="relative h-56 w-56 overflow-hidden rounded-full shadow-2xl">
							{user.avatarUrl ? (
								<img
									src={user.avatarUrl}
									alt={user.username}
									className="h-full w-full object-cover"
									loading="lazy"
									decoding="async"
								/>
							) : (
								<div className="bg-muted/50 flex h-full w-full items-center justify-center">
									<User className="text-muted-foreground h-24 w-24" />
								</div>
							)}
						</div>
					</div>

					{/* Info */}
					<div className="flex flex-1 flex-col justify-end space-y-4">
						<div className="space-y-1">
							<span className="text-muted-foreground text-sm font-normal">
								{content.userProfile.profile}
							</span>
						</div>

						<h1 className="text-4xl leading-[0.9] font-bold text-white md:text-[80px]">
							{user.username}
						</h1>

						<div className="text-muted-foreground flex items-center gap-2 text-sm">
							<span>
								{totalPublicWatchlists}{" "}
								{totalPublicWatchlists === 1
									? content.userProfile.watchlist
									: content.userProfile.watchlists}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
