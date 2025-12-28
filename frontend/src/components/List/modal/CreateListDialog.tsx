import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlatformSelector } from "@/components/List/PlatformSelector";
import { type Watchlist, watchlistAPI } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";
import {
	GENRE_CATEGORIES,
	getCategoryInfo,
	type GenreCategory,
	type PlatformCategory,
} from "@/types/categories";

interface CreateListDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: (watchlist?: Watchlist) => void;
	offline?: boolean;
}

export function CreateListDialog({
	open,
	onOpenChange,
	onSuccess,
	offline = false,
}: CreateListDialogProps) {
	const { content } = useLanguageStore();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [isPublic, setIsPublic] = useState(false);
	const [genreCategories, setGenreCategories] = useState<GenreCategory[]>([]);
	const [providerCategories, setProviderCategories] = useState<
		PlatformCategory[]
	>([]);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const toggleGenreCategory = (category: GenreCategory) => {
		setGenreCategories((prev) =>
			prev.includes(category)
				? prev.filter((c) => c !== category)
				: [...prev, category]
		);
	};

	// Clear categories when watchlist becomes private
	useEffect(() => {
		if (!isPublic) {
			if (genreCategories.length > 0) {
				setGenreCategories([]);
			}
			if (providerCategories.length > 0) {
				setProviderCategories([]);
			}
		}
	}, [isPublic, genreCategories.length, providerCategories.length]);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			setError("Image size must be less than 5MB");
			return;
		}

		// Validate file type
		if (!file.type.startsWith("image/")) {
			setError("File must be an image");
			return;
		}

		setImageFile(file);
		setError(null);

		// Create preview
		const reader = new FileReader();
		reader.onloadend = () => {
			setImagePreview(reader.result as string);
		};
		reader.readAsDataURL(file);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!name.trim()) {
			setError("Name is required");
			return;
		}

		setLoading(true);

		try {
			// Build categories object in new format
			const hasGenres = genreCategories.length > 0;
			const hasProviders = providerCategories.length > 0;
			const categoriesData =
				hasGenres || hasProviders
					? {
							genre: hasGenres ? genreCategories : undefined,
							watchProvider: hasProviders ? providerCategories : undefined,
						}
					: undefined;

			if (offline) {
				// Offline mode: create in localStorage
				const newWatchlist = {
					_id: `offline-${Date.now()}`,
					ownerId: "offline",
					name: name.trim(),
					description: description.trim() || undefined,
					imageUrl: imagePreview || undefined,
					isPublic: false, // Offline watchlists cannot be public
					categories: undefined, // Offline watchlists don't support categories
					collaborators: [],
					items: [],
					likedBy: [],
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};

				// Reset form
				setName("");
				setDescription("");
				setIsPublic(false);
				setGenreCategories([]);
				setProviderCategories([]);
				setImageFile(null);
				setImagePreview(null);

				onSuccess(newWatchlist);
				onOpenChange(false);
			} else {
				// Online mode: create via API
				const { watchlist } = await watchlistAPI.create({
					name: name.trim(),
					description: description.trim() || undefined,
					isPublic,
					categories: categoriesData,
				});

				// Upload cover image if provided
				if (imageFile && imagePreview) {
					await watchlistAPI.uploadCover(watchlist._id, imagePreview);
				}

				// Reset form
				setName("");
				setDescription("");
				setIsPublic(false);
				setGenreCategories([]);
				setProviderCategories([]);
				setImageFile(null);
				setImagePreview(null);

				onSuccess(watchlist);
				onOpenChange(false);
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to create watchlist"
			);
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		setName("");
		setDescription("");
		setIsPublic(false);
		setGenreCategories([]);
		setProviderCategories([]);
		setImageFile(null);
		setImagePreview(null);
		setError(null);
		onOpenChange(false);
	};

	return (
		<DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80" />
				<DialogPrimitive.Content className="border-border bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg">
					<div className="mb-4 flex flex-col space-y-1.5">
						<DialogPrimitive.Title className="text-lg font-semibold">
							{content.watchlists.createWatchlist}
						</DialogPrimitive.Title>
						<DialogPrimitive.Description className="text-muted-foreground text-sm">
							{content.watchlists.createWatchlistDescription}
						</DialogPrimitive.Description>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Name Input */}
						<div className="space-y-2">
							<label htmlFor="name" className="text-sm font-medium">
								{content.watchlists.name}{" "}
								<span className="text-red-500">*</span>
							</label>
							<Input
								id="name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder={content.watchlists.namePlaceholder}
								maxLength={100}
								disabled={loading}
								required
							/>
						</div>

						{/* Description Textarea */}
						<div className="space-y-2">
							<label htmlFor="description" className="text-sm font-medium">
								{content.watchlists.description}
							</label>
							<textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder={content.watchlists.descriptionPlaceholder}
								maxLength={500}
								disabled={loading}
								rows={3}
								className="border-input bg-background placeholder:text-muted-foreground flex w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
							/>
						</div>

						{/* Public Checkbox - Only shown for authenticated users */}
						{!offline && (
							<>
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="isPublic"
										checked={isPublic}
										onChange={(e) => setIsPublic(e.target.checked)}
										disabled={loading}
										className="border-input bg-background text-primary focus-visible:ring-ring h-4 w-4 rounded focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
									/>
									<label
										htmlFor="isPublic"
										className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										{content.watchlists.makePublic}
									</label>
								</div>

								{/* Categories Selection - Only shown if public */}
								{isPublic && (
									<>
										{/* Genre Categories */}
										<div className="space-y-2">
											<p className="text-sm font-medium">
												{content.watchlists.genreCategories ||
													"Catégories par genre"}
											</p>
											<div className="flex flex-wrap gap-2">
												{GENRE_CATEGORIES.map((category) => (
													<button
														type="button"
														key={category}
														onClick={() => toggleGenreCategory(category)}
														disabled={loading}
														className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
															genreCategories.includes(category)
																? "bg-primary text-primary-foreground"
																: "bg-muted text-muted-foreground hover:bg-muted/80"
														}`}
													>
														{getCategoryInfo(category, content).name}
													</button>
												))}
											</div>
										</div>

										{/* Platform Categories */}
										<div className="space-y-2">
											<p className="text-sm font-medium">
												{content.watchlists.platformCategories ||
													"Plateformes de streaming"}
											</p>
											<PlatformSelector
												selected={providerCategories}
												onChange={setProviderCategories}
												disabled={loading}
											/>
										</div>
									</>
								)}
							</>
						)}

						{/* Cover Image Upload */}
						<div className="space-y-2">
							<label
								htmlFor="cover-image-input"
								className="text-sm font-medium"
							>
								{content.watchlists.coverImage}
							</label>
							<div className="mt-2 flex items-center gap-4">
								{imagePreview ? (
									<div className="border-border relative h-24 w-24 overflow-hidden rounded-md border">
										<img
											src={imagePreview}
											alt="Preview"
											className="h-full w-full object-cover"
										/>
										<button
											type="button"
											onClick={() => {
												setImageFile(null);
												setImagePreview(null);
											}}
											className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
										>
											<X className="h-3 w-3" />
										</button>
									</div>
								) : (
									<button
										type="button"
										onClick={() => fileInputRef.current?.click()}
										disabled={loading}
										className="border-border bg-muted/50 hover:bg-muted flex h-24 w-24 cursor-pointer items-center justify-center rounded-md border border-dashed disabled:opacity-50"
									>
										<ImageIcon className="text-muted-foreground h-6 w-6" />
									</button>
								)}
								<div className="flex-1">
									<Button
										className="focus-visible:ring-offset-background cursor-pointer focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-white"
										type="button"
										variant="outline"
										size="sm"
										onClick={() => fileInputRef.current?.click()}
										disabled={loading}
									>
										<Upload className="mr-2 h-4 w-4" />
										{imagePreview
											? content.watchlists.changeImage
											: content.watchlists.uploadImage}
									</Button>
									<p className="text-muted-foreground mt-1 text-xs">
										{content.watchlists.imageUploadHint}
									</p>
								</div>
								<input
									id="cover-image-input"
									ref={fileInputRef}
									type="file"
									accept="image/png,image/jpeg,image/jpg,image/webp"
									onChange={handleImageChange}
									className="hidden"
								/>
							</div>
						</div>

						{/* Error Message */}
						{error && (
							<div className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500">
								{error}
							</div>
						)}

						{/* Actions */}
						<div className="flex justify-end gap-2">
							<Button
								className="focus-visible:ring-offset-background cursor-pointer focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-white"
								type="button"
								variant="outline"
								onClick={handleCancel}
								disabled={loading}
							>
								{content.watchlists.cancel}
							</Button>
							<Button
								className="focus-visible:ring-offset-background cursor-pointer text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
								type="submit"
								disabled={loading}
							>
								{loading
									? content.watchlists.creating
									: content.watchlists.create}
							</Button>
						</div>
					</form>

					<DialogPrimitive.Close className="data-[state=open]:bg-secondary absolute top-4 right-4 cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none">
						<X className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</DialogPrimitive.Close>
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}
