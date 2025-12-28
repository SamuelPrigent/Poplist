import { Link } from "react-router-dom";
import type { Watchlist } from "@/lib/api-client";
import type { Content } from "@/types/content";

interface ListCardImgProps {
	watchlist: Watchlist;
	content: Content;
	href: string;
	logoUrl: string;
	showOwner?: boolean;
}

export function ListCardImg({
	watchlist,
	content,
	href,
	logoUrl,
	showOwner = false,
}: ListCardImgProps) {
	return (
		<Link
			to={href}
			className="group block cursor-pointer rounded-lg p-2 transition-colors hover:bg-[#36363780]"
		>
			{/* Logo Container */}
			{/* <div className="bg-card border-border relative mb-3 aspect-square w-full overflow-hidden rounded-md border transition-all group-hover:bg-[#0f172a] group-hover:shadow-lg"> */}
			<div className="bg-card relative mb-3 aspect-square w-full overflow-hidden rounded-md border-2 transition-all group-hover:bg-[#0f172a] group-hover:shadow-lg">
				<div className="flex h-full w-full items-center justify-center p-6">
					{logoUrl ? (
						<img
							src={logoUrl}
							alt={watchlist.name}
							className="h-[55%] w-[55%] object-contain opacity-100 transition-opacity group-hover:brightness-110"
							loading="lazy"
							decoding="async"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center">
							<span className="text-muted-foreground text-lg font-semibold">
								{watchlist.name}
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Text Info */}
			<div className="flex items-center gap-1">
				<h3 className="line-clamp-2 text-[14.5px] font-semibold text-white">
					{watchlist.name}
				</h3>
			</div>

			{showOwner && (
				<p className="text-muted-foreground mt-1 text-xs">
					par{" "}
					{typeof watchlist.ownerId === "object" &&
					watchlist.ownerId !== null &&
					"username" in watchlist.ownerId &&
					watchlist.ownerId.username ? (
						<span className="text-white capitalize">
							{watchlist.ownerId.username}
						</span>
					) : (
						<span className="capitalize">Anonyme</span>
					)}
				</p>
			)}

			<div className="text-muted-foreground mt-1 flex items-center justify-between text-xs">
				<span className="text-muted-foreground">
					{watchlist.items.length}{" "}
					{watchlist.items.length === 1
						? content.watchlists.item
						: content.watchlists.items}
				</span>
			</div>
		</Link>
	);
}
