'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Image as ImageIcon, Pencil, X } from 'lucide-react';
import Image from 'next/image';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type Watchlist, type WatchlistItem, watchlistAPI } from '@/lib/api-client';
import { deleteCachedThumbnail, generateAndCacheThumbnail, getThumbnailCacheKey } from '@/lib/thumbnailGenerator';
import { getTMDBImageUrl } from '@/lib/utils';
import { useLanguageStore } from '@/store/language';
import { GENRE_CATEGORIES, type GenreCategory, getCategoryInfo } from '@/types/categories';

interface EditListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  watchlist: Watchlist;
  offline?: boolean;
}

export interface EditListDialogRef {
  openFilePicker: () => void;
}

export const EditListDialog = forwardRef<EditListDialogRef, EditListDialogProps>(
  ({ open, onOpenChange, onSuccess, watchlist, offline = false }, ref) => {
    const { content } = useLanguageStore();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [genreCategories, setGenreCategories] = useState<GenreCategory[]>([]);
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

    const toggleGenreCategory = (category: GenreCategory) => {
      setGenreCategories(prev =>
        prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
      );
    };

    // Initialize form with watchlist data when dialog opens
    useEffect(() => {
      if (open && watchlist) {
        setName(watchlist.name);
        setDescription(watchlist.description || '');
        setIsPublic(watchlist.isPublic);

        // Parse genres from watchlist
        setGenreCategories((watchlist.genres || []) as GenreCategory[]);

        setImagePreview(watchlist.imageUrl || null);
      }
    }, [open, watchlist]);

    // Clear genres when watchlist becomes private
    useEffect(() => {
      if (!isPublic) {
        if (genreCategories.length > 0) {
          setGenreCategories([]);
        }
      }
    }, [isPublic, genreCategories.length]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('File must be an image');
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
        setError('Name is required');
        return;
      }

      setLoading(true);

      try {
        // Build genres array
        const genresData = genreCategories.length > 0 ? genreCategories : undefined;

        if (offline) {
          // Offline mode: update in localStorage
          const watchlists = JSON.parse(localStorage.getItem('watchlists') || '[]');
          const index = watchlists.findIndex((w: Watchlist) => w.id === watchlist.id);

          if (index !== -1) {
            const updatedWatchlist = {
              ...watchlists[index],
              name: name.trim(),
              description: description.trim() || undefined,
              imageUrl: imagePreview || undefined,
              isPublic,
              genres: genresData,
              updatedAt: new Date().toISOString(),
            };
            watchlists[index] = updatedWatchlist;
            localStorage.setItem('watchlists', JSON.stringify(watchlists));

            // Handle thumbnail changes
            if (imagePreview === null && watchlist.imageUrl) {
              // User removed custom image - regenerate automatic thumbnail
              if (updatedWatchlist.items && updatedWatchlist.items.length > 0) {
                const posterUrls = updatedWatchlist.items
                  .slice(0, 4)
                  .map((item: WatchlistItem) => getTMDBImageUrl(item.posterPath, 'w342'))
                  .filter((url: string | null): url is string => url !== null);
                if (posterUrls.length > 0) {
                  const cacheKey = getThumbnailCacheKey(watchlist.id, updatedWatchlist.items.slice(0, 4).map((item: WatchlistItem) => item.posterPath));
                  await generateAndCacheThumbnail(cacheKey, posterUrls);
                }
              }
            } else if (imagePreview && imagePreview !== watchlist.imageUrl) {
              // User uploaded a new image - delete cached thumbnail
              deleteCachedThumbnail(watchlist.id);
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
            genres?: string[];
          } = {
            name: name.trim(),
            isPublic,
          };

          // Explicitly set description (empty string to clear it)
          if (description.trim() === '') {
            updates.description = '';
          } else {
            updates.description = description.trim();
          }

          // Add genres if any are selected
          if (genresData) {
            updates.genres = genresData;
          }

          await watchlistAPI.update(watchlist.id, updates);

          // Handle image changes
          if (imagePreview === null && watchlist.imageUrl) {
            // User removed the image - delete from Cloudinary and regenerate thumbnail
            await watchlistAPI.deleteCover(watchlist.id);

            // Regenerate automatic thumbnail
            const updatedWatchlist = await watchlistAPI.getById(watchlist.id);
            if (updatedWatchlist.watchlist.items.length > 0) {
              const posterUrls = updatedWatchlist.watchlist.items
                .slice(0, 4)
                .map((item: WatchlistItem) => getTMDBImageUrl(item.posterPath, 'w342'))
                .filter((url: string | null): url is string => url !== null);
              if (posterUrls.length > 0) {
                const cacheKey = getThumbnailCacheKey(watchlist.id, updatedWatchlist.watchlist.items.slice(0, 4).map((item: WatchlistItem) => item.posterPath));
                await generateAndCacheThumbnail(cacheKey, posterUrls);
              }
            }
          } else if (imageFile && imagePreview && imagePreview !== watchlist.imageUrl) {
            // User uploaded a new image (old one will be auto-deleted by backend)
            await watchlistAPI.uploadCover(watchlist.id, imagePreview);

            // Delete cached thumbnail since we now have a custom image
            deleteCachedThumbnail(watchlist.id);
          }

          onSuccess();
          onOpenChange(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update watchlist');
      } finally {
        setLoading(false);
      }
    };

    return (
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80" />
          <DialogPrimitive.Content className="border-border bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 w-full max-w-[620px] translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg">
            <div className="flex flex-col space-y-1.5">
              <DialogPrimitive.Title className="text-lg font-semibold">
                {content.watchlists.editWatchlist}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-muted-foreground text-sm">
                {content.watchlists.editWatchlistDescription}
              </DialogPrimitive.Description>
            </div>

            <form onSubmit={handleSubmit} className="mt-3 space-y-6">
              {/* Main Layout: square cover on the left, fields on the right */}
              <div className="flex flex-col gap-6 md:flex-row">
                {/* Cover Image */}
                <div className="flex justify-center md:block">
                  <div
                    role="button"
                    tabIndex={0}
                    className="group border-border relative aspect-square w-48 cursor-pointer overflow-hidden rounded-lg border"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    {imagePreview ? (
                      <>
                        <Image
                          src={imagePreview}
                          alt="Watchlist cover"
                          fill
                          sizes="192px"
                          className="object-cover"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                          <Pencil className="h-8 w-8 text-white" />
                          <span className="mt-2 text-sm text-white">Sélectionner une photo</span>
                        </div>
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="bg-muted/50 group-hover:bg-muted flex h-full w-full flex-col items-center justify-center transition-colors">
                        <ImageIcon className="text-muted-foreground h-12 w-12" />
                        <span className="text-muted-foreground mt-2 text-sm">
                          Sélectionner une photo
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
                      {content.watchlists.name} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
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
                      onChange={e => setDescription(e.target.value)}
                      placeholder={content.watchlists.descriptionPlaceholder}
                      maxLength={500}
                      disabled={loading}
                      className="border-input bg-background placeholder:text-muted-foreground w-full resize-none rounded-md border px-3 py-2 text-sm focus:outline-2 focus:outline-gray-300/30 focus:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50 md:flex-1"
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
                  onChange={e => setIsPublic(e.target.checked)}
                  disabled={loading}
                  className="border-input bg-background text-primary h-4 w-4 disabled:cursor-not-allowed disabled:opacity-50"
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
                      {content.watchlists.genreCategories || 'Catégories par genre'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {GENRE_CATEGORIES.map(category => (
                        <button
                          type="button"
                          key={category}
                          onClick={() => toggleGenreCategory(category)}
                          disabled={loading}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            genreCategories.includes(category)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {getCategoryInfo(category, content).name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <Button className="cursor-pointer" type="submit" disabled={loading}>
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

            <DialogPrimitive.Close className="data-[state=open]:bg-secondary absolute top-4 right-4 cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }
);

EditListDialog.displayName = 'EditListDialog';
