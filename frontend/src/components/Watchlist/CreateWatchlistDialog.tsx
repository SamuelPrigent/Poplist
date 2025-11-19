import { useState, useRef, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { watchlistAPI, type Watchlist } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";
import { WATCHLIST_CATEGORIES, getCategoryInfo, type WatchlistCategory } from "@/types/categories";

interface CreateWatchlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (watchlist?: Watchlist) => void;
  offline?: boolean;
}

export function CreateWatchlistDialog({
  open,
  onOpenChange,
  onSuccess,
  offline = false,
}: CreateWatchlistDialogProps) {
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

  const toggleCategory = (category: WatchlistCategory) => {
    setCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

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
        // Offline mode: create in localStorage
        const newWatchlist = {
          _id: `offline-${Date.now()}`,
          ownerId: "offline",
          name: name.trim(),
          description: description.trim() || undefined,
          imageUrl: imagePreview || undefined,
          isPublic,
          categories: categories.length > 0 ? categories : undefined,
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
        setCategories([]);
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
          categories: categories.length > 0 ? categories : undefined,
        });

        // Upload cover image if provided
        if (imageFile && imagePreview) {
          await watchlistAPI.uploadCover(watchlist._id, imagePreview);
        }

        // Reset form
        setName("");
        setDescription("");
        setIsPublic(false);
        setCategories([]);
        setImageFile(null);
        setImagePreview(null);

        onSuccess(watchlist);
        onOpenChange(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create watchlist");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName("");
    setDescription("");
    setIsPublic(false);
    setCategories([]);
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <div className="flex flex-col space-y-1.5">
            <DialogPrimitive.Title className="text-lg font-semibold">
              {content.watchlists.createWatchlist}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              {content.watchlists.createWatchlistDescription}
            </DialogPrimitive.Description>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                {content.watchlists.name} <span className="text-red-500">*</span>
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
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
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

            {/* Cover Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {content.watchlists.coverImage}
              </label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative h-24 w-24 overflow-hidden rounded-md border border-border">
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
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed border-border bg-muted/50 hover:bg-muted disabled:opacity-50"
                  >
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </button>
                )}
                <div className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {imagePreview ? content.watchlists.changeImage : content.watchlists.uploadImage}
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {content.watchlists.imageUploadHint}
                  </p>
                </div>
                <input
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
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                {content.watchlists.cancel}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? content.watchlists.creating : content.watchlists.create}
              </Button>
            </div>
          </form>

          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
