import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Watchlist } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Plus, Film, MoreVertical, Edit, Trash2 } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useLanguageStore } from "@/store/language";
import type { Content } from "@/types/content";
import { cn } from "@/lib/cn";
import { OfflineIcon } from "@/components/icons/OfflineIcon";
import { CreateWatchlistDialog } from "@/components/Watchlist/CreateWatchlistDialog";
import { EditWatchlistDialog } from "@/components/Watchlist/EditWatchlistDialog";
import { DeleteWatchlistDialog } from "@/components/Watchlist/DeleteWatchlistDialog";
import { useWatchlistThumbnail } from "@/hooks/useWatchlistThumbnail";
import { getLocalWatchlists } from "@/lib/localStorageHelpers";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

const STORAGE_KEY = "watchlists";

interface WatchlistCardOfflineProps {
  watchlist: Watchlist;
  onEdit: (watchlist: Watchlist) => void;
  onDelete: (watchlist: Watchlist) => void;
  content: Content;
}

function WatchlistCardOffline({
  watchlist,
  onEdit,
  onDelete,
  content,
}: WatchlistCardOfflineProps) {
  const navigate = useNavigate();
  const thumbnailUrl = useWatchlistThumbnail(watchlist);

  return (
    <div className="group cursor-pointer rounded-lg p-2 transition-colors hover:bg-[#36363780]">
      {/* Cover Image */}
      <div
        onClick={() => navigate(`/local/watchlist/${watchlist._id}`)}
        className="relative mb-3 aspect-[1/1] w-full overflow-hidden rounded-md bg-muted"
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={watchlist.name}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Film className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Text Info */}
      <h3
        onClick={() => navigate(`/local/watchlist/${watchlist._id}`)}
        className="line-clamp-2 text-sm font-semibold text-white"
      >
        {watchlist.name}
      </h3>

      <div className="mt-2 text-xs">
        <span
          onClick={() => navigate(`/local/watchlist/${watchlist._id}`)}
          className="text-muted-foreground"
        >
          {watchlist.isPublic
            ? content.watchlists.public
            : content.watchlists.private}
        </span>
      </div>

      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span onClick={() => navigate(`/local/watchlist/${watchlist._id}`)}>
          {watchlist.items.length}{" "}
          {watchlist.items.length === 1
            ? content.watchlists.item
            : content.watchlists.items}
        </span>

        {/* More Menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex h-6 w-6 items-center justify-center rounded opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[180px] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-md"
              sideOffset={5}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              {/* Edit */}
              <DropdownMenu.Item
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                onSelect={() => {
                  onEdit(watchlist);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                <span>{content.watchlists.editWatchlist}</span>
              </DropdownMenu.Item>

              {/* Delete */}
              <DropdownMenu.Item
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-red-500 outline-none transition-colors hover:bg-red-500/10 hover:text-red-500"
                onSelect={() => {
                  onDelete(watchlist);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>{content.watchlists.deleteWatchlist}</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
}

export function WatchlistsOffline() {
  const { content } = useLanguageStore();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(
    null,
  );

  const fetchWatchlists = () => {
    try {
      setLoading(true);
      const localWatchlists = getLocalWatchlists();
      // Only show watchlists created locally (ownerId === "offline")
      const ownedWatchlists = localWatchlists.filter(w => w.ownerId === "offline");
      setWatchlists(ownedWatchlists);
    } catch (error) {
      console.error("Failed to load watchlists from localStorage:", error);
      setWatchlists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlists();
  }, []);

  const handleCreateSuccess = (newWatchlist?: Watchlist) => {
    if (newWatchlist) {
      // Save to localStorage
      const updatedWatchlists = [...watchlists, newWatchlist];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWatchlists));
    }
    fetchWatchlists();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-white">
          {content.watchlists.title}
        </h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">
            {content.watchlists.loading}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto mb-32 px-4 py-8">
      <div className="mb-8 mt-9 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-white">
            {content.watchlists.title}
          </h1>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {content.watchlists.createWatchlist}
        </Button>
      </div>

      <CreateWatchlistDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleCreateSuccess}
        offline={true}
      />

      {selectedWatchlist && (
        <>
          <EditWatchlistDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={fetchWatchlists}
            watchlist={selectedWatchlist}
            offline={true}
          />
          <DeleteWatchlistDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onSuccess={fetchWatchlists}
            watchlist={selectedWatchlist}
            offline={true}
          />
        </>
      )}

      {/* Data Source Badge */}
      <div className="mb-6">
        <div className="flex w-fit items-center gap-1">
          <p className="text-sm font-light text-slate-300">
            {content.watchlists.notLoggedInWarning}
          </p>
          <OfflineIcon className={cn("h-4 w-4 text-slate-300")} />
        </div>
      </div>

      {watchlists.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Film className="h-8 w-8 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>
              {content.watchlists.noWatchlists}
            </EmptyTitle>
            <EmptyDescription>
              {content.watchlists.createWatchlistDescription}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {watchlists.map((watchlist) => (
            <WatchlistCardOffline
              key={watchlist._id}
              watchlist={watchlist}
              onEdit={(wl) => {
                setSelectedWatchlist(wl);
                setEditDialogOpen(true);
              }}
              onDelete={(wl) => {
                setSelectedWatchlist(wl);
                setDeleteDialogOpen(true);
              }}
              content={content}
            />
          ))}
        </div>
      )}
    </div>
  );
}
