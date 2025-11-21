import { Film } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWatchlistThumbnail } from "@/hooks/useWatchlistThumbnail";
import type { Watchlist } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";

interface WatchlistCardSmallProps {
	watchlist: Watchlist;
	onClick?: () => void;
}

export function WatchlistCardSmall({
	watchlist,
	onClick,
}: WatchlistCardSmallProps) {
	const navigate = useNavigate();
	const thumbnailUrl = useWatchlistThumbnail(watchlist);
	const { content } = useLanguageStore();

	const handleClick = () => {
		if (onClick) {
			onClick();
		} else {
			navigate(`/account/watchlist/${watchlist._id}`);
		}
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			className="group flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-lg bg-muted/30 p-3 text-left transition-all hover:bg-muted/50"
		>
			{/* Thumbnail - Square */}
			<div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
				{thumbnailUrl ? (
					<img
						src={thumbnailUrl}
						alt={watchlist.name}
						className="h-full w-full object-cover"
						loading="lazy"
						decoding="async"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center">
						<Film className="h-8 w-8 text-muted-foreground" />
					</div>
				)}
			</div>

			{/* Info */}
			<div className="flex min-w-0 flex-1 flex-col justify-center">
				<h3 className="line-clamp-1 text-sm font-semibold text-white">
					{watchlist.name}
				</h3>
				<p className="text-xs text-muted-foreground">
					{watchlist.items.length}{" "}
					{watchlist.items.length === 1
						? content.watchlists.item
						: content.watchlists.items}
				</p>
			</div>
		</button>
	);
}
