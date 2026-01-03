"use client";

import { ArrowLeft, Film, Pencil, Plus } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ListItemsTableOffline } from "@/components/List/ListItemsTableOffline";
import { AddItemModal } from "@/components/List/modal/AddItemModal";
import { DeleteListDialog } from "@/components/List/modal/DeleteListDialog";
import {
	EditListDialogOffline,
	type EditListDialogOfflineRef,
} from "@/components/List/modal/EditListDialogOffline";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { useListThumbnail } from "@/hooks/useListThumbnail";
import type { Watchlist } from "@/lib/api-client";
import { getLocalWatchlists } from "@/lib/localStorageHelpers";
import { useLanguageStore } from "@/store/language";

export default function LocalListDetailPage() {
	const params = useParams();
	const router = useRouter();
	const { content } = useLanguageStore();
	const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);
	const [addModalOpen, setAddModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const editDialogRef = useRef<EditListDialogOfflineRef>(null);

	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(15);

	const id = params.id as string;

	// Scroll to top when page changes
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, [currentPage]);

	const fetchWatchlist = useCallback(() => {
		if (!id) {
			router.replace("/local/lists");
			return;
		}

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
	}, [id, router]);

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
	const generatedThumbnail = useListThumbnail(watchlist);
	const coverImage = watchlist?.imageUrl || generatedThumbnail;
	const itemCount = watchlist?.items.length || 0;

	if (loading) {
		return (
			<div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 py-8">
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
			<div className="container mx-auto mb-32 w-(--sectionWidth) max-w-(--maxWidth) px-4 py-8">
				<div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
					<div className="bg-muted rounded-full p-6">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="text-muted-foreground h-16 w-16"
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
						<p className="text-muted-foreground mt-2">
							Cette watchlist n&apos;existe pas ou a été supprimée.
						</p>
					</div>
					<Button onClick={() => router.push("/local/lists")}>
						Retour à mes listes
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="from-background via-background/95 to-background mb-16 min-h-screen bg-linear-to-b">
			{/* Inline Header - Simplified for Offline */}
			<div className="relative w-full overflow-hidden">
				{/* Background Gradient */}
				<div className="via-background/60 to-background absolute inset-0 bg-linear-to-b from-purple-900/20" />

				<div className="relative container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 pt-8">
					{/* Back Button */}
					<div className="mb-8">
						<button
							type="button"
							onClick={() => router.back()}
							className="text-muted-foreground flex cursor-pointer items-center gap-2 text-sm transition-colors hover:text-white"
						>
							<ArrowLeft className="h-4 w-4" />
							<span>{content.watchlists.back}</span>
						</button>
					</div>

					<div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
						{/* Cover Image */}
						<div className="shrink-0">
							<button
								type="button"
								className="group relative h-56 w-56 overflow-hidden rounded-lg shadow-2xl"
								onClick={handleImageClick}
							>
								{coverImage ? (
									<>
										<Image
											src={coverImage}
											alt={watchlist.name}
											fill
											sizes="224px"
											className="object-cover"
											priority
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
									<div className="bg-muted/50 flex h-full w-full items-center justify-center">
										<Film className="text-muted-foreground h-24 w-24" />
									</div>
								)}
							</button>
						</div>

						{/* Info Section with Add Button */}
						<div className="flex flex-1 flex-col justify-between space-y-4 md:min-h-[224px]">
							{/* Empty spacer to push content down */}
							<div className="flex-1" />

							{/* Bottom section with title, description and button */}
							<div className="flex items-end justify-between gap-6">
								<div className="flex-1 space-y-4">
									<h1 className="text-4xl font-bold text-white md:text-7xl">
										<button
											type="button"
											onClick={() => setEditModalOpen(true)}
											className="hover:text-primary cursor-pointer text-left transition-colors"
										>
											{watchlist.name}
										</button>
									</h1>

									{watchlist.description && (
										<p className="text-muted-foreground text-[14px]">
											{watchlist.description}
										</p>
									)}

									<div className="text-muted-foreground flex items-center gap-2 text-sm">
										<span>
											{itemCount}{" "}
											{itemCount === 1
												? content.watchlists.item
												: content.watchlists.items}
										</span>
									</div>
								</div>

								{/* Add button aligned with bottom */}
								<div className="shrink-0 pb-1">
									<Button
										className="corner-squircle focus-visible:ring-offset-background cursor-pointer rounded-2xl focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
										onClick={() => setAddModalOpen(true)}
									>
										<Plus className="h-4 w-4" />
										{content.watchlists.addItem}
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="container mx-auto mt-4 w-(--sectionWidth) max-w-(--maxWidth) px-4 py-8">
				<ListItemsTableOffline
					watchlist={watchlist}
					onUpdate={fetchWatchlist}
					currentPage={currentPage}
					itemsPerPage={itemsPerPage}
				/>

				{/* Pagination component */}
				{watchlist.items.length > 0 && (
					<Pagination
						currentPage={currentPage}
						totalPages={Math.ceil(watchlist.items.length / itemsPerPage)}
						onPageChange={setCurrentPage}
						itemsPerPage={itemsPerPage}
						totalItems={watchlist.items.length}
						onItemsPerPageChange={(newItemsPerPage) => {
							setItemsPerPage(newItemsPerPage);
							setCurrentPage(1);
						}}
					/>
				)}
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
			<EditListDialogOffline
				ref={editDialogRef}
				open={editModalOpen}
				onOpenChange={setEditModalOpen}
				onSuccess={fetchWatchlist}
				watchlist={watchlist}
			/>

			{/* Delete Watchlist Dialog */}
			<DeleteListDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				watchlist={watchlist}
				onSuccess={() => router.push("/local/lists")}
				offline={true}
			/>
		</div>
	);
}
