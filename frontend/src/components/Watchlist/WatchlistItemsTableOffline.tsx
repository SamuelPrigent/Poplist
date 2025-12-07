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
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type Row,
	type RowData,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import {
	ArrowDown,
	ArrowUp,
	Eye,
	Film,
	MoreVertical,
	MoveDown,
	MoveUp,
	Plus,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import type { Watchlist, WatchlistItem } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { getLocalWatchlists } from "@/lib/localStorageHelpers";
import { deleteCachedThumbnail } from "@/lib/thumbnailGenerator";
import { useLanguageStore } from "@/store/language";
import type { Content } from "@/types/content";
import { ItemDetailsModal } from "./modal/ItemDetailsModal";
import { WatchProviderList } from "./WatchProviderBubble";

// Separate component for poster image with its own loading state
function PosterImage({ src, alt }: { src: string; alt: string }) {
	const [loaded, setLoaded] = useState(false);

	return (
		<div className="relative h-16 w-12 shrink-0 overflow-hidden rounded">
			{/* Skeleton - shown while loading */}
			{!loaded && <div className="bg-muted absolute inset-0 animate-pulse" />}
			{/* Actual image */}
			<img
				src={src}
				alt={alt}
				className={`h-full w-full object-cover transition-opacity duration-200 ${
					loaded ? "opacity-100" : "opacity-0"
				}`}
				loading="lazy"
				decoding="async"
				onLoad={() => setLoaded(true)}
			/>
		</div>
	);
}

// Bracket icon component (left/right arrows)
function BracketIcon({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			className={className}
		>
			<path
				fill="currentColor"
				d="M9.71 6.29a1 1 0 0 0-1.42 0l-5 5a1 1 0 0 0 0 1.42l5 5a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.42L5.41 12l4.3-4.29a1 1 0 0 0 0-1.42m11 5l-5-5a1 1 0 0 0-1.42 1.42l4.3 4.29l-4.3 4.29a1 1 0 0 0 0 1.42a1 1 0 0 0 1.42 0l5-5a1 1 0 0 0 0-1.42"
			/>
		</svg>
	);
}

// Sort icon component that shows bracket (neutral), arrow down (asc), or arrow up (desc)
function SortIcon({ sortState }: { sortState: false | "asc" | "desc" }) {
	if (sortState === "asc") {
		return (
			<ArrowDown className="h-4 w-4 text-green-500 transition-all duration-150" />
		);
	}
	if (sortState === "desc") {
		return (
			<ArrowUp className="h-4 w-4 text-green-500 transition-all duration-150" />
		);
	}
	// Neutral state: bracket rotated 90deg to show up/down arrows
	return (
		<BracketIcon className="h-4 w-4 rotate-90 opacity-40 transition-all duration-150" />
	);
}

interface WatchlistItemsTableProps {
	watchlist: Watchlist;
	//   onUpdate: () => void;
}

// Extend RowData for custom meta
declare module "@tanstack/react-table" {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface TableMeta<TData extends RowData> {
		updateData: (rowIndex: number, columnId: string, value: unknown) => void;
	}
}

interface DraggableRowProps {
	item: WatchlistItem;
	index: number;
	row: Row<WatchlistItem>;
	loadingItem: string | null;
	hoveredRow: string | null;
	setHoveredRow: (id: string | null) => void;
	handleRemoveItem: (tmdbId: string) => void;
	handleMoveItem: (tmdbId: string, position: "first" | "last") => void;
	handleAddToWatchlist: (tmdbId: string, targetWatchlistId: string) => void;
	otherWatchlists: Watchlist[];
	totalItems: number;
	isDragDisabled: boolean;
	canEdit: boolean;
	content: Content;
}

function DraggableRow({
	item,
	index,
	row,
	loadingItem,
	hoveredRow,
	setHoveredRow,
	handleRemoveItem,
	handleMoveItem,
	handleAddToWatchlist,
	otherWatchlists,
	totalItems,
	isDragDisabled,
	canEdit,
	content,
}: DraggableRowProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: item.tmdbId, disabled: isDragDisabled });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const isLastRow = index === totalItems - 1;

	return (
		<tr
			ref={setNodeRef}
			style={style}
			onMouseEnter={() => setHoveredRow(item.tmdbId)}
			onMouseLeave={() => setHoveredRow(null)}
			className={cn(
				"group transition-colors duration-150 select-none",
				!isLastRow && "border-border border-b",
				hoveredRow === item.tmdbId && "bg-muted/30"
			)}
		>
			{row.getVisibleCells().map((cell, cellIndex: number) => {
				const totalCells = row.getVisibleCells().length;
				const isInformationsColumn = cellIndex === totalCells - 2;
				const isActionsColumn = cellIndex === totalCells - 1;

				// Informations column (second-to-last column - not draggable)
				if (isInformationsColumn) {
					return (
						<td
							key={cell.id}
							className="px-4 py-3"
							onClick={(e) => e.stopPropagation()}
						>
							{flexRender(cell.column.columnDef.cell, cell.getContext())}
						</td>
					);
				}

				// Actions column (last column - not draggable)
				if (isActionsColumn) {
					return (
						<td
							key={cell.id}
							className="px-4 py-3"
							onClick={(e) => e.stopPropagation()}
						>
							{canEdit ? (
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
											className={cn(
												"hover:bg-muted cursor-pointer rounded p-1 transition-all focus-visible:opacity-100",
												hoveredRow === item.tmdbId
													? "opacity-100"
													: "opacity-0 group-hover:opacity-100"
											)}
											disabled={loadingItem === item.tmdbId}
											onClick={(e) => e.stopPropagation()}
										>
											<MoreVertical className="text-muted-foreground h-4 w-4" />
										</button>
									</DropdownMenu.Trigger>

									<DropdownMenu.Portal>
										<DropdownMenu.Content
											className="border-border bg-popover z-50 min-w-[220px] overflow-hidden rounded-xl border p-1.5 shadow-xl"
											sideOffset={5}
										>
											<DropdownMenu.Sub>
												<DropdownMenu.SubTrigger className="hover:bg-accent focus:bg-accent relative flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm transition-colors outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50">
													<Plus className="mr-2.5 h-4 w-4" />
													<span>
														{content.watchlists.contextMenu.addToWatchlist}
													</span>
													<span className="text-muted-foreground ml-auto text-xs">
														→
													</span>
												</DropdownMenu.SubTrigger>
												<DropdownMenu.Portal>
													<DropdownMenu.SubContent
														className="border-border bg-popover z-50 max-h-[300px] min-w-[220px] overflow-y-auto rounded-xl border p-1.5 shadow-xl"
														sideOffset={8}
													>
														{otherWatchlists.length === 0 ? (
															<div className="text-muted-foreground px-3 py-2.5 text-sm">
																Aucune autre watchlist
															</div>
														) : (
															otherWatchlists.map((wl) => (
																<DropdownMenu.Item
																	key={wl._id}
																	className="hover:bg-accent focus:bg-accent relative flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm transition-colors outline-none select-none"
																	onSelect={() =>
																		handleAddToWatchlist(item.tmdbId, wl._id)
																	}
																>
																	<span className="truncate">{wl.name}</span>
																</DropdownMenu.Item>
															))
														)}
													</DropdownMenu.SubContent>
												</DropdownMenu.Portal>
											</DropdownMenu.Sub>

											<DropdownMenu.Item
												className="relative flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm text-red-500 transition-colors outline-none select-none hover:bg-red-500/10 hover:text-red-500 focus:bg-red-500/10 focus:text-red-500 data-disabled:pointer-events-none data-disabled:opacity-50"
												onSelect={() => handleRemoveItem(item.tmdbId)}
											>
												<Trash2 className="mr-2.5 h-4 w-4" />
												<span>
													{content.watchlists.contextMenu.removeFromWatchlist}
												</span>
											</DropdownMenu.Item>

											<DropdownMenu.Separator className="bg-border my-1.5 h-px" />

											<DropdownMenu.Item
												className="hover:bg-accent focus:bg-accent relative flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm transition-colors outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50"
												onSelect={() => handleMoveItem(item.tmdbId, "first")}
												disabled={index === 0}
											>
												<MoveUp className="mr-2.5 h-4 w-4" />
												<span>
													{content.watchlists.contextMenu.moveToFirst}
												</span>
											</DropdownMenu.Item>

											<DropdownMenu.Item
												className="hover:bg-accent focus:bg-accent relative flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm transition-colors outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50"
												onSelect={() => handleMoveItem(item.tmdbId, "last")}
												disabled={index === totalItems - 1}
											>
												<MoveDown className="mr-2.5 h-4 w-4" />
												<span>{content.watchlists.contextMenu.moveToLast}</span>
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
								</DropdownMenu.Root>
							) : (
								// Watchlist not owned (imported) - simple "+" button to add to owned watchlists
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
											className={cn(
												"bg-muted/50 hover:bg-muted flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-opacity",
												hoveredRow === item.tmdbId
													? "opacity-100"
													: "opacity-0 group-hover:opacity-100"
											)}
											disabled={loadingItem === item.tmdbId}
											onClick={(e) => e.stopPropagation()}
										>
											<Plus className="h-4 w-4 text-white" />
										</button>
									</DropdownMenu.Trigger>

									<DropdownMenu.Portal>
										<DropdownMenu.Content
											className="border-border bg-popover z-50 min-w-[220px] overflow-hidden rounded-xl border p-1.5 shadow-xl"
											sideOffset={5}
										>
											<DropdownMenu.Label className="text-muted-foreground px-3 py-2 text-xs font-semibold">
												{content.watchlists.addToWatchlist}
											</DropdownMenu.Label>
											{otherWatchlists.length === 0 ? (
												<div className="text-muted-foreground px-3 py-2.5 text-sm">
													Aucune watchlist
												</div>
											) : (
												otherWatchlists.map((wl) => (
													<DropdownMenu.Item
														key={wl._id}
														className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm transition-colors outline-none select-none"
														onSelect={() =>
															handleAddToWatchlist(item.tmdbId, wl._id)
														}
														disabled={loadingItem === item.tmdbId}
													>
														{wl.name}
													</DropdownMenu.Item>
												))
											)}
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
								</DropdownMenu.Root>
							)}
						</td>
					);
				}

				// All other columns (draggable if not disabled)
				return (
					<td
						key={cell.id}
						className="px-4 py-3"
						{...(!isDragDisabled && { ...attributes, ...listeners })}
					>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</td>
				);
			})}
		</tr>
	);
}

