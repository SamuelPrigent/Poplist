import { ArrowLeft, Film, Pencil, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AddItemModal } from "@/components/Watchlist/AddItemModal";
import { DeleteWatchlistDialog } from "@/components/Watchlist/DeleteWatchlistDialog";
import {
	EditWatchlistDialogOffline,
	type EditWatchlistDialogOfflineRef,
} from "@/components/Watchlist/EditWatchlistDialogOffline";
import { WatchlistItemsTableOffline } from "@/components/Watchlist/WatchlistItemsTableOffline";
import { useWatchlistThumbnail } from "@/hooks/useWatchlistThumbnail";
import type { Watchlist } from "@/lib/api-client";
import { getLocalWatchlists } from "@/lib/localStorageHelpers";
import { useLanguageStore } from "@/store/language";

export function WatchlistDetailOffline() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { content } = useLanguageStore();
	const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);
	const [addModalOpen, setAddModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const editDialogRef = useRef<EditWatchlistDialogOfflineRef>(null);

	const fetchWatchlist = useCallback(() => {
		if (!id) return;

		try {
			setLoading(true);
			setNotFound(false);
			const watchlists = getLocalWatchlists();
			const found = watchlists.find((w) => w._id === id);

			if (found && found.ownerId === "offline") {
				setWatchlist(found);
			} else {
				setNotFound(true);
			}
		} catch (err) {
			console.error("Failed to fetch watchlist from localStorage:", err);
			setNotFound(true);
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		fetchWatchlist();
	}, [fetchWatchlist]);

	const handleImageClick = () => {
		setEditModalOpen(true);
		// Open file picker after a short delay to ensure modal is open
		setTimeout(() => {
			editDialogRef.current?.openFilePicker();
		}, 300);
	};

	// Get cover image (custom or auto-generated thumbnail)
	// Always call hooks at the top level, before any early returns
	const generatedThumbnail = useWatchlistThumbnail(watchlist);
	const coverImage = watchlist?.imageUrl || generatedThumbnail;
	const itemCount = watchlist?.items.length || 0;

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
					<Button onClick={() => navigate("/local/watchlists")}>
						Retour à mes watchlists
					</Button>
				</div>
			</div>
		);
	}

	// Watchlist is guaranteed to be non-null here (after early returns)
	if (!watchlist) return null;

	return (
		<div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background">
			{/* Inline Header - Simplified for Offline */}
			<div className="relative w-full overflow-hidden">
				{/* Background Gradient */}
				<div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-background/60 to-background" />

				<div className="container relative mx-auto px-4 pt-8">
					{/* Back Button */}
					<div className="mb-8">
						<button
							type="button"
							onClick={() => navigate(-1)}
							className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-white"
						>
							<ArrowLeft className="h-4 w-4" />
							<span>{content.watchlists.back}</span>
						</button>
					</div>

					<div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
						{/* Cover Image */}
						<div className="flex-shrink-0">
							<div
								className="group relative h-56 w-56 cursor-pointer overflow-hidden rounded-lg shadow-2xl"
								onClick={handleImageClick}
							>
								{coverImage ? (
									<>
										<img
											src={coverImage}
											alt={watchlist?.name || "Watchlist"}
											className="h-full w-full object-cover"
											loading="lazy"
											decoding="async"
										/>
										{/* Hover Overlay */}
										<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
											<Pencil className="h-10 w-10 text-white" />
											<span className="mt-2 text-sm font-medium text-white">
												Sélectionner une photo
											</span>
										</div>
									</>
								) : (
									<div className="flex h-full w-full items-center justify-center bg-muted/50">
										<Film className="h-24 w-24 text-muted-foreground" />
									</div>
								)}
							</div>
						</div>

						{/* Info Section with Add Button */}
						<div className="flex flex-1 flex-col justify-between space-y-4 md:min-h-[224px]">
							{/* Empty spacer to push content down */}
							<div className="flex-1" />

							{/* Bottom section with title, description and button */}
							<div className="flex items-end justify-between gap-6">
								<div className="flex-1 space-y-4">
									<h1
										className="cursor-pointer text-4xl font-bold text-white transition-colors hover:text-primary md:text-7xl"
										onClick={() => setEditModalOpen(true)}
									>
										{watchlist?.name || ""}
									</h1>

									{watchlist?.description && (
										<p className="text-[14px] text-muted-foreground">
											{watchlist.description}
										</p>
									)}

									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<span>
											{itemCount}{" "}
											{itemCount === 1
												? content.watchlists.item
												: content.watchlists.items}
										</span>
									</div>
								</div>

								{/* Add button aligned with bottom */}
								<div className="flex-shrink-0 pb-1">
									<Button onClick={() => setAddModalOpen(true)}>
										<Plus className="h-4 w-4" />
										{content.watchlists.addItem}
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="container mx-auto mt-4 px-4 py-8">
				<WatchlistItemsTableOffline watchlist={watchlist} />
			</div>

			{/* Add Item Modal */}
			<AddItemModal
				open={addModalOpen}
				onOpenChange={setAddModalOpen}
				watchlist={watchlist}
				onSuccess={fetchWatchlist}
				offline={true}
			/>

			{/* Edit Watchlist Modal */}
			<EditWatchlistDialogOffline
				ref={editDialogRef}
				open={editModalOpen}
				onOpenChange={setEditModalOpen}
				onSuccess={fetchWatchlist}
				watchlist={watchlist}
			/>

			{/* Delete Watchlist Dialog */}
			<DeleteWatchlistDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				watchlist={watchlist}
				onSuccess={() => navigate("/local/watchlists")}
				offline={true}
			/>
		</div>
	);
}
