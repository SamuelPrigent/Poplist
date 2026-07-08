'use client';

import { AlertTriangle } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { ResponsiveConfirmDialog } from '@/components/ui/responsive-confirm-dialog';
import { watchlists as watchlistsApi } from '@/api';
import type { Watchlist } from '@/api';
import { useLanguageStore } from '@/store/language';

interface DeleteListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  watchlist: Watchlist;
}

export function DeleteListDialog({
  open,
  onOpenChange,
  onSuccess,
  watchlist,
}: DeleteListDialogProps) {
  const { content } = useLanguageStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      await watchlistsApi.delete(watchlist.id);

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate({ to: '/account/lists' as never });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete watchlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
      }
      title={content.watchlists.deleteWatchlist}
      description={content.watchlists.deleteWatchlistConfirm.replace('{name}', watchlist.name)}
      error={error}
      loading={loading}
      cancelLabel={content.watchlists.cancel}
      confirmLabel={loading ? content.watchlists.deleting : content.watchlists.delete}
      confirmVariant="destructive"
      onConfirm={handleDelete}
    />
  );
}
