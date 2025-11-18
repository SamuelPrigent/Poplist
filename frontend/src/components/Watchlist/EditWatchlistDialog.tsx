import {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Pencil, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { watchlistAPI, type Watchlist } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";
import { WATCHLIST_CATEGORIES, getCategoryInfo, type WatchlistCategory } from "@/types/categories";
import { generateAndCacheThumbnail, deleteCachedThumbnail } from "@/lib/thumbnailGenerator";

interface EditWatchlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  watchlist: Watchlist;
  offline?: boolean;
}

export interface EditWatchlistDialogRef {
  openFilePicker: () => void;
}

export const EditWatchlistDialog = forwardRef<
  EditWatchlistDialogRef,
  EditWatchlistDialogProps
>(({ open, onOpenChange, onSuccess, watchlist, offline = false }, ref) => {
  const { content } = useLanguageStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [categories, setCategories] = useState<WatchlistCategory[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expose method to trigger file picker
  useImperativeHandle(ref, () => ({
    openFilePicker: () => {
      fileInputRef.current?.click();
    },
  }));

  const toggleCategory = (category: WatchlistCategory) => {
    setCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Initialize form with watchlist data when dialog opens
  useEffect(() => {
    if (open && watchlist) {
      setName(watchlist.name);
      setDescription(watchlist.description || "");
      setIsPublic(watchlist.isPublic);
      setCategories(watchlist.categories || []);
      setImagePreview(watchlist.imageUrl || null);
    }
  }, [open, watchlist]);

  // Clear categories when watchlist becomes private
  useEffect(() => {
    if (!isPublic && categories.length > 0) {
      setCategories([]);
    }
  }, [isPublic]);

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
      if (offline) {
        // Offline mode: update in localStorage
        const watchlists = JSON.parse(
          localStorage.getItem("watchlists") || "[]",
        );
        const index = watchlists.findIndex(
          (w: Watchlist) => w._id === watchlist._id,
        );

        if (index !== -1) {
          const updatedWatchlist = {
            ...watchlists[index],
            name: name.trim(),
            description: description.trim() || undefined,
            imageUrl: imagePreview || undefined,
            isPublic,
            categories: categories.length > 0 ? categories : undefined,
            updatedAt: new Date().toISOString(),
          };
          watchlists[index] = updatedWatchlist;
          localStorage.setItem("watchlists", JSON.stringify(watchlists));

          // Handle thumbnail changes
          if (imagePreview === null && watchlist.imageUrl) {
            // User removed custom image - regenerate automatic thumbnail
            if (updatedWatchlist.items && updatedWatchlist.items.length > 0) {
              const posterUrls = updatedWatchlist.items
                .slice(0, 4)
                .map((item: any) => item.posterUrl)
                .filter(Boolean);
              if (posterUrls.length > 0) {
                await generateAndCacheThumbnail(watchlist._id, posterUrls);
              }
            }
          } else if (imagePreview && imagePreview !== watchlist.imageUrl) {
            // User uploaded a new image - delete cached thumbnail
            deleteCachedThumbnail(watchlist._id);
          }
        }

        onSuccess();
        onOpenChange(false);
      } else {
        // Online mode: update via API
        const updates: {
          name: string;
          description?: string;
          isPublic: boolean;
          categories?: WatchlistCategory[];
        } = {
          name: name.trim(),
          isPublic,
        };

        // Explicitly set description (empty string to clear it)
        if (description.trim() === "") {
          updates.description = "";
        } else {
          updates.description = description.trim();
        }

        // Add categories if any are selected
        if (categories.length > 0) {
          updates.categories = categories;
        }

        await watchlistAPI.update(watchlist._id, updates);

        // Handle image changes
        if (imagePreview === null && watchlist.imageUrl) {
          // User removed the image - delete from Cloudinary and regenerate thumbnail
          await watchlistAPI.deleteCover(watchlist._id);

          // Regenerate automatic thumbnail
          const updatedWatchlist = await watchlistAPI.getById(watchlist._id);
          if (updatedWatchlist.watchlist.items.length > 0) {
            const posterUrls = updatedWatchlist.watchlist.items
              .slice(0, 4)
              .map((item: any) => item.posterUrl)
              .filter(Boolean);
            if (posterUrls.length > 0) {
              await generateAndCacheThumbnail(watchlist._id, posterUrls);
            }
          }
        } else if (
          imageFile &&
          imagePreview &&
          imagePreview !== watchlist.imageUrl
        ) {
          // User uploaded a new image (old one will be auto-deleted by backend)
          await watchlistAPI.uploadCover(watchlist._id, imagePreview);

          // Delete cached thumbnail since we now have a custom image
          deleteCachedThumbnail(watchlist._id);
        }

        onSuccess();
        onOpenChange(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update watchlist",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-[620px] translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <div className="flex flex-col space-y-1.5">
            <DialogPrimitive.Title className="text-lg font-semibold">
              {content.watchlists.editWatchlist}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              {content.watchlists.editWatchlistDescription}
            </DialogPrimitive.Description>
          </div>

          <form onSubmit={handleSubmit} className="mt-3 space-y-6">
            {/* Main Layout: square cover on the left, fields on the right */}
            <div className="flex flex-col gap-6 md:flex-row">
              {/* Cover Image */}
              <div className="flex justify-center md:block">
                <div
                  className="group relative aspect-square w-48 cursor-pointer overflow-hidden rounded-lg border border-border"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Watchlist cover"
                        className="h-full w-full object-cover"
                      />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                        <Pencil className="h-8 w-8 text-white" />
                        <span className="mt-2 text-sm text-white">
                          {/* {content.watchlists.selectPhoto ||
                            "Sélectionner une photo"} */}
                          {"Sélectionner une photo"}
                        </span>
                      </div>
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-muted/50 transition-colors group-hover:bg-muted">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      <span className="mt-2 text-sm text-muted-foreground">
                        {/* {content.watchlists.selectPhoto ||
                          "Sélectionner une photo"} */}
                        {"Sélectionner une photo"}
                      </span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {/* Title and Description */}
              <div className="flex flex-1 flex-col gap-4 md:h-48">
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
                <div className="flex flex-1 flex-col space-y-2">
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
                    className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Public Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={loading}
                className="h-4 w-4 rounded border-input bg-background text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <label
                htmlFor="isPublic"
                className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {content.watchlists.makePublic}
              </label>
            </div>

            {/* Categories Selection - Only shown if public */}
            {isPublic && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {content.watchlists.categories}
                </label>
                <div className="flex flex-wrap gap-2">
                  {WATCHLIST_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      disabled={loading}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        categories.includes(category)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {getCategoryInfo(category, content).name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {content.watchlists.categoriesDescription}
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? content.watchlists.saving : content.watchlists.save}
              </Button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}
          </form>

          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
});

EditWatchlistDialog.displayName = "EditWatchlistDialog";
