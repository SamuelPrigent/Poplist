'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Pencil, Plus, Trash2, UserPlus, Users } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AddCollaboratorPopover } from '@/components/List/AddCollaboratorPopover';
import {
  LIST_HEADER_BUTTON_CLASS,
  LIST_HEADER_ICON_CLASS,
  ListHeader,
} from '@/components/List/ListHeader';
import { ListItemsTable } from '@/components/List/ListItemsTable';
import { AddItemModal } from '@/components/List/modal/AddItemModal';
import { DeleteListDialog } from '@/components/List/modal/DeleteListDialog';
import { EditListDialog, type EditListDialogRef } from '@/components/List/modal/EditListDialog';
import { LeaveListDialog } from '@/components/List/modal/LeaveListDialog';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { useAuth } from '@/context/auth-context';
import { type Collaborator, type Watchlist, watchlistAPI } from '@/lib/api-client';
import { useLanguageStore } from '@/store/language';

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { content } = useLanguageStore();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const editDialogRef = useRef<EditListDialogRef>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const id = params.id as string;

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const fetchWatchlist = useCallback(async () => {
    if (!id) {
      router.replace('/account/lists');
      return;
    }

    try {
      setLoading(true);
      setNotFound(false);

      let data: Watchlist;
      if (isAuthenticated) {
        const response = await watchlistAPI.getById(id);
        data = response.watchlist;

        const ownerEmail = data.owner?.email || null;
        const isUserOwner = user?.email === ownerEmail;
        setIsOwner(isUserOwner);
        setIsCollaborator(response.isCollaborator || false);
        setIsSaved(response.isSaved || false);
      } else {
        // Non authentifié : essayer d'accéder à la version publique
        const response = await watchlistAPI.getPublic(id);
        data = response.watchlist;
        setIsOwner(false);
        setIsCollaborator(false);
        setIsSaved(false);
      }

      setWatchlist(data);
    } catch (err) {
      console.error('Failed to fetch watchlist:', err);
      const errorMessage = err instanceof Error ? err.message : '';

      // Si non authentifié et accès refusé → watchlist privée, rediriger vers /home
      if (!isAuthenticated) {
        router.replace('/home');
        return;
      }

      // Si authentifié mais accès refusé (pas owner/collaborateur d'une liste privée)
      if (
        errorMessage.includes('not found') ||
        errorMessage.includes('Forbidden') ||
        errorMessage.includes('Unauthorized')
      ) {
        router.replace('/home');
        return;
      }

      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id, router, isAuthenticated, user]);

  // Handle watchlist updates - accepts optional updated watchlist for direct state updates
  const handleWatchlistUpdate = useCallback(
    (updatedWatchlist?: Watchlist) => {
      if (updatedWatchlist) {
        // Direct state update without refetching (no loading flicker)
        setWatchlist(updatedWatchlist);
      } else {
        // Full refetch when no data provided
        fetchWatchlist();
      }
    },
    [fetchWatchlist]
  );

  useEffect(() => {
    // Wait for auth to be resolved before fetching
    if (!authLoading) {
      fetchWatchlist();
    }
  }, [authLoading, fetchWatchlist]);

  if (loading) {
    return null;
  }

  if (notFound || !watchlist) {
    return (
      <div className="container mx-auto mb-32 w-(--sectionWidth) max-w-(--maxWidth) px-4 py-8">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
          <div className="bg-muted rounded-full p-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="text-muted-foreground h-16 w-16"
            >
              <title>Watchlist not found icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Watchlist introuvable</h1>
            <p className="text-muted-foreground mt-2">
              Cette watchlist n&apos;existe pas ou a été supprimée.
            </p>
          </div>
          <Button onClick={() => router.push('/lists')}>Retour aux listes</Button>
        </div>
      </div>
    );
  }

  const handleImageClick = () => {
    setEditModalOpen(true);
    setTimeout(() => {
      editDialogRef.current?.openFilePicker();
    }, 300);
  };

  const handleShare = async () => {
    if (!id) return;

    const url = `${window.location.origin}/lists/${id}`;

    try {
      await navigator.clipboard.writeText(url);
      toast.success(content.watchlists.toasts?.linkCopied || 'Link copied');
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error(content.watchlists.toasts?.linkCopyError || 'Failed to copy link');
    }
  };

  const handleToggleSave = async () => {
    if (!id || !isAuthenticated || isOwner || !watchlist) return;

    const previousIsSaved = isSaved;
    const previousLikedBy = watchlist.likedBy;
    const previousWatchlist = { ...watchlist };

    try {
      const newIsSaved = !isSaved;
      setIsSaved(newIsSaved);

      const currentLikedBy = watchlist.likedBy || [];
      const updatedWatchlist = {
        ...watchlist,
        likedBy: newIsSaved
          ? [
              ...currentLikedBy,
              { id: user?.id || '', email: user?.email || '', username: user?.username || '' },
            ]
          : currentLikedBy.filter(u => u.id !== user?.id),
      };
      setWatchlist(updatedWatchlist as Watchlist);

      if (previousIsSaved) {
        await watchlistAPI.unsaveWatchlist(id);
        toast.success(content.watchlists.toasts?.listUnsaved || 'List removed');
      } else {
        await watchlistAPI.saveWatchlist(id);
        toast.success(content.watchlists.toasts?.listSaved || 'List added');
      }
    } catch (error) {
      console.error('Failed to toggle save watchlist:', error);
      toast.error(content.watchlists.toasts?.listSaveError || 'Failed to update list');

      setIsSaved(previousIsSaved);
      setWatchlist({
        ...previousWatchlist,
        likedBy: previousLikedBy,
      });
    }
  };

  const handleDuplicate = async () => {
    if (!id || !isAuthenticated || isOwner) return;

    const loadingToast = toast.loading(content.watchlists.toasts?.duplicating || 'Duplicating...');

    try {
      const { watchlist: duplicatedWatchlist } = await watchlistAPI.duplicateWatchlist(id);

      toast.success(content.watchlists.toasts?.listDuplicated || 'List duplicated', { id: loadingToast });
      router.push(`/lists/${duplicatedWatchlist.id}`);
    } catch (error) {
      console.error('Failed to duplicate watchlist:', error);
      toast.error(content.watchlists.toasts?.duplicateError || 'Failed to duplicate list', { id: loadingToast });
    }
  };

  const getCollaborators = (): Collaborator[] => {
    if (!watchlist || !watchlist.collaborators) return [];
    return watchlist.collaborators.filter(
      (c): c is Collaborator => typeof c === 'object' && c !== null
    );
  };

  return (
    <div className="from-background via-background/95 to-background mb-16 min-h-screen bg-linear-to-b">
      <ListHeader
        watchlist={watchlist}
        actionButton={
          isOwner || isCollaborator ? (
            <Button
              className="corner-squircle focus-visible:ring-offset-background cursor-pointer rounded-2xl focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
              onClick={() => setAddModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              {content.watchlists.addItem}
            </Button>
          ) : null
        }
        menuButton={
          isOwner ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button type="button" className={LIST_HEADER_BUTTON_CLASS}>
                  <Image
                    src="/points.svg"
                    alt="Menu"
                    width={24}
                    height={24}
                    className={`${LIST_HEADER_ICON_CLASS} brightness-0 invert`}
                  />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="border-border bg-background z-50 min-w-[200px] overflow-hidden rounded-md border p-1 shadow-md"
                  sideOffset={5}
                  onCloseAutoFocus={e => {
                    e.preventDefault();
                  }}
                >
                  <DropdownMenu.Item
                    className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex cursor-pointer gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors outline-none"
                    onClick={() => setEditModalOpen(true)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span>{content.watchlists.editWatchlist}</span>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-500 transition-colors outline-none hover:bg-red-500/10 hover:text-red-500 focus:bg-red-500/10 focus:text-red-500"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{content.watchlists.deleteWatchlist}</span>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : null
        }
        onEdit={isOwner ? () => setEditModalOpen(true) : undefined}
        onImageClick={isOwner ? handleImageClick : undefined}
        onShare={handleShare}
        onSave={handleToggleSave}
        isSaved={isSaved}
        showSaveButton={isAuthenticated && !isOwner && !isCollaborator}
        onDuplicate={handleDuplicate}
        showDuplicateButton={isAuthenticated && !isOwner && !isCollaborator}
        collaboratorButton={
          isOwner && id ? (
            <AddCollaboratorPopover
              watchlistId={id}
              collaborators={getCollaborators()}
              onCollaboratorsChange={collaborators => {
                setWatchlist(prev => (prev ? { ...prev, collaborators } : null));
              }}
            >
              <button
                type="button"
                className={LIST_HEADER_BUTTON_CLASS}
                title={content.watchlists.tooltips.inviteCollaborator}
              >
                {getCollaborators().length > 0 ? (
                  <Users className={`${LIST_HEADER_ICON_CLASS} text-white`} />
                ) : (
                  <UserPlus className={`${LIST_HEADER_ICON_CLASS} text-white`} />
                )}
              </button>
            </AddCollaboratorPopover>
          ) : isCollaborator ? (
            <button
              type="button"
              onClick={() => setLeaveDialogOpen(true)}
              className={LIST_HEADER_BUTTON_CLASS}
              title={content.watchlists.collaborators?.leaveTitle || 'Quitter la watchlist'}
            >
              <Image
                src="/cancelUser.svg"
                alt="Leave"
                width={24}
                height={24}
                className={`${LIST_HEADER_ICON_CLASS} brightness-0 invert`}
              />
            </button>
          ) : null
        }
      />

      <div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 py-8">
        <ListItemsTable
          watchlist={watchlist}
          onUpdate={handleWatchlistUpdate}
          isOwner={isOwner}
          isCollaborator={isCollaborator}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
        />

        {watchlist.items.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(watchlist.items.length / itemsPerPage)}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={watchlist.items.length}
            onItemsPerPageChange={newItemsPerPage => {
              setItemsPerPage(newItemsPerPage);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {(isOwner || isCollaborator) && (
        <AddItemModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          watchlist={watchlist}
          onSuccess={fetchWatchlist}
          offline={false}
        />
      )}

      {isOwner && (
        <EditListDialog
          ref={editDialogRef}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSuccess={fetchWatchlist}
          watchlist={watchlist}
          offline={false}
        />
      )}

      {isOwner && (
        <DeleteListDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          watchlist={watchlist}
          onSuccess={() => router.push('/account/lists')}
          offline={false}
        />
      )}

      {isCollaborator && !isOwner && id !== undefined && (
        <LeaveListDialog
          open={leaveDialogOpen}
          onOpenChange={setLeaveDialogOpen}
          watchlistId={id}
          watchlistName={watchlist.name}
        />
      )}
    </div>
  );
}
