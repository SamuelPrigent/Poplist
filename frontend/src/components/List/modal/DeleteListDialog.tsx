"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { type Watchlist, watchlistAPI } from "@/lib/api-client";
import { deleteCachedThumbnail } from "@/lib/thumbnailGenerator";
import { useLanguageStore } from "@/store/language";

interface DeleteListDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
	watchlist: Watchlist;
	offline?: boolean;
}

export function DeleteListDialog({
	open,
	onOpenChange,
	onSuccess,
	watchlist,
	offline = false,
}: DeleteListDialogProps) {
	const { content } = useLanguageStore();
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleDelete = async () => {
		setLoading(true);
		setError(null);

		try {
			if (offline) {
				// Offline mode: delete from localStorage
				const watchlists = JSON.parse(
					localStorage.getItem("watchlists") || "[]",
				);
				const filtered = watchlists.filter(
					(w: Watchlist) => w.id !== watchlist.id,
				);
				localStorage.setItem("watchlists", JSON.stringify(filtered));

				// Delete cached thumbnail
				deleteCachedThumbnail(watchlist.id);

				onOpenChange(false);
				if (onSuccess) {
					onSuccess();
				} else {
					// If no onSuccess callback, navigate back to lists page
					router.push("/local/lists");
				}
			} else {
				// Online mode: delete via API
				await watchlistAPI.delete(watchlist.id);

				onOpenChange(false);
				if (onSuccess) {
					onSuccess();
				} else {
					// If no onSuccess callback, navigate back to lists page
					router.push("/account/lists");
				}
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to delete watchlist",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		setError(null);
		onOpenChange(false);
	};

	return (
		<DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80" />
				<DialogPrimitive.Content className="border-border bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg">
					<div className="flex flex-col space-y-3">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
								<AlertTriangle className="h-5 w-5 text-red-500" />
							</div>
							<DialogPrimitive.Title className="text-lg font-semibold">
								{content.watchlists.deleteWatchlist}
							</DialogPrimitive.Title>
						</div>

						<DialogPrimitive.Description className="text-muted-foreground text-sm">
							{content.watchlists.deleteWatchlistConfirm.replace(
								"{name}",
								watchlist.name,
							)}
						</DialogPrimitive.Description>

						{/* Error Message */}
						{error && (
							<div className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500">
								{error}
							</div>
						)}
					</div>

					{/* Actions */}
					<div className="flex justify-end gap-2 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={handleCancel}
							disabled={loading}
							className="focus-visible:ring-offset-background cursor-pointer focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-white"
						>
							{content.watchlists.cancel}
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={handleDelete}
							disabled={loading}
							className="focus-visible:ring-offset-background cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
						>
							{loading
								? content.watchlists.deleting
								: content.watchlists.delete}
						</Button>
					</div>

					<DialogPrimitive.Close className="data-[state=open]:bg-secondary absolute top-4 right-4 cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none">
						<X className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</DialogPrimitive.Close>
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}
