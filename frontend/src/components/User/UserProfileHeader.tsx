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
			<div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-background/60 to-background" />

			<div className="container relative mx-auto px-4 pt-8">
				{/* Back Button */}
				<div className="mb-4">
					<button
						type="button"
						onClick={handleBack}
						className="flex items-center gap-2 rounded text-sm text-muted-foreground transition-colors hover:text-white"
					>
						<ArrowLeft className="h-4 w-4" />
						<span>{content.watchlists.back}</span>
					</button>
				</div>

				<div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-8">
					{/* Avatar - Round */}
					<div className="flex-shrink-0">
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
								<div className="flex h-full w-full items-center justify-center bg-muted/50">
									<User className="h-24 w-24 text-muted-foreground" />
								</div>
							)}
						</div>
					</div>

					{/* Info */}
					<div className="flex flex-1 flex-col justify-end space-y-4">
						<div className="space-y-1">
							<span className="text-sm font-normal text-muted-foreground">
								{content.userProfile.profile}
							</span>
						</div>

						<h1 className="text-4xl font-bold text-white md:text-[80px] leading-[0.9]">
							{user.username}
						</h1>

						<div className="flex items-center gap-2 text-sm text-muted-foreground">
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
