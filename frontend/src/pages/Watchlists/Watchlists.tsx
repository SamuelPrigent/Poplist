import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	rectSortingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Film } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { CreateWatchlistDialog } from "@/components/Watchlist/modal/CreateWatchlistDialog";
import { DeleteWatchlistDialog } from "@/components/Watchlist/modal/DeleteWatchlistDialog";
import { EditWatchlistDialog } from "@/components/Watchlist/modal/EditWatchlistDialog";
import { WatchlistCard } from "@/components/Watchlist/WatchlistCard";
import type { Watchlist } from "@/lib/api-client";
import { watchlistAPI } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";
import { useWatchlistFiltersStore } from "@/store/watchlistFilters";

interface SortableWatchlistCardProps {
	watchlist: Watchlist;
	onEdit: (watchlist: Watchlist) => void;
	onDelete: (watchlist: Watchlist) => void;
}

function SortableWatchlistCard({
	watchlist,
	onEdit,
	onDelete,
}: SortableWatchlistCardProps) {
	const { content } = useLanguageStore();

	// Use isOwner flag from backend
	const isOwner = watchlist.isOwner ?? false;

	// Enable drag for all watchlists (each user has their own watchlistsOrder)
	const isDraggable = true;

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: watchlist._id,
		disabled: !isDraggable,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<WatchlistCard
			watchlist={watchlist}
			content={content}
			href={`/account/watchlist/${watchlist._id}`}
			onEdit={isOwner ? onEdit : undefined}
			onDelete={isOwner ? onDelete : undefined}
			showMenu={isOwner}
			showVisibility={true}
			showSavedBadge={
				!isOwner && !watchlist.isCollaborator && watchlist.isSaved
			}
			showCollaborativeBadge={watchlist.isCollaborator === true}
			draggableProps={{
				ref: setNodeRef,
				style,
				attributes,
				listeners: isDraggable ? listeners : {},
			}}
		/>
	);
}

