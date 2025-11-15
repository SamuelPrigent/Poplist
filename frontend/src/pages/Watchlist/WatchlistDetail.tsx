import { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { watchlistAPI, type Watchlist } from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";
import { WatchlistHeader } from "@/components/Watchlist/WatchlistHeader";
import { WatchlistItemsTable } from "@/components/Watchlist/WatchlistItemsTable";
import { AddItemModal } from "@/components/Watchlist/AddItemModal";
import { EditWatchlistDialog, type EditWatchlistDialogRef } from "@/components/Watchlist/EditWatchlistDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLanguageStore } from "@/store/language";

export function WatchlistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { content } = useLanguageStore();
  const { isAuthenticated, user } = useAuth();
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const editDialogRef = useRef<EditWatchlistDialogRef>(null);

  const fetchWatchlist = useCallback(async () => {
    if (!id) {
      navigate("/account/watchlists", { replace: true });
      return;
    }

    try {
      setLoading(true);
      setNotFound(false);

      let data;
      if (isAuthenticated) {
        // Authenticated users use the regular endpoint (includes ownership check)
        const response = await watchlistAPI.getById(id);
        data = response.watchlist;

        // Check if current user is the owner by comparing emails
        const ownerEmail = typeof data.ownerId === "string"
          ? null
          : data.ownerId?.email;
        const isUserOwner = user?.email === ownerEmail;
        setIsOwner(isUserOwner);

        // TODO: Check if watchlist is saved (will be implemented when backend is ready)
        setIsSaved(false);
      } else {
        // Unauthenticated users use the public endpoint
        const response = await watchlistAPI.getPublic(id);
        data = response.watchlist;
        setIsOwner(false); // Public viewers are never owners
        setIsSaved(false);
      }

      setWatchlist(data);
    } catch (err) {
      console.error("Failed to fetch watchlist:", err);
      // Show 404 page instead of redirecting
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, isAuthenticated, user]);

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
          <Button onClick={() => navigate("/account/watchlists")}>
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

  const handleShare = async () => {
    if (!id) return;

    const url = `${window.location.origin}/account/watchlist/${id}`;

    try {
      await navigator.clipboard.writeText(url);
      console.log("✅ Lien copié dans le presse-papier:", url);
    } catch (error) {
      console.error("❌ Failed to copy link:", error);
    }
  };

  const handleToggleSave = async () => {
    if (!id || !isAuthenticated || isOwner) return;

    try {
      if (isSaved) {
        await watchlistAPI.unsaveWatchlist(id);
        setIsSaved(false);
        console.log("✅ Watchlist retirée de votre bibliothèque");
      } else {
        await watchlistAPI.saveWatchlist(id);
        setIsSaved(true);
        console.log("✅ Watchlist ajoutée à votre bibliothèque");
      }
    } catch (error) {
      console.error("❌ Failed to toggle save watchlist:", error);
      console.log("⏳ Cette fonctionnalité sera bientôt disponible!");
    }
  };

  const handleDuplicate = async () => {
    if (!id || !isAuthenticated || isOwner) return;

    try {
      const { watchlist: duplicatedWatchlist } = await watchlistAPI.duplicateWatchlist(id);
      console.log("✅ Watchlist dupliquée avec succès!");
      // Redirect to the new duplicated watchlist
      navigate(`/account/watchlist/${duplicatedWatchlist._id}`);
    } catch (error) {
      console.error("❌ Failed to duplicate watchlist:", error);
      console.log("⏳ Cette fonctionnalité sera bientôt disponible!");
    }
  };

  const handleInviteCollaborator = () => {
    if (!id || !isOwner) return;
    console.log("🔔 Ouverture du modal d'invitation de collaborateur");
    // TODO: Open invite collaborator modal
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background">
      <WatchlistHeader
        watchlist={watchlist}
        actionButton={
          isOwner ? (
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4" />
              {content.watchlists.addItem}
            </Button>
          ) : null
        }
        onEdit={isOwner ? () => setEditModalOpen(true) : undefined}
        onImageClick={isOwner ? handleImageClick : undefined}
        onShare={handleShare}
        onSave={handleToggleSave}
        isSaved={isSaved}
        showSaveButton={isAuthenticated && !isOwner}
        onDuplicate={handleDuplicate}
        showDuplicateButton={isAuthenticated && !isOwner}
        onInviteCollaborator={handleInviteCollaborator}
        showInviteButton={isOwner}
      />

      <div className="container mx-auto px-4 py-8">
        <WatchlistItemsTable
          watchlist={watchlist}
          onUpdate={fetchWatchlist}
        />
      </div>

      {/* Add Item Modal - only for owners */}
      {isOwner && (
        <AddItemModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          watchlist={watchlist}
          onSuccess={fetchWatchlist}
          offline={false}
        />
      )}

      {/* Edit Watchlist Modal - only for owners */}
      {isOwner && (
        <EditWatchlistDialog
          ref={editDialogRef}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSuccess={fetchWatchlist}
          watchlist={watchlist}
          offline={false}
        />
      )}
    </div>
  );
}
