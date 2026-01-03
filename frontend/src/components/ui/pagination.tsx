"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	itemsPerPage: number;
	totalItems: number;
	onItemsPerPageChange: (items: number) => void;
}

export function Pagination({
	currentPage,
	totalPages,
	onPageChange,
	itemsPerPage,
	totalItems,
	onItemsPerPageChange,
}: PaginationProps) {
	// Build display options based on total items:
	// - <= 15: no options (hide selector)
	// - > 15 and <= 30: show 15, Tout
	// - > 30: show 15, 30, Tout
	const getDisplayOptions = () => {
		if (totalItems <= 15) return [];
		if (totalItems <= 30) return [15, totalItems];
		return [15, 30, totalItems];
	};

	const displayOptions = getDisplayOptions();
	const showItemsPerPageSelector = displayOptions.length > 0;

	return (
		<div className="flex items-center justify-between gap-4 py-4">
			{/* Items per page selector - Left */}
			{showItemsPerPageSelector ? (
				<div className="text-muted-foreground flex items-center gap-2 text-sm">
					<span>Afficher :</span>
					<div className="flex gap-1">
						{displayOptions.map((count) => (
							<button
								key={count}
								type="button"
								onClick={() => onItemsPerPageChange(count)}
								className={`cursor-pointer rounded-md px-3 py-1 transition-colors ${
									itemsPerPage === count
										? "bg-accent text-accent-foreground"
										: "hover:bg-accent/50"
								}`}
							>
								{count === totalItems ? "Tout" : count}
							</button>
						))}
					</div>
				</div>
			) : (
				<div className="w-[200px]" />
			)}

			{/* Page navigation - Center (only show if more than 1 page) */}
			{totalPages > 1 ? (
				<div className="flex items-center gap-1">
					{currentPage > 1 ? (
						<Button
							variant="outline"
							size="icon"
							onClick={() => onPageChange(currentPage - 1)}
							className="h-9 w-9 cursor-pointer"
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>
					) : (
						<div className="h-9 w-9" />
					)}

					{/* Page dropdown */}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger asChild>
							<button
								type="button"
								className="border-input bg-background hover:bg-accent hover:text-accent-foreground flex h-9 min-w-[110px] cursor-pointer items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors"
							>
								Page {currentPage} / {totalPages}
							</button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Portal>
							<DropdownMenu.Content
								className="border-border bg-background z-50 flex max-h-[300px] min-w-[120px] flex-col gap-0.5 overflow-y-auto rounded-md border p-1 shadow-md"
								sideOffset={5}
								onCloseAutoFocus={(e) => {
									// Prevent auto-focus on trigger after closing
									e.preventDefault();
								}}
							>
								{Array.from({ length: totalPages }, (_, i) => i + 1).map(
									(page) => (
										<DropdownMenu.Item
											key={page}
											className={`cursor-pointer rounded-sm px-3 py-2 text-sm transition-colors outline-none ${
												currentPage === page
													? "text-foreground bg-accent/40 font-medium"
													: "text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
											}`}
											onSelect={() => onPageChange(page)}
										>
											Page {page}
										</DropdownMenu.Item>
									),
								)}
							</DropdownMenu.Content>
						</DropdownMenu.Portal>
					</DropdownMenu.Root>

					{currentPage < totalPages ? (
						<Button
							variant="outline"
							size="icon"
							onClick={() => onPageChange(currentPage + 1)}
							className="h-9 w-9 cursor-pointer"
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
					) : (
						<div className="h-9 w-9" />
					)}
				</div>
			) : (
				<div />
			)}

			{/* Spacer for alignment */}
			<div className="w-[200px]" />
		</div>
	);
}
