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

function isWatchlistOwner(
	value: Watchlist["ownerId"]
): value is WatchlistOwner {
	return (
		typeof value === "object" &&
		value !== null &&
		("username" in value || "email" in value)
	);
}

export const WATCHLIST_HEADER_BUTTON_CLASS =
	"group relative flex h-[80%] items-center justify-center rounded-lg p-3 transition-all cursor-pointer  hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

export const WATCHLIST_HEADER_ICON_CLASS =
	"h-6 w-6 transition-all opacity-60 group-hover:opacity-100";

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
			<div className="via-background/60 to-background absolute inset-0 bg-linear-to-b from-purple-900/20" />

			<div className="relative container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 pt-8">
				{/* Back Button */}
				<div className="mb-8">
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="text-muted-foreground flex cursor-pointer items-center gap-2 rounded text-sm transition-colors hover:text-white"
					>
						<ArrowLeft className="h-4 w-4" />
						<span>{content.watchlists.back}</span>
					</button>
				</div>

				<div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-8">
					{/* Cover Image */}
					<div className="shrink-0">
						{onImageClick ? (
							<button
								type="button"
								className="group relative h-56 w-56 cursor-pointer overflow-hidden rounded-lg shadow-2xl"
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
										{/* Hover Overlay */}
										<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
											<Pencil className="h-10 w-10 text-white" />
											<span className="mt-2 text-sm font-medium text-white">
												{"Sélectionner une photo"}
											</span>
										</div>
									</>
								) : (
									<div className="bg-muted/50 flex h-full w-full items-center justify-center">
										<Film className="text-muted-foreground h-24 w-24" />
									</div>
								)}
							</button>
						) : (
							<div className="group relative h-56 w-56 overflow-hidden rounded-lg shadow-2xl">
								{coverImage ? (
									<img
										src={coverImage}
										alt={watchlist.name}
										className="h-full w-full object-cover"
										loading="lazy"
										decoding="async"
									/>
								) : (
									<div className="bg-muted/50 flex h-full w-full items-center justify-center">
										<Film className="text-muted-foreground h-24 w-24" />
									</div>
								)}
							</div>
						)}
					</div>

					{/* Info */}
					<div className="flex flex-1 flex-col justify-end space-y-4">
						{watchlist.isPublic && (
							<span className="text-muted-foreground text-sm font-normal">
								{content.watchlists.headerPublic}
							</span>
						)}

						<h1 className="text-4xl font-bold text-white md:text-7xl">
							{onEdit ? (
								<button
									type="button"
									onClick={onEdit}
									className="hover:text-primary cursor-pointer rounded-lg text-left transition-colors"
								>
									{watchlist.name}
								</button>
							) : (
								watchlist.name
							)}
						</h1>

						{watchlist.description && (
							<p className="text-muted-foreground text-[14px]">
								{watchlist.description}
							</p>
						)}

						<div className="text-muted-foreground flex items-center gap-2 text-sm">
							{ownerUsername && (
								<>
									{/* flex c */}
									<div className="flex items-center gap-2">
										<div className="flex items-center">
											{/* user + username */}
											<div className="flex items-center gap-1">
												<div className="bg-muted flex h-6 w-6 items-center justify-center overflow-hidden rounded-full">
													{ownerAvatarUrl ? (
														<img
															src={ownerAvatarUrl}
															alt={ownerUsername || "Owner"}
															className="h-full w-full object-cover"
														/>
													) : (
														<User className="text-muted-foreground h-3.5 w-3.5" />
													)}
												</div>
												<button
													type="button"
													onClick={() => navigate(`/user/${ownerUsername}`)}
													className="cursor-pointer rounded-lg font-semibold text-white capitalize hover:underline"
												>
													{ownerUsername}
												</button>
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
																typeof c === "object" && c !== null
														)
														.slice(0, 3)
														.map((collaborator) => (
															<div
																key={collaborator._id}
																className="bg-muted ring-background flex h-6 w-6 items-center justify-center overflow-hidden rounded-full ring-2"
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
																	<User className="text-muted-foreground h-3.5 w-3.5" />
																)}
															</div>
														))}
													{(watchlist.collaborators as Collaborator[]).filter(
														(c): c is Collaborator =>
															typeof c === "object" && c !== null
													).length > 3 && (
														<div
															className="bg-muted ring-background flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ring-2"
															title={`+${(watchlist.collaborators as Collaborator[]).filter((c): c is Collaborator => typeof c === "object" && c !== null).length - 3} collaborateurs`}
														>
															+
															{(
																watchlist.collaborators as Collaborator[]
															).filter(
																(c): c is Collaborator =>
																	typeof c === "object" && c !== null
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
								<div className="flex min-h-[50px] items-center justify-center gap-1">
									{showSaveButton && onSave && (
										<button
											type="button"
											onClick={async () => {
												// Trigger animation on every click (both save and unsave)
												setShowSaveAnimation(true);
												setTimeout(() => setShowSaveAnimation(false), 200);
												await onSave();
											}}
											className={WATCHLIST_HEADER_BUTTON_CLASS}
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
											className={WATCHLIST_HEADER_BUTTON_CLASS}
											title={content.watchlists.tooltips.duplicate}
										>
											<Copy
												className={`${WATCHLIST_HEADER_ICON_CLASS} text-white`}
											/>
										</button>
									)}
									{onShare && (
										<button
											type="button"
											onClick={onShare}
											className={WATCHLIST_HEADER_BUTTON_CLASS}
											title={content.watchlists.tooltips.share}
										>
											<img
												src={shareIcon}
												alt="Share"
												className={`${WATCHLIST_HEADER_ICON_CLASS} brightness-0 invert`}
											/>
										</button>
									)}
									{menuButton && menuButton}
								</div>
							)}

							{/* Right: Action Button (e.g., Add Item) */}
							{actionButton && <div className="shrink-0">{actionButton}</div>}
						</div>
					);
				})()}
			</div>
		</div>
	);
}
