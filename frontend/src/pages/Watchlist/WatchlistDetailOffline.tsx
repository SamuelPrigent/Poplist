import { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Watchlist } from "@/lib/api-client";
import { WatchlistHeader } from "@/components/Watchlist/WatchlistHeader";
import { WatchlistItemsTableOffline } from "@/components/Watchlist/WatchlistItemsTableOffline";
import { AddItemModal } from "@/components/Watchlist/AddItemModal";
import {
  EditWatchlistDialog,
  type EditWatchlistDialogRef,
} from "@/components/Watchlist/EditWatchlistDialog";
import { DeleteWatchlistDialog } from "@/components/Watchlist/DeleteWatchlistDialog";
import { Button } from "@/components/ui/button";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Plus, Pencil, Trash2 } from "lucide-react";
import pointIcon from "@/assets/points.svg";
import { useLanguageStore } from "@/store/language";
import { getLocalWatchlists } from "@/lib/localStorageHelpers";

export function WatchlistDetailOffline() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { content } = useLanguageStore();
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const editDialogRef = useRef<EditWatchlistDialogRef>(null);

  const fetchWatchlist = useCallback(() => {
    if (!id) return;

    try {
      setLoading(true);
      setNotFound(false);
      const watchlists = getLocalWatchlists();
      const found = watchlists.find((w) => w._id === id);

      if (found && found.ownerId === "offline") {
        setWatchlist(found);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error("Failed to fetch watchlist from localStorage:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">
            {content.watchlists.loading}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !watchlist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
          <div className="rounded-full bg-muted p-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-16 w-16 text-muted-foreground"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Watchlist introuvable</h1>
            <p className="mt-2 text-muted-foreground">
              Cette watchlist n'existe pas ou a été supprimée.
            </p>
          </div>
          <Button onClick={() => navigate("/local/watchlists")}>
            Retour à mes watchlists
          </Button>
        </div>
      </div>
    );
  }

  const handleImageClick = () => {
    setEditModalOpen(true);
    // Open file picker after a short delay to ensure modal is open
    setTimeout(() => {
      editDialogRef.current?.openFilePicker();
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background">
      <WatchlistHeader
        watchlist={watchlist}
        actionButton={
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4" />
            {content.watchlists.addItem}
          </Button>
        }
        menuButton={
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="select-none rounded-full p-3 transition-all hover:scale-105 outline-none focus:outline-none focus-visible:outline-none data-[state=open]:outline-none data-[state=closed]:outline-none">
                <img
                  src={pointIcon}
                  alt="Menu"
                  className="h-8 w-8 opacity-60 brightness-0 invert transition-all hover:opacity-100"
                />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[200px] overflow-hidden rounded-md border border-border bg-background p-1 shadow-md"
                sideOffset={5}
              >
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground"
                  onClick={() => setEditModalOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                  <span>{content.watchlists.editWatchlist}</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-red-500 outline-none transition-colors hover:bg-red-500/10 focus:outline-none focus-visible:bg-red-500/10"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{content.watchlists.deleteWatchlist}</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        }
        onEdit={() => setEditModalOpen(true)}
        onImageClick={handleImageClick}
      />

      <div className="container mx-auto px-4 py-8">
        <WatchlistItemsTableOffline watchlist={watchlist} />
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        watchlist={watchlist}
        onSuccess={fetchWatchlist}
        offline={true}
      />

      {/* Edit Watchlist Modal */}
      <EditWatchlistDialog
        ref={editDialogRef}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={fetchWatchlist}
        watchlist={watchlist}
        offline={true}
      />

      {/* Delete Watchlist Dialog */}
      <DeleteWatchlistDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        watchlist={watchlist}
        onSuccess={() => navigate("/local/watchlists")}
        offline={true}
      />
    </div>
  );
}