export function Watchlists() {
	const { content } = useLanguageStore();
	const { showOwned, showSaved, toggleOwned, toggleSaved } =
		useWatchlistFiltersStore();
	const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(
		null,
	);

	// Setup drag sensors
	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 200,
				tolerance: 6,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const fetchWatchlists = useCallback(async () => {
		try {
			setLoading(true);
			const data = await watchlistAPI.getMine();
			//   console.log(
			//     "📦 [Watchlists.tsx] Watchlists received from backend:",
			//     data.watchlists.map((w) => ({
			//       name: w.name,
			//       isOwner: w.isOwner,
			//       isCollaborator: w.isCollaborator,
			//       isSaved: w.isSaved,
			//     })),
			//   );
			setWatchlists(data.watchlists);
		} catch (error) {
			console.error("Failed to fetch watchlists:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = watchlists.findIndex((w) => w._id === active.id);
			const newIndex = watchlists.findIndex((w) => w._id === over.id);

			const newWatchlists = arrayMove(watchlists, oldIndex, newIndex);
			setWatchlists(newWatchlists);

			// Persist to backend
			try {
				const orderedWatchlistIds = newWatchlists.map((w) => w._id);
				await watchlistAPI.reorderWatchlists(orderedWatchlistIds);
			} catch (error) {
				console.error("Failed to reorder watchlists:", error);
				// Revert on error
				setWatchlists(watchlists);
			}
		}
	};

	useEffect(() => {
		fetchWatchlists();
	}, [fetchWatchlists]);

	const handleCreateSuccess = async (newWatchlist?: Watchlist) => {
		if (newWatchlist) {
			// Fetch updated watchlists
			await fetchWatchlists();

			// After fetch, reorder to put new watchlist first
			setWatchlists((currentWatchlists) => {
				const withoutNew = currentWatchlists.filter(
					(w) => w._id !== newWatchlist._id,
				);
				const reordered = [newWatchlist, ...withoutNew];

				// Persist new order to backend
				const orderedWatchlistIds = reordered.map((w) => w._id);
				watchlistAPI.reorderWatchlists(orderedWatchlistIds).catch((error) => {
					console.error("Failed to reorder watchlists:", error);
				});

				return reordered;
			});
		} else {
			fetchWatchlists();
		}
	};

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<h1 className="mb-10 text-3xl font-bold text-white">
					{content.watchlists.title}
				</h1>
				<div className="flex items-center justify-center py-12">
					<div className="text-muted-foreground">
						{content.watchlists.loading}
					</div>
				</div>
			</div>
		);
	}

	// Filter watchlists based on selected filters
	const filteredWatchlists = watchlists.filter((watchlist) => {
		// Use flags from backend
		const isOwner = watchlist.isOwner ?? false;
		const isCollaborator = watchlist.isCollaborator ?? false;
		const isSaved = watchlist.isSaved ?? false;

		// "Mes watchlists" filter: show owned watchlists AND collaborative watchlists
		if (showOwned && (isOwner || isCollaborator)) {
			//   console.log(
			//     `✅ [Filter] "${watchlist.name}" shown in "Mes watchlists" (isOwner=${isOwner}, isCollaborator=${isCollaborator})`,
			//   );
			return true;
		}

		// "Suivies" filter: show followed watchlists (not owned, not collaborative)
		if (showSaved && isSaved && !isOwner && !isCollaborator) {
			//   console.log(
			//     `✅ [Filter] "${watchlist.name}" shown in "Suivies" (isSaved=${isSaved})`,
			//   );
			return true;
		}

		// console.log(
		//   `❌ [Filter] "${watchlist.name}" filtered out (isOwner=${isOwner}, isCollaborator=${isCollaborator}, isSaved=${isSaved}, showOwned=${showOwned}, showSaved=${showSaved})`,
		// );
		return false;
	});

	return (
		<div className="container mx-auto mb-32 px-4 py-8">
			{/* Title */}
			<div className="mb-6 mt-5">
				<h1 className="mb-1 text-3xl font-bold text-white">
					{content.watchlists.title}
				</h1>
				<div className="text-muted-foreground">
					{content.home.library.subtitle}
				</div>
			</div>

			{/* Filters and Create Button */}
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={toggleOwned}
						className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
							showOwned
								? "bg-primary text-primary-foreground"
								: "bg-muted text-muted-foreground hover:bg-muted/80"
						}`}
					>
						{content.watchlists.myWatchlists || "Mes watchlists"}
					</button>
					<button
						type="button"
						onClick={toggleSaved}
						className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
							showSaved
								? "bg-primary text-primary-foreground"
								: "bg-muted text-muted-foreground hover:bg-muted/80"
						}`}
					>
						{content.watchlists.followed || "Suivies"}
					</button>
				</div>

				<Button onClick={() => setDialogOpen(true)}>
					{/* <Plus className="h-4 w-4" /> */}
					{content.watchlists.createWatchlist}
				</Button>
			</div>

			<CreateWatchlistDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onSuccess={handleCreateSuccess}
			/>

			{selectedWatchlist && (
				<>
					<EditWatchlistDialog
						open={editDialogOpen}
						onOpenChange={setEditDialogOpen}
						onSuccess={fetchWatchlists}
						watchlist={selectedWatchlist}
					/>
					<DeleteWatchlistDialog
						open={deleteDialogOpen}
						onOpenChange={setDeleteDialogOpen}
						onSuccess={fetchWatchlists}
						watchlist={selectedWatchlist}
					/>
				</>
			)}

			{filteredWatchlists.length === 0 ? (
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Film className="h-8 w-8 text-muted-foreground" />
						</EmptyMedia>
						<EmptyTitle>
							{watchlists.length === 0
								? content.watchlists.noWatchlists
								: content.watchlists.noWatchlistsInCategory ||
									"Aucune watchlist dans cette catégorie"}
						</EmptyTitle>
						<EmptyDescription>
							{watchlists.length === 0
								? content.watchlists.createWatchlistDescription
								: content.watchlists.adjustFilters ||
									"Ajustez les filtres pour voir plus de watchlists"}
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
				>
					<SortableContext
						items={filteredWatchlists.map((w) => w._id)}
						strategy={rectSortingStrategy}
					>
						<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
							{filteredWatchlists.map((watchlist) => (
								<SortableWatchlistCard
									key={watchlist._id}
									watchlist={watchlist}
									onEdit={(wl) => {
										setSelectedWatchlist(wl);
										setEditDialogOpen(true);
									}}
									onDelete={(wl) => {
										setSelectedWatchlist(wl);
										setDeleteDialogOpen(true);
									}}
								/>
							))}
						</div>
					</SortableContext>
				</DndContext>
			)}
		</div>
	);
}
