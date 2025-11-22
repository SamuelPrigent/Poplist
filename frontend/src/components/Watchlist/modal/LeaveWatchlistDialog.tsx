import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { watchlistAPI } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";

interface LeaveWatchlistDialogProps {
	watchlistId: string;
	watchlistName: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function LeaveWatchlistDialog({
	watchlistId,
	watchlistName,
	open,
	onOpenChange,
}: LeaveWatchlistDialogProps) {
	const navigate = useNavigate();
	const { content } = useLanguageStore();
	const [isLeaving, setIsLeaving] = useState(false);

	const handleLeave = async () => {
		try {
			setIsLeaving(true);
			await watchlistAPI.leaveWatchlist(watchlistId);
			toast.success(
				content.watchlists.collaborators.leaveSuccess ||
					"Vous avez quitté la watchlist",
			);
			onOpenChange(false);
			navigate("/account/watchlists");
		} catch (error) {
			console.error("Failed to leave watchlist:", error);
			toast.error(
				error instanceof Error
					? error.message
					: content.watchlists.collaborators.leaveError ||
							"Échec de la sortie de la watchlist",
			);
		} finally {
			setIsLeaving(false);
		}
	};

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
				<Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border border-yellow-500/20 bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
					<Dialog.Close asChild>
						<button
							type="button"
							className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
							disabled={isLeaving}
						>
							<X className="h-4 w-4" />
							<span className="sr-only">Close</span>
						</button>
					</Dialog.Close>

					<Dialog.Title className="text-lg font-semibold text-yellow-500">
						{content.watchlists.collaborators.leaveTitle ||
							"Quitter la watchlist ?"}
					</Dialog.Title>

					<Dialog.Description className="mt-2 text-sm text-muted-foreground">
						{content.watchlists.collaborators.leaveDescription ||
							`Êtes-vous sûr de vouloir quitter "${watchlistName}" ? Vous perdrez vos droits de collaborateur et ne pourrez plus modifier cette watchlist.`}
					</Dialog.Description>

					<div className="mt-6 flex justify-end gap-3">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isLeaving}
						>
							{content.watchlists.cancel || "Annuler"}
						</Button>
						<Button
							onClick={handleLeave}
							disabled={isLeaving}
							className="bg-yellow-600 text-white hover:bg-yellow-700"
						>
							{isLeaving
								? content.watchlists.collaborators.leaving || "Sortie..."
								: content.watchlists.collaborators.leave || "Quitter"}
						</Button>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
