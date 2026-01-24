'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Image as ImageIcon, Pencil, X } from 'lucide-react';
import Image from 'next/image';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Watchlist, WatchlistItem } from '@/lib/api-client';
import { deleteCachedThumbnail, generateAndCacheThumbnail } from '@/lib/thumbnailGenerator';
import { getTMDBImageUrl } from '@/lib/utils';
import { useLanguageStore } from '@/store/language';

interface EditListDialogOfflineProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  watchlist: Watchlist;
}

export interface EditListDialogOfflineRef {
  openFilePicker: () => void;
}

export const EditListDialogOffline = forwardRef<
  EditListDialogOfflineRef,
  EditListDialogOfflineProps
>(({ open, onOpenChange, onSuccess, watchlist }, ref) => {
  const { content } = useLanguageStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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

  // Initialize form with watchlist data when dialog opens
  useEffect(() => {
    if (open && watchlist) {
      setName(watchlist.name);
      setDescription(watchlist.description || '');
      setImagePreview(watchlist.imageUrl || null);
    }
  }, [open, watchlist]);

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
      // Offline mode: update in localStorage
      const watchlists = JSON.parse(localStorage.getItem('watchlists') || '[]');
      const index = watchlists.findIndex((w: Watchlist) => w.id === watchlist.id);

      if (index !== -1) {
        const updatedWatchlist = {
          ...watchlists[index],
          name: name.trim(),
          description: description.trim() || undefined,
          imageUrl: imagePreview || undefined,
          isPublic: false, // Offline watchlists cannot be public
          categories: undefined, // Offline watchlists don't support categories
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
              await generateAndCacheThumbnail(watchlist.id, posterUrls);
            }
          }
        } else if (imagePreview && imagePreview !== watchlist.imageUrl) {
          // User uploaded a new image - delete cached thumbnail
          deleteCachedThumbnail(watchlist.id);
        }
      }

      onSuccess();
      onOpenChange(false);
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

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
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
});

EditListDialogOffline.displayName = 'EditListDialogOffline';
