/**
 * SDK watchlists — adaptateur fin sur les fonctions client générées par Kubb.
 *
 * L'interface publique (noms, signatures) est conservée : `queries.ts` et les
 * composants ne changent pas. Les URL et le typage des réponses viennent du
 * SDK généré (`shared/src/generated`), lui-même dérivé des schémas zod backend.
 * Les bodies sont typés par les types de requête GÉNÉRÉS (dérivés des
 * validators zod du backend via le spec).
 */
import * as gen from '@poplist/shared/generated/client/watchlistsController/index';
import type {
  CreateWatchlistMutationRequest,
  UpdateWatchlistMutationRequest,
  AddItemToWatchlistMutationRequest,
  SearchTMDBForWatchlistQueryParams,
} from '@poplist/shared/generated';

export const watchlists = {
  // ============== Public ==============

  getPublicFeatured: (limit?: number) =>
    gen.getPublicFeatured(limit === undefined ? undefined : { limit: String(limit) }),

  getPublic: (id: string) => gen.getPublicWatchlist(encodeURIComponent(id)),

  getByGenre: (genre: string) => gen.getWatchlistsByGenre(encodeURIComponent(genre)),

  getCountByGenre: (genre: string) => gen.getWatchlistCountByGenre(encodeURIComponent(genre)),

  searchTMDB: (params: SearchTMDBForWatchlistQueryParams) => gen.searchTMDBForWatchlist(params),

  getItemDetails: (tmdbId: string, type: 'movie' | 'tv', language?: string) =>
    gen.getItemDetails(encodeURIComponent(tmdbId), type, { language }),

  getRecommendations: (id: string, language?: string) =>
    gen.getWatchlistRecommendations(encodeURIComponent(id), { language }),

  // ============== Protected ==============

  getMine: () => gen.getMyWatchlists(),

  getById: (id: string) => gen.getWatchlistById(encodeURIComponent(id)),

  create: (data: CreateWatchlistMutationRequest) => gen.createWatchlist(data),

  update: (id: string, data: UpdateWatchlistMutationRequest) =>
    gen.updateWatchlist(encodeURIComponent(id), data),

  delete: (id: string) => gen.deleteWatchlist(encodeURIComponent(id)),

  reorderWatchlists: (orderedWatchlistIds: string[]) =>
    gen.reorderWatchlists({ orderedWatchlistIds }),

  // Collaborators
  addCollaborator: (id: string, username: string) =>
    gen.addCollaborator(encodeURIComponent(id), { username }),

  removeCollaborator: (id: string, collaboratorId: string) =>
    gen.removeCollaborator(encodeURIComponent(id), encodeURIComponent(collaboratorId)),

  leave: (id: string) => gen.leaveWatchlist(encodeURIComponent(id)),

  // Items
  addItem: (id: string, data: AddItemToWatchlistMutationRequest) =>
    gen.addItemToWatchlist(encodeURIComponent(id), data),

  removeItem: (id: string, tmdbId: string) =>
    gen.removeItemFromWatchlist(encodeURIComponent(id), encodeURIComponent(tmdbId)),

  moveItem: (id: string, tmdbId: string, position: 'first' | 'last') =>
    gen.moveItemPosition(encodeURIComponent(id), encodeURIComponent(tmdbId), { position }),

  reorderItems: (id: string, orderedTmdbIds: string[]) =>
    gen.reorderItems(encodeURIComponent(id), { orderedTmdbIds }),

  // Cover
  uploadCover: (id: string, imageData: string) =>
    gen.uploadCover(encodeURIComponent(id), { imageData }),

  deleteCover: (id: string) => gen.deleteCover(encodeURIComponent(id)),

  // Thumbnail
  generateThumbnail: (id: string) => gen.generateWatchlistThumbnail(encodeURIComponent(id)),

  // Save / Unsave / Duplicate
  save: (id: string) => gen.saveWatchlist(encodeURIComponent(id)),

  unsave: (id: string) => gen.unsaveWatchlist(encodeURIComponent(id)),

  duplicate: (id: string) => gen.duplicateWatchlist(encodeURIComponent(id)),
};
