'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Route as ListDetailRoute } from '@/routes/lists/$id';
import { Pencil, Plus, Trash2, UserPlus, Users } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ClientOnly } from '@/components/ui/ClientOnly';
import { toast } from 'sonner';

import { watchlists as watchlistsApi, type Collaborator, type Watchlist } from '@/api';
import { watchlistsQueries } from '@/api/queries';
import { AddCollaboratorPopover } from '@/components/List/AddCollaboratorPopover';
import {
  LIST_HEADER_BUTTON_CLASS,
  LIST_HEADER_ICON_CLASS,
  ListHeader,
} from '@/components/List/ListHeader';
import { ListItemsTable } from '@/components/List/ListItemsTable';
import { ListRecommendations } from '@/components/List/ListRecommendations';
import type { EditListDialogRef } from '@/components/List/modal/EditListDialog';
import { Img as Image } from '@/components/ui/Img';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { useAuth } from '@/context/auth-context';
import { useLanguageStore } from '@/store/language';
import { useListPaginationStore } from '@/store/listPagination';

// Lazy : ces modals ne sont rendus que lorsque ouverts. Pas de SSR (par défaut
// de React.lazy, ils chargent côté client uniquement quand le composant tente
// de se rendre).
const AddItemModal = lazy(() => import('@/components/List/modal/AddItemModal').then(m => ({ default: m.AddItemModal })));
const DeleteListDialog = lazy(() => import('@/components/List/modal/DeleteListDialog').then(m => ({ default: m.DeleteListDialog })));
const EditListDialog = lazy(() => import('@/components/List/modal/EditListDialog').then(m => ({ default: m.EditListDialog })));
const LeaveListDialog = lazy(() => import('@/components/List/modal/LeaveListDialog').then(m => ({ default: m.LeaveListDialog })));

