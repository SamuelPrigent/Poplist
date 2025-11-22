import { ArrowLeft, Copy, Film, Pencil, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import checkGreenIcon from "@/assets/checkGreenFull.svg";
import plusIcon from "@/assets/plus2.svg";
import shareIcon from "@/assets/share.svg";
import { useWatchlistThumbnail } from "@/hooks/useWatchlistThumbnail";
import type { Collaborator, Watchlist, WatchlistOwner } from "@/lib/api-client";
// import { getTMDBImageUrl } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";

interface WatchlistHeaderProps {
	watchlist: Watchlist;
	actionButton?: React.ReactNode;
	menuButton?: React.ReactNode;
	onEdit?: () => void;
	onImageClick?: () => void;
	onShare?: () => void;
	onSave?: () => void;
	isSaved?: boolean;
	showSaveButton?: boolean;
	onDuplicate?: () => void;
	showDuplicateButton?: boolean;
	collaboratorButton?: React.ReactNode;
}

/**
 * ⚠️ 4 HTTP CALLS APPROACH - TESTING
 *
 * This component now displays 4 separate poster images in a 2x2 grid instead of generating a base64 collage.
 * This allows the browser to:
 * - Use HTTP caching properly
 * - Load images in parallel
 * - Avoid localStorage quota issues
 * - Leverage TMDB CDN benefits
 */

function isWatchlistOwner(
	value: Watchlist["ownerId"],
): value is WatchlistOwner {
	return (
		typeof value === "object" &&
		value !== null &&
		("username" in value || "email" in value)
	);
}

export function WatchlistHeader({
	watchlist,
	actionButton,
	menuButton,
	onEdit,
	onImageClick,
	onShare,
	onSave,
	isSaved = false,
	showSaveButton = false,
	onDuplicate,
	showDuplicateButton = false,
	collaboratorButton,
}: WatchlistHeaderProps) {
	const navigate = useNavigate();
	const { content } = useLanguageStore();
	const [showSaveAnimation, setShowSaveAnimation] = useState(false);

	// Get cover image (custom or auto-generated thumbnail)
	// Use the hook to handle both online (Cloudinary) and offline (base64) thumbnails
	const generatedThumbnail = useWatchlistThumbnail(watchlist);
	const coverImage = watchlist.imageUrl || generatedThumbnail;

	const itemCount = watchlist.items.length;
	const ownerUsername = isWatchlistOwner(watchlist.ownerId)
		? watchlist.ownerId.username || watchlist.ownerId.email
		: null;
	const ownerAvatarUrl = isWatchlistOwner(watchlist.ownerId)
		? (watchlist.ownerId as WatchlistOwner & { avatarUrl?: string }).avatarUrl
		: null;

	return (
		<div className="relative w-full overflow-hidden">
			{/* Background Gradient */}
			<div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-background/60 to-background" />

			<div className="container relative mx-auto px-4 pt-8">
				{/* Back Button */}
				<div className="mb-8">
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="flex items-center gap-2 rounded text-sm text-muted-foreground transition-colors hover:text-white"
					>
						<ArrowLeft className="h-4 w-4" />
						<span>{content.watchlists.back}</span>
					</button>
				</div>

				<div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-8">
					{/* Cover Image */}
					<div className="flex-shrink-0">
						<div
							className={`group relative h-56 w-56 overflow-hidden rounded-lg shadow-2xl ${onImageClick ? "cursor-pointer" : ""}`}
							onClick={onImageClick}
						>
							{coverImage ? (
								<>
									<img
										src={coverImage}
										alt={watchlist.name}
										className="h-full w-full object-cover"
										loading="lazy"
										decoding="async"
									/>
									{/* Hover Overlay - only if onImageClick is defined */}
									{onImageClick && (
										<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
											<Pencil className="h-10 w-10 text-white" />
											<span className="mt-2 text-sm font-medium text-white">
												{"Sélectionner une photo"}
											</span>
										</div>
									)}
								</>
							) : (
								<div className="flex h-full w-full items-center justify-center bg-muted/50">
									<Film className="h-24 w-24 text-muted-foreground" />
								</div>
							)}
						</div>
					</div>

					{/* Info */}
					<div className="flex flex-1 flex-col justify-end space-y-4">
						{watchlist.isPublic && (
							<span className="text-sm font-normal text-muted-foreground">
								{content.watchlists.headerPublic}
							</span>
						)}

						<h1
							className={`text-4xl font-bold text-white md:text-7xl ${onEdit ? "cursor-pointer transition-colors hover:text-primary" : ""}`}
							onClick={onEdit}
						>
							{watchlist.name}
						</h1>

						{watchlist.description && (
							<p className="text-[14px] text-muted-foreground">
								{watchlist.description}
							</p>
						)}

						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							{ownerUsername && (
								<>
									{/* flex c */}
									<div className="flex items-center gap-2">
										<div className="flex items-center">
											{/* user + username */}
											<div className="flex items-center gap-1">
												<div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-muted">
													{ownerAvatarUrl ? (
														<img
															src={ownerAvatarUrl}
															alt={ownerUsername || "Owner"}
															className="h-full w-full object-cover"
														/>
													) : (
														<User className="h-3.5 w-3.5 text-muted-foreground" />
													)}
												</div>
												<span
													onClick={() => {
														if (isWatchlistOwner(watchlist.ownerId)) {
															navigate(`/user/${ownerUsername}`);
														}
													}}
													className={`font-semibold capitalize text-white ${isWatchlistOwner(watchlist.ownerId) ? "cursor-pointer hover:underline" : ""}`}
												>
													{ownerUsername}
												</span>
											</div>
											{watchlist.collaborators &&
												watchlist.collaborators.length > 0 && <div>,</div>}
										</div>
										{/* Collaborator Avatars - overlapping */}
										{watchlist.collaborators &&
											watchlist.collaborators.length > 0 &&
											Array.isArray(watchlist.collaborators) && (
												<div className="flex -space-x-2">
													{(watchlist.collaborators as Collaborator[])
														.filter(
															(c): c is Collaborator =>
																typeof c === "object" && c !== null,
														)
														.slice(0, 3)
														.map((collaborator) => (
															<div
																key={collaborator._id}
																className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-background"
																title={collaborator.username}
															>
																{(
																	collaborator as Collaborator & {
																		avatarUrl?: string;
																	}
																).avatarUrl ? (
																	<img
																		src={
																			(
																				collaborator as Collaborator & {
																					avatarUrl?: string;
																				}
																			).avatarUrl
																		}
																		alt={collaborator.username}
																		className="h-full w-full object-cover"
																	/>
																) : (
																	<User className="h-3.5 w-3.5 text-muted-foreground" />
																)}
															</div>
														))}
													{(watchlist.collaborators as Collaborator[]).filter(
														(c): c is Collaborator =>
															typeof c === "object" && c !== null,
													).length > 3 && (
														<div
															className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium ring-2 ring-background"
															title={`+${(watchlist.collaborators as Collaborator[]).filter((c): c is Collaborator => typeof c === "object" && c !== null).length - 3} collaborateurs`}
														>
															+
															{(
																watchlist.collaborators as Collaborator[]
															).filter(
																(c): c is Collaborator =>
																	typeof c === "object" && c !== null,
															).length - 3}
														</div>
													)}
												</div>
											)}
									</div>
									<span>•</span>
								</>
							)}
							<span>
								{itemCount}{" "}
								{itemCount === 1
									? content.watchlists.item
									: content.watchlists.items}
							</span>
							{watchlist.likedBy && watchlist.likedBy.length >= 1 && (
								<>
									<span>•</span>
									<span>
										{watchlist.likedBy.length}{" "}
										{watchlist.likedBy.length === 1
											? "sauvegarde"
											: "sauvegardes"}
									</span>
								</>
							)}
						</div>
					</div>
				</div>

				{/* Action Buttons Row - Below Header */}
				{(() => {
					const hasLeftButtons =
						showSaveButton ||
						showDuplicateButton ||
						onShare ||
						collaboratorButton ||
						menuButton;
					return (
						<div
							className={`mt-6 flex items-center ${hasLeftButtons ? "justify-between" : "justify-end"}`}
						>
							{/* Left: Icon Buttons */}
							{hasLeftButtons && (
								<div className="flex items-center gap-1">
									{showSaveButton && onSave && (
										<button
											type="button"
											onClick={async () => {
												// Trigger animation on every click (both save and unsave)
												setShowSaveAnimation(true);
												setTimeout(() => setShowSaveAnimation(false), 200);
												await onSave();
											}}
											className="group relative rounded p-3 transition-all hover:scale-105"
											title={
												isSaved
													? content.watchlists.tooltips.unsave
													: content.watchlists.tooltips.save
											}
										>
											{/* Container to maintain fixed size */}
											<div className="relative h-6 w-6">
												{/* Plus Icon - shown when not saved */}
												<img
													src={plusIcon}
													alt="Save"
													className={`absolute inset-0 h-6 w-6 transition-opacity ${
														isSaved
															? "opacity-0"
															: showSaveAnimation
																? "opacity-100"
																: "opacity-60 brightness-0 invert group-hover:opacity-100"
													}`}
													style={{
														transitionDuration: isSaved ? "0ms" : "200ms",
													}}
												/>
												{/* Check Green Icon - shown when saved */}
												<img
													src={checkGreenIcon}
													alt="Saved"
													className={`absolute inset-0 h-6 w-6 transition-opacity ${
														isSaved
															? showSaveAnimation
																? "opacity-100"
																: "opacity-100"
															: "opacity-0"
													}`}
													style={{
														transitionDuration: !isSaved ? "0ms" : "200ms",
													}}
												/>
											</div>
										</button>
									)}
									{collaboratorButton && collaboratorButton}

									{showDuplicateButton && onDuplicate && (
										<button
											type="button"
											onClick={onDuplicate}
											className="group rounded p-3 transition-all hover:scale-105"
											title={content.watchlists.tooltips.duplicate}
										>
											<Copy className="h-6 w-6 text-white opacity-60 transition-all group-hover:opacity-100" />
										</button>
									)}
									{onShare && (
										<button
											type="button"
											onClick={onShare}
											className="group rounded p-3 transition-all hover:scale-105"
											title={content.watchlists.tooltips.share}
										>
											<img
												src={shareIcon}
												alt="Share"
												className="h-7 w-7 opacity-60 brightness-0 invert transition-all group-hover:opacity-100"
											/>
										</button>
									)}
									{menuButton && menuButton}
								</div>
							)}

							{/* Right: Action Button (e.g., Add Item) */}
							{actionButton && (
								<div className="flex-shrink-0">{actionButton}</div>
							)}
						</div>
					);
				})()}
			</div>
		</div>
	);
}
