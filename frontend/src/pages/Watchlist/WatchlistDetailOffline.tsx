import { useCallback, useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import type { Watchlist } from "@/lib/api-client";
import { WatchlistHeader } from "@/components/Watchlist/WatchlistHeader";
import { WatchlistItemsTableOffline } from "@/components/Watchlist/WatchlistItemsTableOffline";
import { AddItemModal } from "@/components/Watchlist/AddItemModal";
import { EditWatchlistDialog, type EditWatchlistDialogRef } from "@/components/Watchlist/EditWatchlistDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLanguageStore } from "@/store/language";

const STORAGE_KEY = "watchlists";

export function WatchlistDetailOffline() {
  const { id } = useParams<{ id: string }>();
  const { content } = useLanguageStore();
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const editDialogRef = useRef<EditWatchlistDialogRef>(null);

  const fetchWatchlist = useCallback(() => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const localWatchlists = localStorage.getItem(STORAGE_KEY);
      if (localWatchlists) {
        const watchlists: Watchlist[] = JSON.parse(localWatchlists);
        const found = watchlists.find((w) => w._id === id);
        if (found) {
          setWatchlist(found);
        } else {
          setError("Watchlist not found");
        }
      } else {
        setError("Watchlist not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load watchlist");
      console.error("Failed to fetch watchlist from localStorage:", err);
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

  if (error || !watchlist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-6 text-center">
          <p className="text-red-500">{error || "Watchlist not found"}</p>
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
    </div>
  );
}
