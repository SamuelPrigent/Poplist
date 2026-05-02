import type { WatchlistsAPI } from '@poplist/shared';
import { apiFetch } from './client';

export const watchlists = {
  // ============== Public ==============

  getPublicFeatured: (limit?: number) =>
    apiFetch<WatchlistsAPI.GetPublicFeaturedResponse>('/watchlists/public/featured', {
      query: { limit },
    }),

  getPublic: (id: string) =>
    apiFetch<WatchlistsAPI.GetPublicWatchlistResponse>(
      `/watchlists/public/${encodeURIComponent(id)}`
    ),

  getByGenre: (genre: string) =>
    apiFetch<WatchlistsAPI.GetWatchlistsByGenreResponse>(
      `/watchlists/by-genre/${encodeURIComponent(genre)}`
    ),

  getCountByGenre: (genre: string) =>
    apiFetch<WatchlistsAPI.GetWatchlistCountByGenreResponse>(
      `/watchlists/count-by-genre/${encodeURIComponent(genre)}`
    ),

  searchTMDB: (params: WatchlistsAPI.SearchTMDBQuery) =>
    apiFetch<WatchlistsAPI.SearchTMDBResponse>('/watchlists/search/tmdb', {
      query: { ...params },
    }),

  getItemDetails: (tmdbId: string, type: 'movie' | 'tv', language?: string) =>
    apiFetch<WatchlistsAPI.GetItemDetailsResponse>(
      `/watchlists/items/${encodeURIComponent(tmdbId)}/${encodeURIComponent(type)}/details`,
      { query: { language } }
    ),

  // ============== Protected ==============

  getMine: () => apiFetch<WatchlistsAPI.GetMyWatchlistsResponse>('/watchlists/mine'),

  getById: (id: string) =>
    apiFetch<WatchlistsAPI.GetWatchlistByIdResponse>(
      `/watchlists/${encodeURIComponent(id)}`
    ),

  create: (data: WatchlistsAPI.CreateWatchlistRequest) =>
    apiFetch<WatchlistsAPI.CreateWatchlistResponse>('/watchlists', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: WatchlistsAPI.UpdateWatchlistRequest) =>
    apiFetch<WatchlistsAPI.UpdateWatchlistResponse>(
      `/watchlists/${encodeURIComponent(id)}`,
      { method: 'PUT', body: data }
    ),

  delete: (id: string) =>
    apiFetch<WatchlistsAPI.DeleteWatchlistResponse>(
      `/watchlists/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    ),

  reorderWatchlists: (orderedWatchlistIds: string[]) =>
    apiFetch<WatchlistsAPI.ReorderWatchlistsResponse>('/watchlists/reorder', {
      method: 'PUT',
      body: { orderedWatchlistIds } satisfies WatchlistsAPI.ReorderWatchlistsRequest,
    }),

  // Collaborators
  addCollaborator: (id: string, username: string) =>
    apiFetch<WatchlistsAPI.AddCollaboratorResponse>(
      `/watchlists/${encodeURIComponent(id)}/collaborators`,
      {
        method: 'POST',
        body: { username } satisfies WatchlistsAPI.AddCollaboratorRequest,
      }
    ),

  removeCollaborator: (id: string, collaboratorId: string) =>
    apiFetch<WatchlistsAPI.RemoveCollaboratorResponse>(
      `/watchlists/${encodeURIComponent(id)}/collaborators/${encodeURIComponent(collaboratorId)}`,
      { method: 'DELETE' }
    ),

  leave: (id: string) =>
    apiFetch<WatchlistsAPI.LeaveWatchlistResponse>(
      `/watchlists/${encodeURIComponent(id)}/leave`,
      { method: 'POST' }
    ),

  // Items
  addItem: (id: string, data: WatchlistsAPI.AddItemRequest) =>
    apiFetch<WatchlistsAPI.AddItemResponse>(
      `/watchlists/${encodeURIComponent(id)}/items`,
      { method: 'POST', body: data }
    ),

  removeItem: (id: string, tmdbId: string) =>
    apiFetch<WatchlistsAPI.RemoveItemResponse>(
      `/watchlists/${encodeURIComponent(id)}/items/${encodeURIComponent(tmdbId)}`,
      { method: 'DELETE' }
    ),

  moveItem: (id: string, tmdbId: string, position: 'first' | 'last') =>
    apiFetch<WatchlistsAPI.MoveItemResponse>(
      `/watchlists/${encodeURIComponent(id)}/items/${encodeURIComponent(tmdbId)}/position`,
      {
        method: 'PUT',
        body: { position } satisfies WatchlistsAPI.MoveItemRequest,
      }
    ),

  reorderItems: (id: string, orderedTmdbIds: string[]) =>
    apiFetch<WatchlistsAPI.ReorderItemsResponse>(
      `/watchlists/${encodeURIComponent(id)}/items/reorder`,
      {
        method: 'PUT',
        body: { orderedTmdbIds } satisfies WatchlistsAPI.ReorderItemsRequest,
      }
    ),

  // Cover
  uploadCover: (id: string, imageData: string) =>
    apiFetch<WatchlistsAPI.UploadCoverResponse>(
      `/watchlists/${encodeURIComponent(id)}/upload-cover`,
      {
        method: 'POST',
        body: { imageData } satisfies WatchlistsAPI.UploadCoverRequest,
      }
    ),

  deleteCover: (id: string) =>
    apiFetch<WatchlistsAPI.DeleteCoverResponse>(
      `/watchlists/${encodeURIComponent(id)}/cover`,
      { method: 'DELETE' }
    ),

  // Thumbnail
  generateThumbnail: (id: string) =>
    apiFetch<WatchlistsAPI.GenerateThumbnailResponse>(
      `/watchlists/${encodeURIComponent(id)}/generate-thumbnail`,
      { method: 'POST' }
    ),

  // Save / Unsave / Duplicate
  save: (id: string) =>
    apiFetch<WatchlistsAPI.SaveWatchlistResponse>(
      `/watchlists/${encodeURIComponent(id)}/like-and-save`,
      { method: 'POST' }
    ),

  unsave: (id: string) =>
    apiFetch<WatchlistsAPI.UnsaveWatchlistResponse>(
      `/watchlists/${encodeURIComponent(id)}/unlike-and-unsave`,
      { method: 'DELETE' }
    ),

  duplicate: (id: string) =>
    apiFetch<WatchlistsAPI.DuplicateWatchlistResponse>(
      `/watchlists/${encodeURIComponent(id)}/duplicate`,
      { method: 'POST' }
    ),
};
