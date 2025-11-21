import type {
	DraggableAttributes,
	DraggableSyntheticListeners,
} from "@dnd-kit/core";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Edit, Film, MoreVertical, Trash2 } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import teamIcon from "@/assets/team.svg";
import { useWatchlistThumbnail } from "@/hooks/useWatchlistThumbnail";
import type { Watchlist } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import type { Content } from "@/types/content";

interface WatchlistCardProps {
	watchlist: Watchlist;
	content: Content;
	href: string;
	onEdit?: (watchlist: Watchlist) => void;
	onDelete?: (watchlist: Watchlist) => void;
	showMenu?: boolean;
	showOwner?: boolean;
	showVisibility?: boolean;
	showSavedBadge?: boolean;
	showCollaborativeBadge?: boolean;
	categoryGradient?: string;
	draggableProps?: {
		ref: (node: HTMLElement | null) => void;
		style?: React.CSSProperties;
		attributes?: DraggableAttributes;
		listeners?: DraggableSyntheticListeners;
	};
}

export function WatchlistCard({
	watchlist,
	content,
	href,
	onEdit,
	onDelete,
	showMenu = true,
	showOwner = false,
	showVisibility = false,
	showSavedBadge = false,
	showCollaborativeBadge = false,
	categoryGradient,
	draggableProps,
}: WatchlistCardProps) {
	const thumbnailUrl = useWatchlistThumbnail(watchlist);
	const editButtonRef = useRef<HTMLDivElement>(null);
	const deleteButtonRef = useRef<HTMLDivElement>(null);

	// Only add onClick handlers for draggable cards
	// Non-draggable cards use Link wrapper for navigation
	const handleClick = draggableProps
		? (e: React.MouseEvent) => {
				e.stopPropagation();
				window.location.href = href;
			}
		: undefined;

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (handleClick && (e.key === "Enter" || e.key === " ")) {
			e.preventDefault();
			handleClick(e as unknown as React.MouseEvent);
		}
	};

	// Handle Tab navigation inside dropdown to alternate between Edit and Delete
	const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Tab") {
			e.preventDefault();
			e.stopPropagation();

			const editButton = editButtonRef.current;
			const deleteButton = deleteButtonRef.current;

			if (!editButton || !deleteButton) return;

			// Check which element currently has focus
			const activeElement = document.activeElement;

			if (activeElement === editButton || editButton.contains(activeElement)) {
				// Focus is on Edit, move to Delete
				deleteButton.focus();
			} else {
				// Focus is on Delete (or nowhere), move to Edit
				editButton.focus();
			}
		}
	};

	const cardContent = (
		<>
			{/* Cover Image */}
			<div
				onClick={handleClick}
				onKeyDown={handleClick ? handleKeyDown : undefined}
				role={handleClick ? "button" : undefined}
				tabIndex={handleClick ? 0 : undefined}
				className={cn(
					"relative mb-3 aspect-[1/1] w-full overflow-hidden rounded-md bg-muted",
					draggableProps && "cursor-pointer",
				)}
				style={categoryGradient ? { background: categoryGradient } : undefined}
			>
				{categoryGradient ? (
					<div className="relative flex h-full w-full items-center justify-center p-4">
						{/* Dark overlay for better text contrast */}
						<div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
						<span className="relative z-10 text-center text-lg font-bold text-white drop-shadow-lg">
							{watchlist.name}
						</span>
					</div>
				) : thumbnailUrl ? (
					<img
						src={thumbnailUrl}
						alt={watchlist.name}
						className="h-full w-full object-cover"
						loading="lazy"
						decoding="async"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center">
						<Film className="h-12 w-12 text-muted-foreground" />
					</div>
				)}
			</div>

			{/* Text Info */}
			<div className="flex items-center gap-1">
				{/* Saved Badge - Indicates this is a followed watchlist */}
				{showSavedBadge && (
					<img
						src="/src/assets/checkGreenFull.svg"
						alt="Suivi"
						className="h-4 w-4 flex-shrink-0"
					/>
				)}

				{/* Collaborative Badge - Indicates this is a collaborative watchlist */}
				{showCollaborativeBadge && (
					//   <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted/80">
					// {/* <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[hsl(0deg_85.8%_55.11%_/_54%)]"> */}
					<div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[hsl(207.87deg_100%_34.92%_/_57%)]">
						<img
							src={teamIcon}
							alt="Collaborative"
							className="h-3 w-3 brightness-0 invert"
						/>
					</div>
				)}

				<h3
					onClick={handleClick}
					onKeyDown={handleClick ? handleKeyDown : undefined}
					role={handleClick ? "button" : undefined}
					tabIndex={handleClick ? 0 : undefined}
					className={cn(
						"line-clamp-2 text-sm font-semibold text-white",
						draggableProps && "cursor-pointer",
					)}
				>
					{watchlist.name}
				</h3>
			</div>

			{showOwner && (
				<p
					onClick={handleClick}
					onKeyDown={handleClick ? handleKeyDown : undefined}
					role={handleClick ? "button" : undefined}
					tabIndex={handleClick ? 0 : undefined}
					className={cn(
						"mt-1 text-xs capitalize text-muted-foreground",
						draggableProps && "cursor-pointer",
					)}
				>
					par{" "}
					{typeof watchlist.ownerId === "object"
						? watchlist.ownerId.username || "Anonyme"
						: "Anonyme"}
				</p>
			)}

			{showVisibility && (
				<div className="mt-1 text-xs text-muted-foreground">
					<span
						onClick={handleClick}
						onKeyDown={handleClick ? handleKeyDown : undefined}
						role={handleClick ? "button" : undefined}
						tabIndex={handleClick ? 0 : undefined}
						className={cn(draggableProps && "cursor-pointer")}
					>
						{watchlist.isPublic
							? content.watchlists.public
							: content.watchlists.private}
					</span>
				</div>
			)}

			<div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
				<span
					onClick={handleClick}
					className={cn(draggableProps && "cursor-pointer")}
				>
					{watchlist.items.length}{" "}
					{watchlist.items.length === 1
						? content.watchlists.item
						: content.watchlists.items}
				</span>

				{/* More Menu */}
				{showMenu && onEdit && onDelete && (
					<DropdownMenu.Root
						onOpenChange={(open) => {
							if (!open) {
								// Remove focus when dropdown closes
								setTimeout(() => {
									if (document.activeElement instanceof HTMLElement) {
										document.activeElement.blur();
									}
								}, 0);
							}
						}}
					>
						<DropdownMenu.Trigger asChild>
							<button
								type="button"
								onClick={(e) => e.stopPropagation()}
								className="ml-auto flex h-6 w-6 items-center justify-center rounded opacity-0 transition-all hover:bg-muted focus-visible:opacity-100 group-hover:opacity-100"
							>
								<MoreVertical className="h-4 w-4" />
							</button>
						</DropdownMenu.Trigger>

						<DropdownMenu.Portal>
							<DropdownMenu.Content
								className="z-50 min-w-[180px] overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-md"
								sideOffset={5}
								onKeyDown={handleDropdownKeyDown}
							>
								<DropdownMenu.Item
									ref={editButtonRef}
									className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
									onSelect={() => onEdit(watchlist)}
								>
									<Edit className="mr-2 h-4 w-4" />
									<span>{content.watchlists.edit}</span>
								</DropdownMenu.Item>

								<DropdownMenu.Item
									ref={deleteButtonRef}
									className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm text-red-500 outline-none transition-colors hover:bg-red-500/10 hover:text-red-500 focus:bg-red-500/10 focus:text-red-500"
									onSelect={() => onDelete(watchlist)}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									<span>{content.watchlists.delete}</span>
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Portal>
					</DropdownMenu.Root>
				)}
			</div>
		</>
	);

	if (draggableProps) {
		return (
			<div
				ref={draggableProps.ref}
				style={draggableProps.style}
				{...draggableProps.attributes}
				{...draggableProps.listeners}
				className="group cursor-pointer rounded-lg p-2 transition-colors hover:bg-[#36363780]"
			>
				{cardContent}
			</div>
		);
	}

	return (
		<Link
			to={href}
			className="group block cursor-pointer rounded-lg p-2 transition-colors hover:bg-[#36363780]"
		>
			{cardContent}
		</Link>
	);
}
