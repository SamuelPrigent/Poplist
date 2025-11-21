import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { type Watchlist, watchlistAPI } from "@/lib/api-client";
import { deleteCachedThumbnail } from "@/lib/thumbnailGenerator";
import { useLanguageStore } from "@/store/language";

interface DeleteWatchlistDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
	watchlist: Watchlist;
	offline?: boolean;
}

export function DeleteWatchlistDialog({
	open,
	onOpenChange,
	onSuccess,
	watchlist,
	offline = false,
}: DeleteWatchlistDialogProps) {
	const { content } = useLanguageStore();
	const navigate = useNavigate();
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
					(w: Watchlist) => w._id !== watchlist._id,
				);
				localStorage.setItem("watchlists", JSON.stringify(filtered));

				// Delete cached thumbnail
				deleteCachedThumbnail(watchlist._id);

				onOpenChange(false);
				if (onSuccess) {
					onSuccess();
				} else {
					// If no onSuccess callback, navigate back to watchlists page
					navigate("/local/watchlists");
				}
			} else {
				// Online mode: delete via API
				await watchlistAPI.delete(watchlist._id);

				onOpenChange(false);
				if (onSuccess) {
					onSuccess();
				} else {
					// If no onSuccess callback, navigate back to watchlists page
					navigate("/account/watchlists");
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
				<DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
				<DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
					<div className="flex flex-col space-y-3">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
								<AlertTriangle className="h-5 w-5 text-red-500" />
							</div>
							<DialogPrimitive.Title className="text-lg font-semibold">
								{content.watchlists.deleteWatchlist}
							</DialogPrimitive.Title>
						</div>

						<DialogPrimitive.Description className="text-sm text-muted-foreground">
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
						>
							{content.watchlists.cancel}
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={handleDelete}
							disabled={loading}
						>
							{loading
								? content.watchlists.deleting
								: content.watchlists.delete}
						</Button>
					</div>

					<DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none data-[state=open]:bg-secondary">
						<X className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</DialogPrimitive.Close>
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}
