import { Check, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { type Collaborator, watchlistAPI } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface AddCollaboratorPopoverProps {
	watchlistId: string;
	collaborators: Collaborator[];
	onCollaboratorAdded: () => void;
	onCollaboratorRemoved: () => void;
	children: React.ReactNode;
}

type ValidationState = "idle" | "checking" | "valid" | "invalid" | "error";

export function AddCollaboratorPopover({
	watchlistId,
	collaborators,
	onCollaboratorAdded,
	onCollaboratorRemoved,
	children,
}: AddCollaboratorPopoverProps) {
	const { content } = useLanguageStore();
	const [open, setOpen] = useState(false);
	const [username, setUsername] = useState("");
	const [validationState, setValidationState] =
		useState<ValidationState>("idle");
	const [isAdding, setIsAdding] = useState(false);

	// Debounced username validation
	useEffect(() => {
		if (username.length === 0) {
			setValidationState("idle");
			return;
		}

		if (username.length < 3) {
			setValidationState("invalid");
			return;
		}

		setValidationState("checking");

		const timeoutId = setTimeout(async () => {
			try {
				const response = await fetch(
					`${API_URL}/auth/username/check/${encodeURIComponent(username)}`
				);
				const data = await response.json();

				// For collaborator adding: username EXISTS (available=false) is VALID
				// Opposite of signup flow where available=true is valid
				if (response.ok && !data.available) {
					setValidationState("valid");
				} else {
					setValidationState("invalid");
				}
			} catch (error) {
				console.error("Username check error:", error);
				setValidationState("error");
			}
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [username]);

	const handleAddCollaborator = async () => {
		if (validationState !== "valid" || !username.trim()) return;

		try {
			setIsAdding(true);
			await watchlistAPI.addCollaborator(watchlistId, username.trim());
			toast.success(
				content.watchlists.collaborators.addSuccess ||
					`${username} ajouté comme collaborateur`
			);
			setUsername("");
			setValidationState("idle");
			onCollaboratorAdded();
		} catch (error) {
			console.error("Failed to add collaborator:", error);
			toast.error(
				error instanceof Error
					? error.message
					: content.watchlists.collaborators.addError ||
							"Échec de l'ajout du collaborateur"
			);
		} finally {
			setIsAdding(false);
		}
	};

	const handleRemoveCollaborator = async (
		collaboratorId: string,
		collaboratorUsername: string
	) => {
		try {
			await watchlistAPI.removeCollaborator(watchlistId, collaboratorId);
			toast.success(
				content.watchlists.collaborators.removeSuccess ||
					`${collaboratorUsername} retiré`
			);
			onCollaboratorRemoved();
		} catch (error) {
			console.error("Failed to remove collaborator:", error);
			toast.error(
				error instanceof Error
					? error.message
					: content.watchlists.collaborators.removeError ||
							"Échec de la suppression du collaborateur"
			);
		}
	};

	const getValidationIcon = () => {
		switch (validationState) {
			case "checking":
				return (
					<div className="border-muted-foreground h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
				);
			case "valid":
				return <Check className="h-5 w-5 text-green-500" />;
			case "invalid":
			case "error":
				return <X className="h-5 w-5 text-red-500" />;
			default:
				return null;
		}
	};

	const isAddButtonDisabled =
		validationState !== "valid" || isAdding || !username.trim();

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent className="w-80 p-4" align="start">
				<div className="space-y-4">
					<div>
						<h3 className="mb-2 text-sm font-semibold">
							{content.watchlists.collaborators.addTitle ||
								"Ajouter un collaborateur"}
						</h3>
						<p className="text-muted-foreground mb-3 text-xs">
							{content.watchlists.collaborators.addDescription ||
								"Entrez le nom d'utilisateur de la personne à ajouter"}
						</p>

						<div className="relative">
							<Input
								placeholder={
									content.watchlists.collaborators.usernamePlaceholder ||
									"Nom d'utilisateur"
								}
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !isAddButtonDisabled) {
										handleAddCollaborator();
									}
								}}
								className="pr-10"
								disabled={isAdding}
							/>
							<div className="absolute top-1/2 right-3 -translate-y-1/2">
								{getValidationIcon()}
							</div>
						</div>

						<Button
							onClick={handleAddCollaborator}
							disabled={isAddButtonDisabled}
							className="mt-2 w-full cursor-pointer"
							size="sm"
						>
							{isAdding
								? content.watchlists.collaborators.adding || "Ajout..."
								: content.watchlists.collaborators.add || "Ajouter"}
						</Button>
					</div>

					{collaborators.length > 0 && (
						<div className="border-t pt-3">
							<h4 className="text-muted-foreground mb-2 text-xs font-semibold">
								{content.watchlists.collaborators.currentTitle ||
									"Collaborateurs actuels"}
							</h4>
							<div className="space-y-1">
								{collaborators.map((collaborator) => (
									<div
										key={collaborator._id}
										className="bg-muted/50 flex items-center justify-between rounded-md p-2 text-sm"
									>
										<div className="flex items-center gap-2">
											<div className="bg-muted flex h-7 w-7 items-center justify-center rounded-full">
												<User className="text-muted-foreground h-4 w-4" />
											</div>
											<span className="font-medium">
												{collaborator.username}
											</span>
										</div>
										<button
											type="button"
											onClick={() =>
												handleRemoveCollaborator(
													collaborator._id,
													collaborator.username
												)
											}
											className="text-muted-foreground cursor-pointer rounded transition-colors hover:text-red-500"
											title={
												content.watchlists.collaborators.remove || "Retirer"
											}
										>
											<X className="h-4 w-4" />
										</button>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
