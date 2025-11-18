import { useNavigate } from "react-router-dom";
import { Film, MoreVertical, Edit, Trash2 } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import type { Watchlist } from "@/lib/api-client";
import type { Content } from "@/types/content";
import { useWatchlistThumbnail } from "@/hooks/useWatchlistThumbnail";

interface WatchlistCardProps {
  watchlist: Watchlist;
  content: Content;
  href: string;
  onEdit?: (watchlist: Watchlist) => void;
  onDelete?: (watchlist: Watchlist) => void;
  showMenu?: boolean;
  showOwner?: boolean;
  showVisibility?: boolean;
  showSavedBadge?: boolean;
  categoryGradient?: string;
  draggableProps?: {
    ref: (node: HTMLElement | null) => void;
    style?: React.CSSProperties;
    attributes?: DraggableAttributes;
    listeners?: DraggableSyntheticListeners;
  };
}

export function WatchlistCard({
  watchlist,
  content,
  href,
  onEdit,
  onDelete,
  showMenu = true,
  showOwner = false,
  showVisibility = false,
  showSavedBadge = false,
  categoryGradient,
  draggableProps,
}: WatchlistCardProps) {
  const navigate = useNavigate();
  const thumbnailUrl = useWatchlistThumbnail(watchlist);

  const handleClick = (e: React.MouseEvent) => {
    if (draggableProps) {
      e.stopPropagation();
    }
    navigate(href);
  };

  const cardContent = (
    <>
      {/* Cover Image */}
      <div
        onClick={handleClick}
        className="relative mb-3 aspect-[1/1] w-full overflow-hidden rounded-md bg-muted"
        style={categoryGradient ? { background: categoryGradient } : undefined}
      >
        {categoryGradient ? (
          <div className="relative flex h-full w-full items-center justify-center p-4">
            {/* Dark overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <span className="relative z-10 text-center text-lg font-bold text-white drop-shadow-lg">
              {watchlist.name}
            </span>
          </div>
        ) : thumbnailUrl ? (
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
      <div className="flex items-center gap-2">
        {/* Saved Badge - Indicates this is a followed watchlist */}
        {showSavedBadge && (
          <img
            src="/src/assets/checkGreenFull.svg"
            alt="Suivi"
            className="h-4 w-4 flex-shrink-0"
          />
        )}

        <h3
          onClick={handleClick}
          className="line-clamp-2 text-sm font-semibold text-white"
        >
          {watchlist.name}
        </h3>
      </div>

      {showOwner && (
        <p className="mt-1 text-xs text-muted-foreground" onClick={handleClick}>
          par{" "}
          {typeof watchlist.ownerId === "object"
            ? watchlist.ownerId.username || "Anonyme"
            : "Anonyme"}
        </p>
      )}

      {showVisibility && (
        <div className="mt-1 text-xs text-muted-foreground">
          <span onClick={handleClick}>
            {watchlist.isPublic
              ? content.watchlists.public
              : content.watchlists.private}
          </span>
        </div>
      )}

      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span onClick={handleClick}>
          {watchlist.items.length}{" "}
          {watchlist.items.length === 1
            ? content.watchlists.item
            : content.watchlists.items}
        </span>

        {/* More Menu */}
        {showMenu && onEdit && onDelete && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="ml-auto flex h-6 w-6 items-center justify-center rounded opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[180px] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-md"
                sideOffset={5}
              >
                <DropdownMenu.Item
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                  onSelect={() => onEdit(watchlist)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  <span>{content.watchlists.edit}</span>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-1 h-px bg-border" />

                <DropdownMenu.Item
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-red-500 outline-none transition-colors hover:bg-red-500/10 hover:text-red-500"
                  onSelect={() => onDelete(watchlist)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>{content.watchlists.delete}</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>
    </>
  );

  if (draggableProps) {
    return (
      <div
        ref={draggableProps.ref}
        style={draggableProps.style}
        {...draggableProps.attributes}
        {...draggableProps.listeners}
        className="group cursor-grab rounded-lg p-2 transition-colors hover:bg-[#36363780] active:cursor-grabbing"
      >
        {cardContent}
      </div>
    );
  }

  return (
    <div className="group cursor-pointer rounded-lg p-2 transition-colors hover:bg-[#36363780]">
      {cardContent}
    </div>
  );
}
