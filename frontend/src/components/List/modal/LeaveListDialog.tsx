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
					"Vous avez quitté la watchlist"
			);
			onOpenChange(false);
			navigate("/account/watchlists");
		} catch (error) {
			console.error("Failed to leave watchlist:", error);
			toast.error(
				error instanceof Error
					? error.message
					: content.watchlists.collaborators.leaveError ||
							"Échec de la sortie de la watchlist"
			);
		} finally {
			setIsLeaving(false);
		}
	};

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
				<Dialog.Content className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border border-yellow-500/20 p-6 shadow-lg duration-200">
					<Dialog.Close asChild>
						<button
							type="button"
							className="focus-visible:ring-offset-background absolute top-4 right-4 cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none"
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

					<Dialog.Description className="text-muted-foreground mt-2 text-sm">
						{content.watchlists.collaborators.leaveDescription ||
							`Êtes-vous sûr de vouloir quitter "${watchlistName}" ? Vous perdrez vos droits de collaborateur et ne pourrez plus modifier cette watchlist.`}
					</Dialog.Description>

					<div className="mt-6 flex justify-end gap-3">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isLeaving}
							className="focus-visible:ring-offset-background cursor-pointer focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-white"
						>
							{content.watchlists.cancel || "Annuler"}
						</Button>
						<Button
							onClick={handleLeave}
							disabled={isLeaving}
							className="focus-visible:ring-offset-background cursor-pointer bg-yellow-600 text-white hover:bg-yellow-700 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
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
