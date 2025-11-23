import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
	AlertTriangle,
	Check,
	Loader2,
	Trash2,
	Upload,
	User,
	X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { userAPI } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";

export function Account() {
	const { user, updateUsername, changePassword, deleteAccount, refetch } =
		useAuth();
	const { toast } = useToast();
	const { content } = useLanguageStore();
	const navigate = useNavigate();

	// Username state
	const [username, setUsername] = useState(user?.username || "");
	const [usernameLoading, setUsernameLoading] = useState(false);
	const [usernameCheckError, setUsernameCheckError] = useState<string | null>(
		null
	);
	const [usernameChecking, setUsernameChecking] = useState(false);

	// Password state
	const [oldPassword, setOldPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [passwordLoading, setPasswordLoading] = useState(false);

	// Delete account state
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteConfirmation, setDeleteConfirmation] = useState("");
	const [deleteLoading, setDeleteLoading] = useState(false);

	// Avatar state
	const [avatarUploading, setAvatarUploading] = useState(false);
	const [avatarDeleting, setAvatarDeleting] = useState(false);

	// Username availability check with debounce
	const checkUsernameAvailability = useCallback(
		async (usernameToCheck: string) => {
			// Skip check if username is same as current
			if (usernameToCheck === user?.username) {
				setUsernameCheckError(null);
				return;
			}

			// Validate format first
			if (usernameToCheck.length < 3 || usernameToCheck.length > 20) {
				setUsernameCheckError(
					content.profile.usernameSection.validation.lengthError
				);
				return;
			}

			if (!/^[a-zA-Z0-9_]+$/.test(usernameToCheck)) {
				setUsernameCheckError(
					content.profile.usernameSection.validation.formatError
				);
				return;
			}

			setUsernameChecking(true);
			try {
				const response = await fetch(
					`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/auth/username/check/${usernameToCheck}`
				);
				const data = await response.json();

				if (!data.available) {
					setUsernameCheckError(
						content.profile.usernameSection.validation.alreadyTaken
					);
				} else {
					setUsernameCheckError(null);
				}
			} catch (error) {
				console.error("Failed to check username availability:", error);
				setUsernameCheckError(null); // Don't block on network error
			} finally {
				setUsernameChecking(false);
			}
		},
		[user?.username, content]
	);

	// Debounced username check
	useEffect(() => {
		if (!username || username === user?.username) {
			setUsernameCheckError(null);
			return;
		}

		const timer = setTimeout(() => {
			checkUsernameAvailability(username);
		}, 300);

		return () => clearTimeout(timer);
	}, [username, user?.username, checkUsernameAvailability]);

	const handleUpdateUsername = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!username.trim()) return;

		setUsernameLoading(true);
		try {
			await updateUsername(username);
			toast({
				title: content.profile.toasts.usernameUpdated,
				description: content.profile.toasts.usernameUpdatedDesc,
			});
		} catch (error) {
			toast({
				title: content.profile.toasts.error,
				description:
					error instanceof Error
						? error.message
						: content.profile.toasts.updateFailed,
				variant: "destructive",
			});
		} finally {
			setUsernameLoading(false);
		}
	};

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();

		if (newPassword !== confirmPassword) {
			toast({
				title: content.profile.toasts.error,
				description: content.profile.toasts.passwordMismatch,
				variant: "destructive",
			});
			return;
		}

		setPasswordLoading(true);
		try {
			await changePassword(oldPassword, newPassword);
			toast({
				title: content.profile.toasts.passwordChanged,
				description: content.profile.toasts.passwordChangedDesc,
			});
			setOldPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (error) {
			toast({
				title: content.profile.toasts.error,
				description:
					error instanceof Error
						? error.message
						: content.profile.toasts.passwordChangeFailed,
				variant: "destructive",
			});
		} finally {
			setPasswordLoading(false);
		}
	};

	const handleDeleteAccount = async () => {
		setDeleteLoading(true);
		try {
			await deleteAccount(deleteConfirmation);
			toast({
				title: content.profile.toasts.accountDeleted,
				description: content.profile.toasts.accountDeletedDesc,
			});
			setDeleteDialogOpen(false);
			navigate("/");
		} catch (error) {
			toast({
				title: content.profile.toasts.error,
				description:
					error instanceof Error
						? error.message
						: content.profile.toasts.accountDeleteFailed,
				variant: "destructive",
			});
		} finally {
			setDeleteLoading(false);
		}
	};

	const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			toast({
				title: content.profile.toasts.error,
				description: content.profile.avatarSection.validation.invalidFileType,
				variant: "destructive",
			});
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast({
				title: content.profile.toasts.error,
				description: content.profile.avatarSection.validation.fileTooLarge,
				variant: "destructive",
			});
			return;
		}

		setAvatarUploading(true);
		try {
			// Convert to base64
			const reader = new FileReader();
			reader.onloadend = async () => {
				try {
					const base64String = reader.result as string;
					await userAPI.uploadAvatar(base64String);

					// Refresh user data to get the new avatar URL
					await refetch();

					toast({
						title: content.profile.avatarSection.toasts.updated,
						description: content.profile.avatarSection.toasts.updatedDesc,
					});
				} catch (error) {
					toast({
						title: content.profile.toasts.error,
						description:
							error instanceof Error
								? error.message
								: content.profile.avatarSection.validation.uploadFailed,
						variant: "destructive",
					});
				} finally {
					setAvatarUploading(false);
				}
			};
			reader.readAsDataURL(file);
		} catch (error) {
			toast({
				title: content.profile.toasts.error,
				description: content.profile.avatarSection.validation.readFailed,
				variant: "destructive",
			});
			setAvatarUploading(false);
			return error;
		}
	};

	const handleAvatarDelete = async () => {
		setAvatarDeleting(true);
		try {
			await userAPI.deleteAvatar();

			// Refresh user data to remove the avatar URL
			await refetch();

			toast({
				title: content.profile.avatarSection.toasts.deleted,
				description: content.profile.avatarSection.toasts.deletedDesc,
			});
		} catch (error) {
			toast({
				title: content.profile.toasts.error,
				description:
					error instanceof Error
						? error.message
						: content.profile.avatarSection.validation.deleteFailed,
				variant: "destructive",
			});
		} finally {
			setAvatarDeleting(false);
		}
	};

	return (
		<div className="container mx-auto mt-6 mb-28 px-4 py-8">
			<div className="mx-auto max-w-2xl space-y-6">
				<div>
					<h1 className="text-3xl font-bold">{content.profile.title}</h1>
					<p className="text-muted-foreground mt-2">
						{content.profile.subtitle}
					</p>
				</div>

				{/* Avatar Section */}
				<Card>
					<CardContent className="pt-6">
						<div className="space-y-4">
							<div>
								<h3 className="font-semibold">
									{content.profile.avatarSection.title}
								</h3>
								<p className="text-muted-foreground mt-1 text-sm">
									{content.profile.avatarSection.description}
								</p>
							</div>

							<div className="flex items-center gap-6">
								{/* Avatar Display */}
								<div className="relative">
									{user?.avatarUrl ? (
										<img
											src={user.avatarUrl}
											alt={user.username}
											className="h-24 w-24 rounded-full object-cover"
										/>
									) : (
										<div className="bg-muted flex h-24 w-24 items-center justify-center rounded-full">
											<User className="text-muted-foreground h-12 w-12" />
										</div>
									)}
								</div>

								{/* Avatar Actions */}
								<div className="flex flex-col gap-2">
									<div className="flex gap-2">
										<label htmlFor="avatar-upload">
											<input
												id="avatar-upload"
												type="file"
												accept="image/*"
												className="hidden"
												onChange={handleAvatarUpload}
												disabled={avatarUploading || avatarDeleting}
											/>
											<Button
												type="button"
												variant="outline"
												disabled={avatarUploading || avatarDeleting}
												onClick={() =>
													document.getElementById("avatar-upload")?.click()
												}
											>
												{avatarUploading ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														{content.profile.avatarSection.uploading}
													</>
												) : (
													<>
														<Upload className="mr-2 h-4 w-4" />
														{user?.avatarUrl
															? content.profile.avatarSection.changeButton
															: content.profile.avatarSection.uploadButton}
													</>
												)}
											</Button>
										</label>

										{user?.avatarUrl && (
											<Button
												type="button"
												variant="outline"
												disabled={avatarUploading || avatarDeleting}
												onClick={handleAvatarDelete}
											>
												{avatarDeleting ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														{content.profile.avatarSection.deleting}
													</>
												) : (
													<>
														<Trash2 className="mr-2 h-4 w-4" />
														{content.profile.avatarSection.deleteButton}
													</>
												)}
											</Button>
										)}
									</div>
									<p className="text-muted-foreground text-xs">
										{content.profile.avatarSection.hint}
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Username Section */}
				<Card>
					<CardContent className="pt-6">
						<form onSubmit={handleUpdateUsername} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="username">
									{content.profile.usernameSection.label}
								</Label>
								<div className="relative">
									<Input
										autoComplete="name"
										id="username"
										type="text"
										value={username}
										onChange={(e) => setUsername(e.target.value)}
										placeholder={content.profile.usernameSection.placeholder}
										minLength={3}
										maxLength={20}
										pattern="[a-zA-Z0-9_]+"
										title="Username can only contain letters, numbers, and underscores"
										className={usernameCheckError ? "border-red-500" : ""}
									/>
									{username && username !== user?.username && (
										<div className="absolute top-1/2 right-3 -translate-y-1/2">
											{usernameChecking ? (
												<Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
											) : usernameCheckError ? (
												<X className="h-4 w-4 text-red-500" />
											) : (
												<Check className="h-4 w-4 text-green-500" />
											)}
										</div>
									)}
								</div>
								{usernameCheckError && (
									<p className="text-sm text-red-500">{usernameCheckError}</p>
								)}
							</div>
							<Button
								type="submit"
								disabled={
									usernameLoading ||
									usernameChecking ||
									!username.trim() ||
									username === user?.username ||
									!!usernameCheckError
								}
							>
								{usernameLoading && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								{content.profile.usernameSection.updateButton}
							</Button>
						</form>
					</CardContent>
				</Card>

				{/* Password Section - Only show if user has password */}
				{user?.hasPassword && (
					<Card>
						<CardContent className="pt-6">
							<form onSubmit={handleChangePassword} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="oldPassword">
										{content.profile.passwordSection.currentPasswordLabel}
									</Label>
									<Input
										id="oldPassword"
										type="password"
										value={oldPassword}
										onChange={(e) => setOldPassword(e.target.value)}
										placeholder={
											content.profile.passwordSection.currentPasswordPlaceholder
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="newPassword">
										{content.profile.passwordSection.newPasswordLabel}
									</Label>
									<Input
										id="newPassword"
										type="password"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										placeholder={
											content.profile.passwordSection.newPasswordPlaceholder
										}
										minLength={8}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="confirmPassword">
										{content.profile.passwordSection.confirmPasswordLabel}
									</Label>
									<Input
										id="confirmPassword"
										type="password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										placeholder={
											content.profile.passwordSection.confirmPasswordPlaceholder
										}
										minLength={8}
									/>
								</div>
								<Button
									type="submit"
									disabled={
										passwordLoading ||
										!oldPassword ||
										!newPassword ||
										!confirmPassword
									}
								>
									{passwordLoading && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									{content.profile.passwordSection.changeButton}
								</Button>
							</form>
						</CardContent>
					</Card>
				)}

				{/* Delete Account Section */}
				<Card className="border-red-500/50">
					<CardContent className="pt-6">
						<div className="space-y-4">
							<div>
								<h3 className="font-semibold text-red-500">
									{content.profile.deleteSection.title}
								</h3>
								<p className="text-muted-foreground mt-1 text-sm">
									{content.profile.deleteSection.description}
								</p>
							</div>
							<Button
								variant="destructive"
								onClick={() => setDeleteDialogOpen(true)}
							>
								{content.profile.deleteSection.deleteButton}
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Delete Account Confirmation Dialog */}
			<DialogPrimitive.Root
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
			>
				<DialogPrimitive.Portal>
					<DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80" />
					<DialogPrimitive.Content className="border-border bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg">
						<div className="flex flex-col space-y-3">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
									<AlertTriangle className="h-5 w-5 text-red-500" />
								</div>
								<DialogPrimitive.Title className="text-lg font-semibold text-red-500">
									{content.profile.deleteSection.dialogTitle}
								</DialogPrimitive.Title>
							</div>

							<DialogPrimitive.Description className="text-muted-foreground text-sm">
								{content.profile.deleteSection.dialogDescription}
							</DialogPrimitive.Description>

							<div className="space-y-2 pt-2">
								<Label htmlFor="deleteConfirmation">
									{content.profile.deleteSection.confirmationLabel}
								</Label>
								<Input
									id="deleteConfirmation"
									type="text"
									value={deleteConfirmation}
									onChange={(e) => setDeleteConfirmation(e.target.value)}
									placeholder={
										content.profile.deleteSection.confirmationPlaceholder
									}
									disabled={deleteLoading}
								/>
							</div>
						</div>

						{/* Actions */}
						<div className="flex justify-end gap-2 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setDeleteDialogOpen(false);
									setDeleteConfirmation("");
								}}
								disabled={deleteLoading}
							>
								{content.profile.deleteSection.cancel}
							</Button>
							<Button
								type="button"
								variant="destructive"
								onClick={handleDeleteAccount}
								disabled={deleteLoading || deleteConfirmation !== "confirmer"}
							>
								{deleteLoading && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								{deleteLoading
									? content.profile.deleteSection.deleting
									: content.profile.deleteSection.deleteButton}
							</Button>
						</div>

						<DialogPrimitive.Close className="data-[state=open]:bg-secondary absolute top-4 right-4 cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none">
							<X className="h-4 w-4" />
							<span className="sr-only">Close</span>
						</DialogPrimitive.Close>
					</DialogPrimitive.Content>
				</DialogPrimitive.Portal>
			</DialogPrimitive.Root>
		</div>
	);
}