export default function ListDetailPage() {
  const params = useParams({ strict: false }) as { id: string };
  const id = params.id;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { content } = useLanguageStore();
  const { user } = useAuth();

  // `isAuthenticated` est déterminé côté serveur via cookie (beforeLoad), donc
  // cohérent entre SSR et client. Plus de dépendance au localStorage/useEffect.
  const { isAuthenticated } = ListDetailRoute.useRouteContext();

  // UNE seule query selon l'auth state. Le loader a déjà setQueryData pour la
  // bonne clé. Référence stable, plus de 2e render quand l'autre query résout.
  // Cast `as never` car le type union (byId | publicById) ne plait pas au
  // checker statique de useQuery — runtime parfaitement OK car queryFn et
  // queryKey sont cohérents par branche.
  const activeQueryOptions = isAuthenticated
    ? watchlistsQueries.byId(id)
    : watchlistsQueries.publicById(id);
  const { data, isPending, isError } = useQuery({
    ...activeQueryOptions,
    enabled: !!id,
    retry: false,
  } as never) as {
    data: { watchlist: Watchlist; isOwner?: boolean; isCollaborator?: boolean; isSaved?: boolean } | undefined;
    isPending: boolean;
    isError: boolean;
  };

  const watchlist: Watchlist | null = data?.watchlist ?? null;
  const isOwner = data?.isOwner ?? false;
  const isCollaborator = data?.isCollaborator ?? false;
  const isSaved = data?.isSaved ?? false;

  // États de chargement et erreur dérivés (simplifiés : une seule query)
  const stillPending = isPending;
  const isMissing = !watchlist && !stillPending && (isError || !data);

  // Redirection vers /home si non-auth et liste introuvable / privée
  useEffect(() => {
    if (!isAuthenticated && (isError || (!isPending && !watchlist))) {
      navigate({ to: '/home' as never, replace: true });
    }
  }, [isAuthenticated, isError, isPending, watchlist, navigate]);

  // Pagination — préférence persistée globalement via Zustand (30, 60, ou 'all').
  // L'effective items-per-page est borné au total → "Tout" highlighté quand pref >= total.
  const [currentPage, setCurrentPage] = useState(1);
  const { itemsPerPage: itemsPerPagePref, setItemsPerPage: setItemsPerPagePref } =
    useListPaginationStore();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const editDialogRef = useRef<EditListDialogRef>(null);

  // Scroll to top when page changes (utile uniquement en mode paginé)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Helper pour invalider les deux queries après mutation
  const invalidateWatchlist = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['watchlists', id] });
    queryClient.invalidateQueries({ queryKey: ['watchlists', 'mine'] });
  }, [queryClient, id]);

  // Helper pour update direct du cache TQ (après edit/add item/etc.)
  const setCachedWatchlist = useCallback(
    (updated: Watchlist) => {
      const publicKey = watchlistsQueries.publicById(id).queryKey;
      const authKey = watchlistsQueries.byId(id).queryKey;
      const currentPublic = queryClient.getQueryData(publicKey);
      if (currentPublic) {
        queryClient.setQueryData(publicKey, { ...currentPublic, watchlist: updated });
      }
      const currentAuth = queryClient.getQueryData(authKey);
      if (currentAuth) {
        queryClient.setQueryData(authKey, { ...currentAuth, watchlist: updated });
      }
    },
    [queryClient, id]
  );

  const handleWatchlistUpdate = useCallback(
    (updatedWatchlist?: Watchlist) => {
      if (updatedWatchlist) {
        setCachedWatchlist(updatedWatchlist);
      } else {
        invalidateWatchlist();
      }
      queryClient.invalidateQueries({ queryKey: ['watchlists', 'mine'] });
    },
    [setCachedWatchlist, invalidateWatchlist]
  );

  if (stillPending) {
    return (
      <div className="from-background via-background/95 to-background mb-16 min-h-screen bg-linear-to-b">
        <div className="bg-muted/20 h-[340px] w-full animate-pulse" />
        <div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 py-8">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-muted/30 h-16 w-full animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isMissing || !watchlist) {
    return (
      <div className="container mx-auto mb-32 max-[749px]:mb-10 w-(--sectionWidth) max-w-(--maxWidth) px-4 py-8">
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
          <Button onClick={() => navigate({ to: '/lists' as never })}>Retour aux listes</Button>
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
    if (!id || !isAuthenticated || isOwner) return;

    const authKey = watchlistsQueries.byId(id).queryKey;
    const previousAuth = queryClient.getQueryData(authKey);
    const previousIsSaved = isSaved;
    const previousLikedBy = watchlist.likedBy;

    const newIsSaved = !isSaved;
    const currentLikedBy = watchlist.likedBy || [];
    const updatedWatchlist = {
      ...watchlist,
      likedBy: newIsSaved
        ? [
            ...currentLikedBy,
            {
              id: user?.id || '',
              email: user?.email || '',
              username: user?.username || '',
              avatarUrl: user?.avatarUrl ?? null,
            },
          ]
        : currentLikedBy.filter(u => u.id !== user?.id),
    };

    // Optimistic update du cache
    if (previousAuth) {
      queryClient.setQueryData(authKey, {
        ...previousAuth,
        watchlist: updatedWatchlist,
        isSaved: newIsSaved,
      });
    }
    setCachedWatchlist(updatedWatchlist as Watchlist);

    try {
      if (previousIsSaved) {
        await watchlistsApi.unsave(id);
        toast.success(content.watchlists.toasts?.listUnsaved || 'List removed');
      } else {
        await watchlistsApi.save(id);
        toast.success(content.watchlists.toasts?.listSaved || 'List added');
      }
      queryClient.invalidateQueries({ queryKey: ['watchlists', 'mine'] });
    } catch (error) {
      console.error('Failed to toggle save watchlist:', error);
      toast.error(content.watchlists.toasts?.listSaveError || 'Failed to update list');
      // Rollback
      if (previousAuth) {
        queryClient.setQueryData(authKey, previousAuth);
      }
      setCachedWatchlist({ ...watchlist, likedBy: previousLikedBy });
    }
  };

  const handleDuplicate = async () => {
    if (!id || !isAuthenticated || isOwner) return;
    const loadingToast = toast.loading(content.watchlists.toasts?.duplicating || 'Duplicating...');
    try {
      const { watchlist: duplicatedWatchlist } = await watchlistsApi.duplicate(id);
      toast.success(content.watchlists.toasts?.listDuplicated || 'List duplicated', {
        id: loadingToast,
      });
      queryClient.invalidateQueries({ queryKey: ['watchlists', 'mine'] });
      if (duplicatedWatchlist) {
        navigate({ to: `/lists/${duplicatedWatchlist.id}` as never });
      }
    } catch (error) {
      console.error('Failed to duplicate watchlist:', error);
      toast.error(content.watchlists.toasts?.duplicateError || 'Failed to duplicate list', {
        id: loadingToast,
      });
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
                setCachedWatchlist({ ...watchlist, collaborators });
                queryClient.invalidateQueries({ queryKey: ['watchlists', 'mine'] });
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
        {(() => {
          const totalItems = watchlist.items.length;
          // Convertit la pref ('all' | number) en valeur exploitable, bornée au total.
          // Bornage au total → "Tout" est highlighté quand la pref est >= total.
          const prefAsNumber =
            itemsPerPagePref === 'all' ? Number.POSITIVE_INFINITY : itemsPerPagePref;
          const effectiveItemsPerPage = Math.min(prefAsNumber, totalItems);
          const totalPages = Math.ceil(totalItems / effectiveItemsPerPage);

          return (
            <>
              <ListItemsTable
                watchlist={watchlist}
                onUpdate={handleWatchlistUpdate}
                isOwner={isOwner}
                isCollaborator={isCollaborator}
                currentPage={currentPage}
                itemsPerPage={effectiveItemsPerPage}
              />

              {totalItems > 0 && (
                <div
                  // Une seule page → la barre ne rend que des placeholders
                  // invisibles (py-4 + h-9) : on la masque sur mobile pour ne
                  // pas creuser un vide entre les items et les recommandations.
                  className={totalPages <= 1 ? 'max-[749px]:hidden' : undefined}
                >
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={effectiveItemsPerPage}
                  totalItems={totalItems}
                  onItemsPerPageChange={newItemsPerPage => {
                    // Click sur "Tout" → Pagination renvoie totalItems → on stocke 'all'
                    // pour préserver la sémantique sur les futures listes consultées.
                    setItemsPerPagePref(newItemsPerPage === totalItems ? 'all' : newItemsPerPage);
                    setCurrentPage(1);
                  }}
                />
                </div>
              )}
            </>
          );
        })()}

        <ClientOnly>
          <ListRecommendations
            watchlist={watchlist}
            isOwner={isOwner}
            isCollaborator={isCollaborator}
          />
        </ClientOnly>
      </div>

      {/*
        Modaux lazy isolés dans `<ClientOnly>` + `<Suspense fallback={null}>`.
        ClientOnly = équivalent du `dynamic(..., { ssr: false })` de Next :
        le composant n'est PAS rendu côté serveur ni en first paint client,
        seulement après le mount. Ça évite que le chargement du chunk lazy
        suspende la page parente (ce qui causait le "disparait → réapparait"
        à T+2s qu'on a vu sur cette page).
      */}
      {(isOwner || isCollaborator) && (
        <ClientOnly>
          <Suspense fallback={null}>
            <AddItemModal
              open={addModalOpen}
              onOpenChange={setAddModalOpen}
              watchlist={watchlist}
              onSuccess={() => { invalidateWatchlist(); }}
              offline={false}
            />
          </Suspense>
        </ClientOnly>
      )}

      {isOwner && (
        <ClientOnly>
          <Suspense fallback={null}>
            <EditListDialog
              ref={editDialogRef}
              open={editModalOpen}
              onOpenChange={setEditModalOpen}
              onSuccess={() => { invalidateWatchlist(); }}
              watchlist={watchlist}
              offline={false}
            />
          </Suspense>
        </ClientOnly>
      )}

      {isOwner && (
        <ClientOnly>
          <Suspense fallback={null}>
            <DeleteListDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              watchlist={watchlist}
              onSuccess={() => {
                queryClient.removeQueries({ queryKey: ['watchlists', id] });
                queryClient.invalidateQueries({ queryKey: ['watchlists', 'mine'] });
                navigate({ to: '/account/lists' as never });
              }}
              offline={false}
            />
          </Suspense>
        </ClientOnly>
      )}

      {isCollaborator && !isOwner && id !== undefined && (
        <ClientOnly>
          <Suspense fallback={null}>
            <LeaveListDialog
              open={leaveDialogOpen}
              onOpenChange={setLeaveDialogOpen}
              watchlistId={id}
              watchlistName={watchlist.name}
            />
          </Suspense>
        </ClientOnly>
      )}
    </div>
  );
}
