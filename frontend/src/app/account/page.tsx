"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
	AlertTriangle,
	Check,
	Eye,
	EyeOff,
	Loader2,
	Trash2,
	Upload,
	User,
	X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { userAPI } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";
import { type Theme, useThemeStore } from "@/store/theme";
import type { Content } from "@/types/content";

function ThemeSelector({ content }: { content: Content }) {
	const { theme, setTheme } = useThemeStore();
	const themes: { id: Theme; label: string; description: string }[] = [
		{ id: "ocean", label: content.profile.themeSection.ocean, description: content.profile.themeSection.oceanDescription },
		{ id: "midnight", label: content.profile.themeSection.midnight, description: content.profile.themeSection.midnightDescription },
	];

	return (
		<Card>
			<CardContent className="pt-6">
				<div className="space-y-4">
					<div>
						<h3 className="font-semibold">{content.profile.themeSection.title}</h3>
						<p className="text-muted-foreground mt-1 text-sm">
							{content.profile.themeSection.description}
						</p>
					</div>
					<div className="flex gap-3">
						{themes.map((t) => (
							<button
								key={t.id}
								type="button"
								onClick={() => setTheme(t.id)}
								className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border px-5 py-3 transition-all ${
									theme === t.id
										? "border-gray-400 bg-muted outline-2 outline-white/30"
										: "border-border hover:border-muted-foreground"
								}`}
							>
								<div
									className="h-8 w-8 rounded-full border border-border"
									style={{
										background:
											t.id === "ocean"
												? "linear-gradient(135deg, hsl(222.2 84% 4.9%), hsl(217.2 32.6% 17.5%))"
												: "linear-gradient(135deg, hsl(224 15% 4%), hsl(218 25% 16%))",
									}}
								/>
								<span className="text-sm font-medium">{t.label}</span>
								<span className="text-muted-foreground text-xs">{t.description}</span>
							</button>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export default function AccountPage() {
	const { user, isLoading, updateUsername, changePassword, deleteAccount, refetch } =
		useAuth();
	const { content } = useLanguageStore();
	const router = useRouter();

	// Username state
	const [username, setUsername] = useState(user?.username || "");
	const [usernameLoading, setUsernameLoading] = useState(false);
	const [usernameCheckError, setUsernameCheckError] = useState<string | null>(
		null,
	);
	const [usernameChecking, setUsernameChecking] = useState(false);

	// Password state
	const [oldPassword, setOldPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [passwordLoading, setPasswordLoading] = useState(false);

	// Password visibility state
	const [showOldPassword, setShowOldPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	// Password error state
	const [passwordError, setPasswordError] = useState<string | null>(null);

	// Delete account state
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteConfirmation, setDeleteConfirmation] = useState("");
	const [deleteLoading, setDeleteLoading] = useState(false);

	// Avatar state
	const [avatarUploading, setAvatarUploading] = useState(false);
	const [avatarDeleting, setAvatarDeleting] = useState(false);

	// Client-side mount state (for hydration consistency)
	const [mounted, setMounted] = useState(false);

	// Set mounted state for hydration consistency
	useEffect(() => {
		setMounted(true);
	}, []);

	// Redirect to home if not authenticated (wait for auth to load first)
	useEffect(() => {
		if (!isLoading && user === null) {
			router.push("/home");
		}
	}, [user, isLoading, router]);

	// Update username when user changes
	useEffect(() => {
		if (user?.username) {
			setUsername(user.username);
		}
	}, [user?.username]);

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
					content.profile.usernameSection.validation.lengthError,
				);
				return;
			}

			if (!/^[a-zA-Z0-9_]+$/.test(usernameToCheck)) {
				setUsernameCheckError(
					content.profile.usernameSection.validation.formatError,
				);
				return;
			}

			setUsernameChecking(true);
			try {
				const response = await fetch(
					`/api/auth/username/check/${usernameToCheck}`,
				);
				const data = await response.json();

				if (!data.available) {
					setUsernameCheckError(
						content.profile.usernameSection.validation.alreadyTaken,
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
		[user?.username, content],
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
			toast.success(content.profile.toasts.usernameUpdated, {
				description: content.profile.toasts.usernameUpdatedDesc,
			});
		} catch (error) {
			toast.error(content.profile.toasts.error, {
				description:
					error instanceof Error
						? error.message
						: content.profile.toasts.updateFailed,
			});
		} finally {
			setUsernameLoading(false);
		}
	};

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setPasswordError(null);

		if (newPassword !== confirmPassword) {
			setPasswordError(content.profile.toasts.passwordMismatch);
			return;
		}

		setPasswordLoading(true);
		try {
			await changePassword(oldPassword, newPassword);
			toast.success(content.profile.toasts.passwordChanged, {
				description: content.profile.toasts.passwordChangedDesc,
			});
			setOldPassword("");
			setNewPassword("");
			setConfirmPassword("");
			setShowOldPassword(false);
			setShowNewPassword(false);
			setShowConfirmPassword(false);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: content.profile.toasts.passwordChangeFailed;
			setPasswordError(errorMessage);
		} finally {
			setPasswordLoading(false);
		}
	};

	const handleDeleteAccount = async () => {
		setDeleteLoading(true);
		try {
			await deleteAccount(deleteConfirmation);
			toast.success(content.profile.toasts.accountDeleted, {
				description: content.profile.toasts.accountDeletedDesc,
			});
			setDeleteDialogOpen(false);
			router.push("/");
		} catch (error) {
			toast.error(content.profile.toasts.error, {
				description:
					error instanceof Error
						? error.message
						: content.profile.toasts.accountDeleteFailed,
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
			toast.error(content.profile.toasts.error, {
				description: content.profile.avatarSection.validation.invalidFileType,
			});
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast.error(content.profile.toasts.error, {
				description: content.profile.avatarSection.validation.fileTooLarge,
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

					toast.success(content.profile.avatarSection.toasts.updated, {
						description: content.profile.avatarSection.toasts.updatedDesc,
					});
				} catch (error) {
					toast.error(content.profile.toasts.error, {
						description:
							error instanceof Error
								? error.message
								: content.profile.avatarSection.validation.uploadFailed,
					});
				} finally {
					setAvatarUploading(false);
				}
			};
			reader.readAsDataURL(file);
		} catch (error) {
			toast.error(content.profile.toasts.error, {
				description: content.profile.avatarSection.validation.readFailed,
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

			toast.success(content.profile.avatarSection.toasts.deleted, {
				description: content.profile.avatarSection.toasts.deletedDesc,
			});
		} catch (error) {
			toast.error(content.profile.toasts.error, {
				description:
					error instanceof Error
						? error.message
						: content.profile.avatarSection.validation.deleteFailed,
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
									{mounted && user?.avatarUrl ? (
										<Image
											src={user.avatarUrl}
											alt={user.username || "Avatar"}
											width={96}
											height={96}
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
												className="focus-visible:ring-offset-background cursor-pointer focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-white"
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
														{mounted && user?.avatarUrl
															? content.profile.avatarSection.changeButton
															: content.profile.avatarSection.uploadButton}
													</>
												)}
											</Button>
										</label>

										{mounted && user?.avatarUrl && (
											<Button
												className="focus-visible:ring-offset-background cursor-pointer focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-white"
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
								className="focus-visible:ring-offset-background cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
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

				{/* Password Section - Only show if user has password (mounted check for hydration) */}
				{mounted && user?.hasPassword && (
					<Card>
						<CardContent className="pt-6">
							<form onSubmit={handleChangePassword} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="oldPassword">
										{content.profile.passwordSection.currentPasswordLabel}
									</Label>
									<div className="relative">
										<Input
											id="oldPassword"
											type={oldPassword.length === 0 ? "text" : showOldPassword ? "text" : "password"}
											value={oldPassword}
											onChange={(e) => setOldPassword(e.target.value)}
											placeholder={
												content.profile.passwordSection.currentPasswordPlaceholder
											}
											className="pr-10"
										/>
										<button
											type="button"
											onClick={() => setShowOldPassword(!showOldPassword)}
											className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
											tabIndex={-1}
										>
											{showOldPassword ? (
												<Eye className="h-4 w-4" />
											) : (
												<EyeOff className="h-4 w-4" />
											)}
										</button>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="newPassword">
										{content.profile.passwordSection.newPasswordLabel}
									</Label>
									<div className="relative">
										<Input
											id="newPassword"
											type={newPassword.length === 0 ? "text" : showNewPassword ? "text" : "password"}
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
											placeholder={
												content.profile.passwordSection.newPasswordPlaceholder
											}
											minLength={8}
											className="pr-10"
										/>
										<button
											type="button"
											onClick={() => setShowNewPassword(!showNewPassword)}
											className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
											tabIndex={-1}
										>
											{showNewPassword ? (
												<Eye className="h-4 w-4" />
											) : (
												<EyeOff className="h-4 w-4" />
											)}
										</button>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="confirmPassword">
										{content.profile.passwordSection.confirmPasswordLabel}
									</Label>
									<div className="relative">
										<Input
											id="confirmPassword"
											type={confirmPassword.length === 0 ? "text" : showConfirmPassword ? "text" : "password"}
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											placeholder={
												content.profile.passwordSection.confirmPasswordPlaceholder
											}
											minLength={8}
											className="pr-10"
										/>
										<button
											type="button"
											onClick={() => setShowConfirmPassword(!showConfirmPassword)}
											className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
											tabIndex={-1}
										>
											{showConfirmPassword ? (
												<Eye className="h-4 w-4" />
											) : (
												<EyeOff className="h-4 w-4" />
											)}
										</button>
									</div>
								</div>
								<Button
									className="cursor-pointer"
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

								{passwordError && (
									<div className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500">
										{passwordError}
									</div>
								)}
							</form>
						</CardContent>
					</Card>
				)}

				{/* Theme Section */}
				<ThemeSelector content={content} />

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
								className="focus-visible:ring-offset-background cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
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
								className="focus-visible:ring-offset-background cursor-pointer focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-white"
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
								className="focus-visible:ring-offset-background cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
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
