'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Image as ImageIcon, Pencil, X } from 'lucide-react';
import { Img as Image } from '@/components/ui/Img';
import {
  forwardRef,
  type Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/cn';
import { watchlists as watchlistsApi } from '@/api';
import type { Watchlist } from '@/api';
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

/**
 * Switcher responsive : < 750px → drawer bottom (vaul), sinon modale desktop.
 * Le ref `openFilePicker` (appelé depuis le header au clic sur la couverture)
 * est forwardé au corps de formulaire partagé, monté dans le shell actif.
 */
export const EditListDialog = forwardRef<EditListDialogRef, EditListDialogProps>((props, ref) => {
  const isMobile = useIsMobile();
  return isMobile ? (
    <EditListDrawerShell {...props} formRef={ref} />
  ) : (
    <EditListModalShell {...props} formRef={ref} />
  );
});
EditListDialog.displayName = 'EditListDialog';

type ShellProps = EditListDialogProps & { formRef: Ref<EditListDialogRef> };

// -------------------------------------------------------------------------
// Shell modale (desktop) — inchangé.
// -------------------------------------------------------------------------
function EditListModalShell({ open, onOpenChange, onSuccess, watchlist, offline, formRef }: ShellProps) {
  const { content } = useLanguageStore();
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

          <EditListForm
            ref={formRef}
            open={open}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
            watchlist={watchlist}
            offline={offline}
          />

          <DialogPrimitive.Close className="data-[state=open]:bg-secondary absolute top-4 right-4 cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// -------------------------------------------------------------------------
// Shell drawer (mobile)
// -------------------------------------------------------------------------
function EditListDrawerShell({ open, onOpenChange, onSuccess, watchlist, offline, formRef }: ShellProps) {
  const { content } = useLanguageStore();
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        {/* Header type barre de titre (non scrollable) : titre centré +
            border-b, sans description — même pattern que "Ajouter à une liste".
            La description reste en sr-only pour l'accessibilité (Radix). */}
        <div className="border-border/60 flex items-center justify-center border-b px-4 pb-3">
          <DrawerTitle className="text-base font-semibold">
            {content.watchlists.editWatchlist}
          </DrawerTitle>
        </div>
        <DrawerDescription className="sr-only">
          {content.watchlists.editWatchlistDescription}
        </DrawerDescription>
        <div className="overflow-y-auto px-4 pt-1 pb-[calc(2.25rem+env(safe-area-inset-bottom))]">
          <EditListForm
            ref={formRef}
            open={open}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
            watchlist={watchlist}
            offline={offline}
            stacked
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// -------------------------------------------------------------------------
// Corps de formulaire partagé (état + logique + champs).
// -------------------------------------------------------------------------
const EditListForm = forwardRef<
  EditListDialogRef,
  {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    watchlist: Watchlist;
    offline?: boolean;
    stacked?: boolean;
  }
>(({ open, onClose, onSuccess, watchlist, offline = false, stacked = false }, ref) => {
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
      setIsPublic(watchlist.isPublic ?? false);
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

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('File must be an image');
      return;
    }

    setImageFile(file);
    setError(null);

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
        }

        onSuccess();
        onClose();
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

        if (genresData) {
          updates.genres = genresData;
        }

        await watchlistsApi.update(watchlist.id, updates);

        // Handle image changes
        if (imagePreview === null && watchlist.imageUrl) {
          await watchlistsApi.deleteCover(watchlist.id);
        } else if (imageFile && imagePreview && imagePreview !== watchlist.imageUrl) {
          await watchlistsApi.uploadCover(watchlist.id, imagePreview);
        }

        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update watchlist');
    } finally {
      setLoading(false);
    }
  };

  return (
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
                <span className="text-muted-foreground mt-2 text-sm">Sélectionner une photo</span>
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
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={content.watchlists.descriptionPlaceholder}
              maxLength={500}
              disabled={loading}
              className="resize-none md:flex-1"
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
      )}

      <div className={cn('flex gap-2', stacked ? 'flex-col' : 'justify-end')}>
        {stacked && (
          <Button
            className="focus-visible:ring-offset-background w-full cursor-pointer focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-white"
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {content.watchlists.cancel}
          </Button>
        )}
        <Button
          className={cn('cursor-pointer', stacked && 'w-full')}
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
  );
});
EditListForm.displayName = 'EditListForm';
