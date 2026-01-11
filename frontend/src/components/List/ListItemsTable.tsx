"use client";

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
import * as AlertDialog from "@radix-ui/react-alert-dialog";
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
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { useAuth } from "@/context/auth-context";
import type { Watchlist, WatchlistItem } from "@/lib/api-client";
import { watchlistAPI } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { getLocalWatchlistsWithOwnership } from "@/lib/localStorageHelpers";
import { generateAndCacheThumbnail } from "@/lib/thumbnailGenerator";
import { getTMDBLanguage, getTMDBRegion } from "@/lib/utils";
import { useLanguageStore } from "@/store/language";
import type { Content } from "@/types/content";
import { ItemDetailsModal } from "./modal/ItemDetailsModal";
import { WatchProviderList } from "./WatchProviderBubble";

// Separate component for poster image with its own loading state
function PosterImage({ src, alt }: { src: string; alt: string }) {
	const [loaded, setLoaded] = useState(false);

	return (
		<>
			{/* Skeleton - shown while loading */}
			{!loaded && <div className="bg-muted absolute inset-0 animate-pulse" />}
			{/* Actual image */}
			<Image
				src={src}
				alt={alt}
				fill
				sizes="48px"
				className={`object-cover transition-opacity duration-200 ${
					loaded ? "opacity-100" : "opacity-0"
				}`}
				onLoad={() => setLoaded(true)}
			/>
		</>
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
			<title className="invisible">Filter</title>
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
	return (
		<BracketIcon className="h-4 w-4 rotate-90 opacity-40 transition-all duration-150" />
	);
}

interface ListItemsTableProps {
	watchlist: Watchlist;
	onUpdate: () => void;
	isOwner?: boolean;
	isCollaborator?: boolean;
	offline?: boolean;
	currentPage?: number;
	itemsPerPage?: number;
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
	onConfirmDelete: (item: WatchlistItem) => void;
	handleMoveItem: (tmdbId: string, position: "first" | "last") => void;
	totalItems: number;
	isDragDisabled: boolean;
	canEdit: boolean;
	content: Content;
	watchlists: Watchlist[];
	addingTo: string | null;
	handleAddToWatchlist: (watchlistId: string, item: WatchlistItem) => void;
	currentWatchlistId: string;
}

function DraggableRow({
	item,
	index,
	row,
	loadingItem,
	hoveredRow,
	setHoveredRow,
	onConfirmDelete,
	handleMoveItem,
	totalItems,
	isDragDisabled,
	canEdit,
	content,
	watchlists,
	addingTo,
	handleAddToWatchlist,
	currentWatchlistId,
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

	// Filter watchlists for the "add to" dropdown
	const availableWatchlists = watchlists.filter(
		(w) => w._id !== currentWatchlistId && (w.isOwner || w.isCollaborator),
	);

	return (
		<tr
			ref={setNodeRef}
			style={style}
			onMouseEnter={() => setHoveredRow(item.tmdbId)}
			onMouseLeave={() => setHoveredRow(null)}
			className={cn(
				"group transition-colors duration-150 select-none",
				!isLastRow && "border-border border-b",
				hoveredRow === item.tmdbId && "bg-muted/30",
			)}
		>
			{row.getVisibleCells().map((cell, cellIndex: number) => {
				const totalCells = row.getVisibleCells().length;
				const isActionsColumn = cellIndex === totalCells - 1;

				// Actions column (last column) - not draggable
				if (isActionsColumn) {
					return (
						<td
							key={cell.id}
							className="px-4 py-3"
							onClick={(e) => e.stopPropagation()}
						>
							<div
								className={cn(
									"flex items-center gap-1 transition-opacity",
									hoveredRow === item.tmdbId
										? "opacity-100"
										: "opacity-0 group-hover:opacity-100",
								)}
							>
								{/* Add to watchlist button */}
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
											className="hover:bg-muted cursor-pointer rounded p-2 transition-colors"
											disabled={addingTo === item.tmdbId}
											onClick={(e) => e.stopPropagation()}
											title={content.watchlists.contextMenu.addToWatchlist}
										>
											<Plus className="text-muted-foreground h-[18px] w-[18px]" />
										</button>
									</DropdownMenu.Trigger>

									<DropdownMenu.Portal>
										<DropdownMenu.Content
											className="border-border bg-popover z-50 min-w-[200px] overflow-hidden rounded-xl border p-1.5 shadow-xl"
											sideOffset={5}
										>
											<DropdownMenu.Label className="text-muted-foreground px-3 py-2 text-xs font-semibold">
												{content.watchlists.addToWatchlist}
											</DropdownMenu.Label>
											{availableWatchlists.length > 0 ? (
												availableWatchlists.map((wl) => (
													<DropdownMenu.Item
														key={wl._id}
														className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm transition-colors outline-none select-none"
														onSelect={() => handleAddToWatchlist(wl._id, item)}
														disabled={addingTo === item.tmdbId}
													>
														{wl.name}
													</DropdownMenu.Item>
												))
											) : (
												<div className="text-muted-foreground px-3 py-2.5 text-sm">
													{content.watchlists.noWatchlist}
												</div>
											)}
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
								</DropdownMenu.Root>

								{/* Delete button - only for canEdit */}
								{canEdit && (
									<button
										type="button"
										className="cursor-pointer rounded p-2 text-red-500 transition-colors hover:bg-red-500/10"
										onClick={(e) => {
											e.stopPropagation();
											onConfirmDelete(item);
										}}
										disabled={loadingItem === item.tmdbId}
										title={content.watchlists.contextMenu.removeFromWatchlist}
									>
										<Trash2 className="h-[18px] w-[18px]" />
									</button>
								)}

								{/* More options menu - only for canEdit */}
								{canEdit && (
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
												className="hover:bg-muted cursor-pointer rounded p-2 transition-colors"
												disabled={loadingItem === item.tmdbId}
												onClick={(e) => e.stopPropagation()}
											>
												<MoreVertical className="text-muted-foreground h-[18px] w-[18px]" />
											</button>
										</DropdownMenu.Trigger>

										<DropdownMenu.Portal>
											<DropdownMenu.Content
												className="border-border bg-popover z-50 min-w-[180px] overflow-hidden rounded-xl border p-1.5 shadow-xl"
												sideOffset={5}
											>
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
													<span>
														{content.watchlists.contextMenu.moveToLast}
													</span>
												</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Portal>
									</DropdownMenu.Root>
								)}
							</div>
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

export function ListItemsTable({
	watchlist,
	isOwner = true,
	isCollaborator = false,
	currentPage = 1,
	itemsPerPage,
}: ListItemsTableProps) {
	const { content, language } = useLanguageStore();
	const tmdbLanguage = getTMDBLanguage(language);
	const tmdbRegion = getTMDBRegion(language);

	// Both owners and collaborators can edit
	const canEdit = isOwner || isCollaborator;
	const { isAuthenticated } = useAuth();
	const [items, setItems] = useState<WatchlistItem[]>(watchlist.items);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [hoveredRow, setHoveredRow] = useState<string | null>(null);
	const [loadingItem, setLoadingItem] = useState<string | null>(null);
	const [detailsModalOpen, setDetailsModalOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);
	const [selectedIndex, setSelectedIndex] = useState<number>(-1);
	const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
	const [addingTo, setAddingTo] = useState<string | null>(null);
	const [itemToDelete, setItemToDelete] = useState<WatchlistItem | null>(null);

	// Sync with parent when watchlist changes
	useEffect(() => {
		setItems(watchlist.items);
	}, [watchlist.items]);

	// Fetch user watchlists if authenticated, or load from localStorage if not
	const loadWatchlists = useCallback(() => {
		if (isAuthenticated) {
			watchlistAPI
				.getMine()
				.then((data) => {
					setWatchlists(data.watchlists);
				})
				.catch(console.error);
		} else {
			const localWatchlists = getLocalWatchlistsWithOwnership();
			const ownedWatchlists = localWatchlists.filter(
				(wl) => wl.isOwner && wl._id !== watchlist._id,
			);
			setWatchlists(ownedWatchlists);
		}
	}, [isAuthenticated, watchlist._id]);

	useEffect(() => {
		loadWatchlists();
	}, [loadWatchlists]);

	// Listen for localStorage changes when not authenticated
	useEffect(() => {
		if (isAuthenticated) return;

		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === "watchlists") {
				loadWatchlists();
			}
		};

		const handleCustomStorageChange = () => {
			loadWatchlists();
		};

		window.addEventListener("storage", handleStorageChange);
		window.addEventListener(
			"localStorageWatchlistsChanged",
			handleCustomStorageChange,
		);

		return () => {
			window.removeEventListener("storage", handleStorageChange);
			window.removeEventListener(
				"localStorageWatchlistsChanged",
				handleCustomStorageChange,
			);
		};
	}, [isAuthenticated, loadWatchlists]);

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

	const formatRuntime = useCallback((minutes: number | undefined) => {
		if (!minutes) return "—";
		if (minutes < 60) return `${minutes} min`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins} min` : `${hours}h`;
	}, []);

	const handleAddToWatchlist = async (
		watchlistId: string,
		item: WatchlistItem,
	) => {
		try {
			setAddingTo(item.tmdbId);
			await watchlistAPI.addItem(watchlistId, {
				tmdbId: item.tmdbId,
				type: item.type,
				language: tmdbLanguage,
				region: tmdbRegion,
			});
		} catch (error) {
			console.error("Failed to add to watchlist:", error);
		} finally {
			setAddingTo(null);
		}
	};

	const handleRemoveItem = async (tmdbId: string) => {
		try {
			setLoadingItem(tmdbId);
			const newItems = items.filter((item) => item.tmdbId !== tmdbId);
			setItems(newItems);

			await watchlistAPI.removeItem(watchlist._id, tmdbId);

			if (!watchlist.imageUrl && newItems.length > 0) {
				const posterUrls = newItems
					.slice(0, 4)
					.map((item) => item.posterUrl)
					.filter(Boolean);
				if (posterUrls.length > 0) {
					await generateAndCacheThumbnail(watchlist._id, posterUrls);
				}
			}
		} catch (error) {
			console.error("Failed to remove item:", error);
			alert("Failed to remove item");
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

			const newItems = [...items];
			const [movedItem] = newItems.splice(itemIndex, 1);
			if (position === "first") {
				newItems.unshift(movedItem);
			} else {
				newItems.push(movedItem);
			}
			setItems(newItems);

			await watchlistAPI.moveItem(watchlist._id, tmdbId, position);

			if (!watchlist.imageUrl && newItems.length > 0) {
				const posterUrls = newItems
					.slice(0, 4)
					.map((item) => item.posterUrl)
					.filter(Boolean);
				if (posterUrls.length > 0) {
					await generateAndCacheThumbnail(watchlist._id, posterUrls);
				}
			}
		} catch (error) {
			console.error("Failed to move item:", error);
			alert("Failed to move item");
			setItems(watchlist.items);
		} finally {
			setLoadingItem(null);
		}
	};

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = items.findIndex((item) => item.tmdbId === active.id);
			const newIndex = items.findIndex((item) => item.tmdbId === over.id);

			const newItems = arrayMove(items, oldIndex, newIndex);
			setItems(newItems);

			try {
				const orderedTmdbIds = newItems.map((item) => item.tmdbId);
				await watchlistAPI.reorderItems(watchlist._id, orderedTmdbIds);

				if (!watchlist.imageUrl && newItems.length > 0) {
					const posterUrls = newItems
						.slice(0, 4)
						.map((item) => item.posterUrl)
						.filter(Boolean);
					if (posterUrls.length > 0) {
						await generateAndCacheThumbnail(watchlist._id, posterUrls);
					}
				}
			} catch (error) {
				console.error("Failed to reorder items:", error);
				setItems(items);
			}
		}
	};

	// Define columns
	const columns = useMemo<ColumnDef<WatchlistItem>[]>(
		() => [
			{
				id: "index",
				header: content.watchlists.tableHeaders.number,
				cell: (info) => info.row.index + 1,
				size: 45,
			},
			{
				accessorKey: "title",
				header: ({ column }) => {
					const isSorted = column.getIsSorted();
					return (
						<div
							onClick={() => {
								if (!isSorted) {
									column.toggleSorting(false);
								} else if (isSorted === "asc") {
									column.toggleSorting(true);
								} else {
									column.clearSorting();
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
					const rowIndex = info.row.index;
					return (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setSelectedItem(item);
								setSelectedIndex(rowIndex);
								setDetailsModalOpen(true);
							}}
							className="group/cell flex cursor-pointer items-center gap-3 text-left"
						>
							<div className="relative h-16 w-12 shrink-0 overflow-hidden rounded">
								{item.posterUrl ? (
									<>
										<PosterImage src={item.posterUrl} alt={item.title} />
										<div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover/cell:opacity-100">
											<Eye className="h-5 w-5 text-white" />
										</div>
									</>
								) : (
									<div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center">
										?
									</div>
								)}
							</div>
							<span className="font-medium text-white underline-offset-2 transition-colors group-hover/cell:underline">
								{item.title}
							</span>
						</button>
					);
				},
				size: 250,
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
									: "bg-purple-500/10 text-purple-400",
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

					const platforms: { name: string; logoPath: string }[] = Array.isArray(
						rawPlatforms,
					)
						? rawPlatforms
								.filter((p) => p !== null && p !== undefined && p !== "")
								.map((p) => {
									if (typeof p === "string") {
										return p.trim() ? { name: p, logoPath: "" } : null;
									}
									if (p && typeof p === "object" && p.name && p.name.trim()) {
										return { name: p.name, logoPath: p.logoPath || "" };
									}
									return null;
								})
								.filter(
									(p): p is { name: string; logoPath: string } => p !== null,
								)
						: [];

					return <WatchProviderList providers={platforms} maxVisible={4} />;
				},
				size: 160,
			},
			{
				id: "format",
				header: ({ column }) => {
					const isSorted = column.getIsSorted();
					return (
						<div
							onClick={() => {
								if (!isSorted) {
									column.toggleSorting(false);
								} else if (isSorted === "asc") {
									column.toggleSorting(true);
								} else {
									column.clearSorting();
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
							Format
							<SortIcon sortState={isSorted} />
						</div>
					);
				},
				accessorFn: (row) => {
					if (row.type === "tv" && row.numberOfEpisodes) {
						return row.numberOfEpisodes * 35;
					}
					return row.runtime || 0;
				},
				cell: (info) => {
					const item = info.row.original;

					if (item.type === "tv") {
						const seasons = item.numberOfSeasons;
						const episodes = item.numberOfEpisodes;
						if (seasons || episodes) {
							const parts = [];
							if (seasons) {
								parts.push(`${seasons} ${seasons > 1 ? "saisons" : "saison"}`);
							}
							if (episodes) {
								parts.push(`${episodes} ep`);
							}
							return (
								<span className="text-muted-foreground text-sm">
									{parts.join(", ")}
								</span>
							);
						}
						return <span className="text-muted-foreground text-sm">—</span>;
					}

					return (
						<span className="text-muted-foreground text-sm">
							{formatRuntime(item.runtime)}
						</span>
					);
				},
				size: 150,
			},
			{
				id: "actions",
				header: "Actions",
				cell: () => null,
				size: 120,
			},
		],
		[content, formatRuntime],
	);

	const isCustomOrder = sorting.length === 0;

	const displayItems = useMemo(() => {
		let itemsToDisplay = items;

		if (itemsPerPage !== undefined && itemsPerPage < items.length) {
			const startIndex = (currentPage - 1) * itemsPerPage;
			const endIndex = startIndex + itemsPerPage;
			itemsToDisplay = items.slice(startIndex, endIndex);
		}

		return itemsToDisplay;
	}, [items, currentPage, itemsPerPage]);

	const handleNavigatePrevious = useCallback(() => {
		if (selectedIndex > 0) {
			const prevItem = displayItems[selectedIndex - 1];
			setSelectedItem(prevItem);
			setSelectedIndex(selectedIndex - 1);
		}
	}, [selectedIndex, displayItems]);

	const handleNavigateNext = useCallback(() => {
		if (selectedIndex < displayItems.length - 1) {
			const nextItem = displayItems[selectedIndex + 1];
			setSelectedItem(nextItem);
			setSelectedIndex(selectedIndex + 1);
		}
	}, [selectedIndex, displayItems]);

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
		<>
			<div className="border-border bg-card mb-2 overflow-hidden rounded-lg border">
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
														header.getContext(),
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
								disabled={!isCustomOrder || !canEdit}
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
										onConfirmDelete={setItemToDelete}
										handleMoveItem={handleMoveItem}
										totalItems={displayItems.length}
										isDragDisabled={!isCustomOrder || !canEdit}
										canEdit={canEdit}
										content={content}
										watchlists={watchlists}
										addingTo={addingTo}
										handleAddToWatchlist={handleAddToWatchlist}
										currentWatchlistId={watchlist._id}
									/>
								))}
							</SortableContext>
						</tbody>
					</table>
				</DndContext>
			</div>

			{/* Item Details Modal */}
			{selectedItem && (
				<ItemDetailsModal
					open={detailsModalOpen}
					onOpenChange={(open) => {
						setDetailsModalOpen(open);
						if (!open) {
							setSelectedIndex(-1);
						}
					}}
					tmdbId={selectedItem.tmdbId}
					type={selectedItem.type}
					platforms={selectedItem.platformList}
					onPrevious={selectedIndex > 0 ? handleNavigatePrevious : undefined}
					onNext={
						selectedIndex < displayItems.length - 1
							? handleNavigateNext
							: undefined
					}
				/>
			)}

			{/* Delete Confirmation Modal */}
			<AlertDialog.Root
				open={!!itemToDelete}
				onOpenChange={(open: boolean) => !open && setItemToDelete(null)}
			>
				<AlertDialog.Portal>
					<AlertDialog.Overlay
						className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
						onClick={() => setItemToDelete(null)}
					/>
					<AlertDialog.Content className="border-border bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border p-6 shadow-lg">
						<AlertDialog.Title className="text-lg font-semibold">
							Confirmer la suppression
						</AlertDialog.Title>
						<AlertDialog.Description className="text-muted-foreground mt-2 text-sm">
							Voulez-vous vraiment supprimer « {itemToDelete?.title} » de cette
							watchlist ?
						</AlertDialog.Description>
						<div className="mt-6 flex justify-end gap-3">
							<AlertDialog.Cancel asChild>
								<button
									type="button"
									className="border-border hover:bg-muted cursor-pointer rounded-md border px-4 py-2 text-sm font-medium transition-colors"
								>
									Annuler
								</button>
							</AlertDialog.Cancel>
							<AlertDialog.Action asChild>
								<button
									type="button"
									className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
									onClick={() => {
										if (itemToDelete) {
											handleRemoveItem(itemToDelete.tmdbId);
											setItemToDelete(null);
										}
									}}
								>
									Supprimer
								</button>
							</AlertDialog.Action>
						</div>
					</AlertDialog.Content>
				</AlertDialog.Portal>
			</AlertDialog.Root>
		</>
	);
}
