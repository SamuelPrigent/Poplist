import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import cancelUserIcon from "@/assets/cancelUser.svg";
import pointIcon from "@/assets/points.svg";
import { Button } from "@/components/ui/button";
import { AddCollaboratorPopover } from "@/components/Watchlist/AddCollaboratorPopover";
import { AddItemModal } from "@/components/Watchlist/modal/AddItemModal";
import { DeleteWatchlistDialog } from "@/components/Watchlist/modal/DeleteWatchlistDialog";
import {
	EditWatchlistDialog,
	type EditWatchlistDialogRef,
} from "@/components/Watchlist/modal/EditWatchlistDialog";
import { LeaveWatchlistDialog } from "@/components/Watchlist/modal/LeaveWatchlistDialog";
import { WatchlistHeader } from "@/components/Watchlist/WatchlistHeader";
import { WatchlistItemsTable } from "@/components/Watchlist/WatchlistItemsTable";
import { useAuth } from "@/context/auth-context";
import {
	type Collaborator,
	type Watchlist,
	watchlistAPI,
} from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";

export function WatchlistDetail() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { content } = useLanguageStore();
	const { isAuthenticated, user } = useAuth();
	const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);
	const [addModalOpen, setAddModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
	const [isOwner, setIsOwner] = useState(false);
	const [isCollaborator, setIsCollaborator] = useState(false);
	const [isSaved, setIsSaved] = useState(false);
	const editDialogRef = useRef<EditWatchlistDialogRef>(null);

	const fetchWatchlist = useCallback(async () => {
		if (!id) {
			navigate("/account/watchlists", { replace: true });
			return;
		}

		try {
			setLoading(true);
			setNotFound(false);

			let data: Watchlist;
			if (isAuthenticated) {
				// Authenticated users use the regular endpoint (includes ownership check)
				const response = await watchlistAPI.getById(id);
				data = response.watchlist;

				// Check if current user is the owner by comparing emails
				const ownerEmail =
					typeof data.ownerId === "string" ? null : data.ownerId?.email;
				const isUserOwner = user?.email === ownerEmail;
				setIsOwner(isUserOwner);

				// Set isCollaborator from backend response
				setIsCollaborator(response.isCollaborator || false);

				// Set isSaved from backend response
				setIsSaved(response.isSaved || false);
			} else {
				// Unauthenticated users use the public endpoint
				const response = await watchlistAPI.getPublic(id);
				data = response.watchlist;
				setIsOwner(false); // Public viewers are never owners
				setIsCollaborator(false);
				setIsSaved(false);
			}

			setWatchlist(data);
		} catch (err) {
			console.error("Failed to fetch watchlist:", err);
			// Show 404 page instead of redirecting
			setNotFound(true);
		} finally {
			setLoading(false);
		}
	}, [id, navigate, isAuthenticated, user]);

	useEffect(() => {
		fetchWatchlist();
	}, [fetchWatchlist]);

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="flex items-center justify-center py-12">
					<div className="text-muted-foreground">
						{content.watchlists.loading}
					</div>
				</div>
			</div>
		);
	}

	if (notFound || !watchlist) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
					<div className="rounded-full bg-muted p-6">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="h-16 w-16 text-muted-foreground"
						>
							<title>Watchlist not found icon</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
							/>
						</svg>
					</div>
					<div className="text-center">
						<h1 className="text-2xl font-bold">Watchlist introuvable</h1>
						<p className="mt-2 text-muted-foreground">
							Cette watchlist n'existe pas ou a été supprimée.
						</p>
					</div>
					<Button onClick={() => navigate("/account/watchlists")}>
						Retour à mes watchlists
					</Button>
				</div>
			</div>
		);
	}

	const handleImageClick = () => {
		setEditModalOpen(true);
		// Open file picker after a short delay to ensure modal is open
		setTimeout(() => {
			editDialogRef.current?.openFilePicker();
		}, 300);
	};

	const handleShare = async () => {
		if (!id) return;

		const url = `${window.location.origin}/account/watchlist/${id}`;

		try {
			await navigator.clipboard.writeText(url);
			toast.success("Lien copié");
		} catch (error) {
			console.error("❌ Failed to copy link:", error);
			toast.error("Impossible de copier le lien");
		}
	};

	const handleToggleSave = async () => {
		if (!id || !isAuthenticated || isOwner || !watchlist) return;

		// Store previous state for rollback
		const previousIsSaved = isSaved;
		const previousLikedBy = watchlist.likedBy;
		const previousWatchlist = { ...watchlist };

		try {
			// Optimistic update - update UI immediately
			const newIsSaved = !isSaved;
			setIsSaved(newIsSaved);

			// Update likedBy count optimistically
			const updatedWatchlist = {
				...watchlist,
				likedBy: newIsSaved
					? [...watchlist.likedBy, user?.email || ""] // Add user email
					: watchlist.likedBy
							.filter(() => watchlist.likedBy.length > 0)
							.slice(0, -1), // Remove one
			};
			setWatchlist(updatedWatchlist as Watchlist);

			// Make API call
			if (previousIsSaved) {
				await watchlistAPI.unsaveWatchlist(id);
				toast.success("Watchlist retirée");
			} else {
				await watchlistAPI.saveWatchlist(id);
				toast.success("Watchlist ajoutée");
			}
		} catch (error) {
			console.error("❌ Failed to toggle save watchlist:", error);
			toast.error("Impossible de modifier la watchlist");

			// Rollback on error
			setIsSaved(previousIsSaved);
			setWatchlist({
				...previousWatchlist,
				likedBy: previousLikedBy,
			});
		}
	};

	const handleDuplicate = async () => {
		if (!id || !isAuthenticated || isOwner) return;

		const loadingToast = toast.loading("Duplication en cours...");

		try {
			const { watchlist: duplicatedWatchlist } =
				await watchlistAPI.duplicateWatchlist(id);

			toast.success("Watchlist dupliquée", { id: loadingToast });

			// Redirect to the new duplicated watchlist
			navigate(`/account/watchlist/${duplicatedWatchlist._id}`);
		} catch (error) {
			console.error("❌ Failed to duplicate watchlist:", error);
			toast.error("Impossible de dupliquer la watchlist", { id: loadingToast });
		}
	};

	const getCollaborators = (): Collaborator[] => {
		if (!watchlist || !watchlist.collaborators) return [];
		// Filter out non-populated collaborators (if any are still IDs)
		return watchlist.collaborators.filter(
			(c): c is Collaborator => typeof c === "object" && c !== null
		);
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background">
			<WatchlistHeader
				watchlist={watchlist}
				actionButton={
					isOwner || isCollaborator ? (
						<Button onClick={() => setAddModalOpen(true)}>
							<Plus className="h-4 w-4" />
							{content.watchlists.addItem}
						</Button>
					) : null
				}
				menuButton={
					isOwner ? (
						<DropdownMenu.Root
							onOpenChange={(open) => {
								if (!open) {
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
									className="select-none rounded p-3 transition-all hover:scale-105"
								>
									<img
										src={pointIcon}
										alt="Menu"
										className="h-8 w-8 opacity-60 brightness-0 invert transition-all hover:opacity-100"
									/>
								</button>
							</DropdownMenu.Trigger>
							<DropdownMenu.Portal>
								<DropdownMenu.Content
									className="z-50 min-w-[200px] overflow-hidden rounded-md border border-border bg-background p-1 shadow-md"
									sideOffset={5}
								>
									<DropdownMenu.Item
										className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
										onClick={() => setEditModalOpen(true)}
									>
										<Pencil className="h-4 w-4" />
										<span>{content.watchlists.editWatchlist}</span>
									</DropdownMenu.Item>
									<DropdownMenu.Item
										className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-500 outline-none transition-colors hover:bg-red-500/10 hover:text-red-500 focus:bg-red-500/10 focus:text-red-500"
										onClick={() => setDeleteDialogOpen(true)}
									>
										<Trash2 className="h-4 w-4" />
										<span>{content.watchlists.deleteWatchlist}</span>
									</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Portal>
						</DropdownMenu.Root>
					) : null
				}
				onEdit={isOwner ? () => setEditModalOpen(true) : undefined}
				onImageClick={isOwner ? handleImageClick : undefined}
				onShare={handleShare}
				onSave={handleToggleSave}
				isSaved={isSaved}
				showSaveButton={isAuthenticated && !isOwner && !isCollaborator}
				onDuplicate={handleDuplicate}
				showDuplicateButton={isAuthenticated && !isOwner && !isCollaborator}
				collaboratorButton={
					isOwner && id ? (
						<AddCollaboratorPopover
							watchlistId={id}
							collaborators={getCollaborators()}
							onCollaboratorAdded={fetchWatchlist}
							onCollaboratorRemoved={fetchWatchlist}
						>
							<button
								type="button"
								className="group p-3 transition-all hover:scale-105"
								title={content.watchlists.tooltips.inviteCollaborator}
							>
								<UserPlus className="h-6 w-6 text-white opacity-60 transition-all group-hover:opacity-100" />
							</button>
						</AddCollaboratorPopover>
					) : isCollaborator ? (
						<button
							type="button"
							onClick={() => setLeaveDialogOpen(true)}
							className="group p-3 transition-all hover:scale-105"
							title={
								content.watchlists.collaborators?.leaveTitle ||
								"Quitter la watchlist"
							}
						>
							<img
								src={cancelUserIcon}
								alt="Leave"
								className="h-6 w-6 opacity-60 brightness-0 invert transition-all group-hover:opacity-100"
							/>
						</button>
					) : null
				}
			/>

			<div className="container mx-auto px-4 py-8">
				<WatchlistItemsTable
					watchlist={watchlist}
					onUpdate={fetchWatchlist}
					isOwner={isOwner}
					isCollaborator={isCollaborator}
				/>
			</div>

			{/* Add Item Modal - for owners and collaborators */}
			{(isOwner || isCollaborator) && (
				<AddItemModal
					open={addModalOpen}
					onOpenChange={setAddModalOpen}
					watchlist={watchlist}
					onSuccess={fetchWatchlist}
					offline={false}
				/>
			)}

			{/* Edit Watchlist Modal - only for owners */}
			{isOwner && (
				<EditWatchlistDialog
					ref={editDialogRef}
					open={editModalOpen}
					onOpenChange={setEditModalOpen}
					onSuccess={fetchWatchlist}
					watchlist={watchlist}
					offline={false}
				/>
			)}

			{/* Delete Watchlist Dialog - only for owners */}
			{isOwner && (
				<DeleteWatchlistDialog
					open={deleteDialogOpen}
					onOpenChange={setDeleteDialogOpen}
					watchlist={watchlist}
					onSuccess={() => navigate("/account/watchlists")}
					offline={false}
				/>
			)}

			{/* Leave Watchlist Dialog - only for collaborators */}
			{isCollaborator && !isOwner && id !== undefined && (
				<LeaveWatchlistDialog
					open={leaveDialogOpen}
					onOpenChange={setLeaveDialogOpen}
					watchlistId={id}
					watchlistName={watchlist.name}
				/>
			)}
		</div>
	);
}
