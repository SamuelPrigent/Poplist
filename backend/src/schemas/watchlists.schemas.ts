/**
 * Schémas zod des RÉPONSES /watchlists/*.
 *
 * Contrairement aux validators (`../validators/watchlists.validator.ts`) qui ne
 * couvrent que les INPUTS, ces schémas décrivent les réponses. Ils sont la
 * source de vérité qui alimente le spec OpenAPI (`hono-openapi`) puis la
 * génération Kubb (types + hooks).
 *
 * `.meta({ ref })` nomme les composants réutilisables → refs propres dans le
 * spec (`#/components/schemas/Watchlist`) et donc UN seul type généré côté Kubb.
 *
 * Les endpoints typés TMDB (search/tmdb, items/:id/details) vivent dans
 * `tmdb.schemas.ts` pour réutiliser les entités TMDB.
 */
import { z } from 'zod';
import {
  watchlistSchema,
  watchlistOwnerSchema,
  recommendedItemSchema,
  tmdbListResponseSchema,
  fullMediaDetailsSchema,
} from './entities.schemas.js';

// Wrappers réutilisés
const watchlistWrapper = z.object({ watchlist: watchlistSchema });
const watchlistsListWrapper = z.object({ watchlists: z.array(watchlistSchema) });
const messageWrapper = z.object({ message: z.string() });
const collaboratorsWrapper = z.object({ collaborators: z.array(watchlistOwnerSchema) });

// ===== Réponses =====

export const getPublicFeaturedResponseSchema = watchlistsListWrapper.meta({
  ref: 'GetPublicFeaturedResponse',
});
export const getPublicWatchlistResponseSchema = watchlistWrapper.meta({
  ref: 'GetPublicWatchlistResponse',
});
export const getWatchlistsByGenreResponseSchema = watchlistsListWrapper.meta({
  ref: 'GetWatchlistsByGenreResponse',
});
export const getWatchlistCountByGenreResponseSchema = z
  .object({ genre: z.string(), count: z.number() })
  .meta({ ref: 'GetWatchlistCountByGenreResponse' });
export const getMyWatchlistsResponseSchema = watchlistsListWrapper.meta({
  ref: 'GetMyWatchlistsResponse',
});
export const getWatchlistByIdResponseSchema = z
  .object({
    watchlist: watchlistSchema,
    isSaved: z.boolean(),
    isOwner: z.boolean(),
    isCollaborator: z.boolean(),
  })
  .meta({ ref: 'GetWatchlistByIdResponse' });
export const createWatchlistResponseSchema = watchlistWrapper.meta({
  ref: 'CreateWatchlistResponse',
});
export const updateWatchlistResponseSchema = watchlistWrapper.meta({
  ref: 'UpdateWatchlistResponse',
});
export const deleteWatchlistResponseSchema = messageWrapper.meta({
  ref: 'DeleteWatchlistResponse',
});
export const reorderWatchlistsResponseSchema = messageWrapper.meta({
  ref: 'ReorderWatchlistsResponse',
});
export const addCollaboratorResponseSchema = collaboratorsWrapper.meta({
  ref: 'AddCollaboratorResponse',
});
export const removeCollaboratorResponseSchema = collaboratorsWrapper.meta({
  ref: 'RemoveCollaboratorResponse',
});
export const leaveWatchlistResponseSchema = messageWrapper.meta({
  ref: 'LeaveWatchlistResponse',
});
export const addItemResponseSchema = watchlistWrapper.meta({ ref: 'AddItemResponse' });
export const removeItemResponseSchema = watchlistWrapper.meta({ ref: 'RemoveItemResponse' });
export const moveItemResponseSchema = watchlistWrapper.meta({ ref: 'MoveItemResponse' });
export const reorderItemsResponseSchema = watchlistWrapper.meta({ ref: 'ReorderItemsResponse' });
export const uploadCoverResponseSchema = z
  .object({ watchlist: watchlistSchema, imageUrl: z.string() })
  .meta({ ref: 'UploadCoverResponse' });
export const deleteCoverResponseSchema = z
  .object({ message: z.string(), watchlist: watchlistSchema })
  .meta({ ref: 'DeleteCoverResponse' });
export const generateThumbnailResponseSchema = z
  .object({ thumbnailUrl: z.string() })
  .meta({ ref: 'GenerateThumbnailResponse' });
export const saveWatchlistResponseSchema = messageWrapper.meta({ ref: 'SaveWatchlistResponse' });
export const unsaveWatchlistResponseSchema = messageWrapper.meta({
  ref: 'UnsaveWatchlistResponse',
});
export const duplicateWatchlistResponseSchema = watchlistWrapper.meta({
  ref: 'DuplicateWatchlistResponse',
});
export const getWatchlistRecommendationsResponseSchema = z
  .object({ items: z.array(recommendedItemSchema), generatedAt: z.string() })
  .meta({ ref: 'GetWatchlistRecommendationsResponse' });

// SearchTMDBResponse = TMDBListResponse (alias) → on réutilise le schéma entité.
export const searchTMDBResponseSchema = tmdbListResponseSchema;
export const getItemDetailsResponseSchema = z
  .object({ details: fullMediaDetailsSchema })
  .meta({ ref: 'GetItemDetailsResponse' });
