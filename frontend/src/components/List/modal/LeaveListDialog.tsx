'use client';

import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { ResponsiveConfirmDialog } from '@/components/ui/responsive-confirm-dialog';
import { watchlists as watchlistsApi } from '@/api';
import { useLanguageStore } from '@/store/language';

interface LeaveListDialogProps {
  watchlistId: string;
  watchlistName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeaveListDialog({
  watchlistId,
  watchlistName,
  open,
  onOpenChange,
}: LeaveListDialogProps) {
  const navigate = useNavigate();
  const { content } = useLanguageStore();
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeave = async () => {
    try {
      setIsLeaving(true);
      await watchlistsApi.leave(watchlistId);
      toast.success(
        content.watchlists.collaborators?.leaveSuccess || 'Vous avez quitté la liste'
      );
      onOpenChange(false);
      navigate({ to: '/account/lists' as never });
    } catch (error) {
      console.error('Failed to leave watchlist:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : content.watchlists.collaborators?.leaveError || 'Échec de la sortie de la watchlist'
      );
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <ResponsiveConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={content.watchlists.collaborators?.leaveTitle || 'Quitter la watchlist ?'}
      titleClassName="text-yellow-500"
      description={
        content.watchlists.collaborators?.leaveDescription ||
        `Êtes-vous sûr de vouloir quitter "${watchlistName}" ? Vous perdrez vos droits de collaborateur et ne pourrez plus modifier cette watchlist.`
      }
      loading={isLeaving}
      cancelLabel={content.watchlists.cancel || 'Annuler'}
      confirmLabel={
        isLeaving
          ? content.watchlists.collaborators?.leaving || 'Sortie...'
          : content.watchlists.collaborators?.leave || 'Quitter'
      }
      confirmClassName="bg-yellow-600 text-white hover:bg-yellow-700"
      contentClassName="border-yellow-500/20"
      onConfirm={handleLeave}
    />
  );
}