export function WatchlistItemsTableOffline({
	watchlist,
}: WatchlistItemsTableProps) {
	const { content } = useLanguageStore();
	const [items, setItems] = useState<WatchlistItem[]>(watchlist.items);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [hoveredRow, setHoveredRow] = useState<string | null>(null);
	const [loadingItem, setLoadingItem] = useState<string | null>(null);
	const [detailsModalOpen, setDetailsModalOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);
	const [otherWatchlists, setOtherWatchlists] = useState<Watchlist[]>([]);

	// Determine if user can edit this watchlist (owned)
	const canEdit = watchlist.ownerId === "offline";

	// Sync with parent when watchlist changes
	useEffect(() => {
		setItems(watchlist.items);
	}, [watchlist.items]);

	// Load other watchlists for "Add to watchlist" feature
	const loadOtherWatchlists = useCallback(() => {
		const allWatchlists = getLocalWatchlists();
		// Filter to exclude current watchlist and only show owned offline watchlists
		const filtered = allWatchlists.filter(
			(wl) => wl._id !== watchlist._id && wl.ownerId === "offline"
		);
		setOtherWatchlists(filtered);
	}, [watchlist._id]);

	// Load watchlists on mount and when watchlist ID changes
	useEffect(() => {
		loadOtherWatchlists();
	}, [loadOtherWatchlists]);

	// Listen for localStorage changes (from other tabs or same tab)
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === "watchlists") {
				loadOtherWatchlists();
			}
		};

		// Listen for storage events from other tabs
		window.addEventListener("storage", handleStorageChange);

		// Also listen for custom events from same tab
		const handleCustomStorageChange = () => {
			loadOtherWatchlists();
		};
		window.addEventListener(
			"localStorageWatchlistsChanged",
			handleCustomStorageChange
		);

		return () => {
			window.removeEventListener("storage", handleStorageChange);
			window.removeEventListener(
				"localStorageWatchlistsChanged",
				handleCustomStorageChange
			);
		};
	}, [loadOtherWatchlists]);

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
		})
	);

	const formatRuntime = useCallback((minutes: number | undefined) => {
		if (!minutes) return "—";
		if (minutes < 60) return `${minutes} min`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins} min` : `${hours}h`;
	}, []);

	const STORAGE_KEY = "watchlists";

	const updateLocalStorage = (updatedItems: WatchlistItem[]) => {
		const localWatchlists = localStorage.getItem(STORAGE_KEY);
		if (!localWatchlists) return;

		const watchlists: Watchlist[] = JSON.parse(localWatchlists);
		const watchlistIndex = watchlists.findIndex((w) => w._id === watchlist._id);
		if (watchlistIndex === -1) return;

		watchlists[watchlistIndex].items = updatedItems;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlists));

		// Dispatch custom event for same-tab detection
		window.dispatchEvent(new Event("localStorageWatchlistsChanged"));

		// Invalidate thumbnail cache so it regenerates with new items
		deleteCachedThumbnail(watchlist._id);
	};

	const handleRemoveItem = async (tmdbId: string) => {
		try {
			setLoadingItem(tmdbId);
			// Update local state immediately
			const newItems = items.filter((item) => item.tmdbId !== tmdbId);
			setItems(newItems);
			// Update localStorage
			updateLocalStorage(newItems);
		} catch (error) {
			console.error("Failed to remove item:", error);
			alert("Failed to remove item");
			// Revert on error
			setItems(watchlist.items);
		} finally {
			setLoadingItem(null);
		}
	};

	const handleMoveItem = async (tmdbId: string, position: "first" | "last") => {
		try {
			setLoadingItem(tmdbId);
			const itemIndex = items.findIndex((item) => item.tmdbId === tmdbId);
			if (itemIndex === -1) return;

			// Update local state immediately
			const newItems = [...items];
			const [movedItem] = newItems.splice(itemIndex, 1);
			if (position === "first") {
				newItems.unshift(movedItem);
			} else {
				newItems.push(movedItem);
			}
			setItems(newItems);

			// Update localStorage
			updateLocalStorage(newItems);
		} catch (error) {
			console.error("Failed to move item:", error);
			alert("Failed to move item");
			// Revert on error
			setItems(watchlist.items);
		} finally {
			setLoadingItem(null);
		}
	};

	const handleAddToWatchlist = async (
		tmdbId: string,
		targetWatchlistId: string
	) => {
		try {
			setLoadingItem(tmdbId);

			// Find the item to add
			const itemToAdd = items.find((item) => item.tmdbId === tmdbId);
			if (!itemToAdd) return;

			// Load all watchlists from localStorage
			const localWatchlists = localStorage.getItem(STORAGE_KEY);
			if (!localWatchlists) return;

			const watchlists: Watchlist[] = JSON.parse(localWatchlists);
			const targetIndex = watchlists.findIndex(
				(w) => w._id === targetWatchlistId
			);
			if (targetIndex === -1) return;

			// Check if item already exists in target watchlist
			const itemExists = watchlists[targetIndex].items.some(
				(item) => item.tmdbId === tmdbId
			);

			if (itemExists) {
				return;
			}

			// Add item to target watchlist
			watchlists[targetIndex].items.push({
				...itemToAdd,
				addedAt: new Date().toISOString(),
			});
			watchlists[targetIndex].updatedAt = new Date().toISOString();

			// Update localStorage
			localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlists));

			// Dispatch custom event for same-tab detection
			window.dispatchEvent(new Event("localStorageWatchlistsChanged"));

			// Invalidate thumbnail cache for target watchlist
			deleteCachedThumbnail(targetWatchlistId);
		} catch (error) {
			console.error("Failed to add item to watchlist:", error);
		} finally {
			setLoadingItem(null);
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = items.findIndex((item) => item.tmdbId === active.id);
			const newIndex = items.findIndex((item) => item.tmdbId === over.id);

			const newItems = arrayMove(items, oldIndex, newIndex);
			setItems(newItems);
			updateLocalStorage(newItems);
		}
	};

	// Define columns
	const columns = useMemo<ColumnDef<WatchlistItem>[]>(
		() => [
			{
				id: "index",
				header: content.watchlists.tableHeaders.number,
				cell: (info) => info.row.index + 1,
				size: 50,
			},
			{
				accessorKey: "title",
				header: ({ column }) => {
					const isSorted = column.getIsSorted();
					return (
						<div
							onClick={() => {
								if (!isSorted) {
									column.toggleSorting(false); // asc
								} else if (isSorted === "asc") {
									column.toggleSorting(true); // desc
								} else {
									column.clearSorting(); // custom order
								}
							}}
							className="focus-visible:outline-primary flex w-full cursor-pointer items-center gap-2 transition-colors duration-150 hover:text-white focus-visible:outline-2"
							tabIndex={0}
							role="button"
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									if (!isSorted) {
										column.toggleSorting(false);
									} else if (isSorted === "asc") {
										column.toggleSorting(true);
									} else {
										column.clearSorting();
									}
								}
							}}
						>
							{content.watchlists.tableHeaders.title}
							<SortIcon sortState={isSorted} />
						</div>
					);
				},
				cell: (info) => {
					const item = info.row.original;
					return (
						<div className="flex items-center gap-3">
							{item.posterUrl ? (
								<PosterImage src={item.posterUrl} alt={item.title} />
							) : (
								<div className="bg-muted text-muted-foreground flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded">
									?
								</div>
							)}
							<span className="font-medium text-white">{item.title}</span>
						</div>
					);
				},
				size: 400,
			},
			{
				accessorKey: "type",
				header: content.watchlists.tableHeaders.type,
				cell: (info) => {
					const type = info.getValue() as "movie" | "tv";
					return (
						<span
							className={cn(
								"inline-block rounded-full px-2 py-1 text-xs font-medium",
								type === "movie"
									? "bg-blue-500/10 text-blue-400"
									: "bg-purple-500/10 text-purple-400"
							)}
						>
							{type === "movie"
								? content.watchlists.contentTypes.movie
								: content.watchlists.contentTypes.series}
						</span>
					);
				},
				size: 80,
			},
			{
				accessorKey: "platformList",
				header: content.watchlists.tableHeaders.platforms,
				cell: (info) => {
					const rawPlatforms = info.getValue() as unknown;

					// Handle both old format (string[]) and new format (Platform[])
					const platforms: { name: string; logoPath: string }[] = Array.isArray(
						rawPlatforms
					)
						? rawPlatforms
								.filter((p) => p !== null && p !== undefined && p !== "")
								.map((p) => {
									// Handle string format (old data)
									if (typeof p === "string") {
										return p.trim() ? { name: p, logoPath: "" } : null;
									}
									// Handle object format (new data)
									if (p && typeof p === "object" && p.name && p.name.trim()) {
										return { name: p.name, logoPath: p.logoPath || "" };
									}
									return null;
								})
								.filter(
									(p): p is { name: string; logoPath: string } => p !== null
								)
						: [];

					return <WatchProviderList providers={platforms} maxVisible={4} />;
				},
				size: 200,
			},
			{
				accessorKey: "runtime",
				header: ({ column }) => {
					const isSorted = column.getIsSorted();
					return (
						<div
							onClick={() => {
								if (!isSorted) {
									column.toggleSorting(false); // asc (shortest to longest)
								} else if (isSorted === "asc") {
									column.toggleSorting(true); // desc (longest to shortest)
								} else {
									column.clearSorting(); // custom order
								}
							}}
							className="focus-visible:outline-primary flex w-full cursor-pointer items-center gap-2 transition-colors duration-150 hover:text-white focus-visible:outline-2"
							tabIndex={0}
							role="button"
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									if (!isSorted) {
										column.toggleSorting(false);
									} else if (isSorted === "asc") {
										column.toggleSorting(true);
									} else {
										column.clearSorting();
									}
								}
							}}
						>
							{content.watchlists.tableHeaders.duration}
							<SortIcon sortState={isSorted} />
						</div>
					);
				},
				cell: (info) => {
					const item = info.row.original;
					const runtime = info.getValue() as number | undefined;

					// For TV shows with both runtime and episodes, show combined format
					if (item.type === "tv" && runtime && item.numberOfEpisodes) {
						return (
							<span className="text-muted-foreground text-sm">
								{formatRuntime(runtime)} · {item.numberOfEpisodes} ep
							</span>
						);
					}

					return (
						<span className="text-muted-foreground text-sm">
							{formatRuntime(runtime)}
						</span>
					);
				},
				size: 150,
			},
			{
				id: "informations",
				header: "Informations",
				cell: (info) => {
					const item = info.row.original;
					return (
						<Button
							variant="ghost"
							size="sm"
							onClick={(e) => {
								e.stopPropagation();
								setSelectedItem(item);
								setDetailsModalOpen(true);
							}}
							className="h-8 cursor-pointer gap-1.5 px-3 text-xs"
						>
							<Eye className="h-3 w-3" />
							{content.watchlists.preview}
						</Button>
					);
				},
				size: 120,
			},
			{
				id: "actions",
				header: "",
				cell: () => null,
				size: 80,
			},
		],
		[content, formatRuntime]
	);

	// Determine if we're in custom order mode (no sorting)
	const isCustomOrder = sorting.length === 0;

	// Use sorted items if sorting is active, otherwise use local state
	const displayItems = useMemo(() => {
		if (!isCustomOrder) {
			return items;
		}
		return items;
	}, [items, isCustomOrder]);

	const table = useReactTable({
		data: displayItems,
		columns,
		state: {
			sorting,
		},
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	if (items.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Film className="text-muted-foreground h-8 w-8" />
					</EmptyMedia>
					<EmptyTitle>{content.watchlists.noItemsYet}</EmptyTitle>
					<EmptyDescription>
						{content.watchlists.noItemsDescription}
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<div className="border-border bg-card mb-32 overflow-hidden rounded-lg border">
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<table className="w-full">
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr
								key={headerGroup.id}
								className="border-border border-b"
								style={{ backgroundColor: "rgb(51 59 70 / 27%)" }}
							>
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										className="text-muted-foreground px-4 py-4 text-left text-sm font-semibold transition-colors duration-150 select-none"
										style={{ width: header.column.getSize() }}
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody>
						<SortableContext
							items={displayItems.map((item) => item.tmdbId)}
							strategy={verticalListSortingStrategy}
							disabled={!isCustomOrder}
						>
							{table.getRowModel().rows.map((row, index) => (
								<DraggableRow
									key={row.original.tmdbId}
									item={row.original}
									index={index}
									row={row}
									loadingItem={loadingItem}
									hoveredRow={hoveredRow}
									setHoveredRow={setHoveredRow}
									handleRemoveItem={handleRemoveItem}
									handleMoveItem={handleMoveItem}
									handleAddToWatchlist={handleAddToWatchlist}
									otherWatchlists={otherWatchlists}
									totalItems={displayItems.length}
									isDragDisabled={!isCustomOrder}
									canEdit={canEdit}
									content={content}
								/>
							))}
						</SortableContext>
					</tbody>
				</table>
			</DndContext>

			{/* Item Details Modal */}
			{selectedItem && (
				<ItemDetailsModal
					open={detailsModalOpen}
					onOpenChange={setDetailsModalOpen}
					tmdbId={selectedItem.tmdbId}
					type={selectedItem.type}
					platforms={selectedItem.platformList}
				/>
			)}
		</div>
	);
}
