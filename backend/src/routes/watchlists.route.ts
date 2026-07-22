import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { describeRoute } from 'hono-openapi';
import { jsonBody, ok, queryParams } from './_openapi.helpers.js';
import { auth, optionalAuth } from '../middleware/auth.middleware.js';
import * as WatchlistsController from '../controllers/watchlists.controller.js';
import {
  getPublicFeaturedResponseSchema,
  getPublicWatchlistResponseSchema,
  getWatchlistsByGenreResponseSchema,
  getWatchlistCountByGenreResponseSchema,
  getMyWatchlistsResponseSchema,
  getWatchlistByIdResponseSchema,
  createWatchlistResponseSchema,
  updateWatchlistResponseSchema,
  deleteWatchlistResponseSchema,
  reorderWatchlistsResponseSchema,
  addCollaboratorResponseSchema,
  removeCollaboratorResponseSchema,
  leaveWatchlistResponseSchema,
  addItemResponseSchema,
  removeItemResponseSchema,
  moveItemResponseSchema,
  reorderItemsResponseSchema,
  uploadCoverResponseSchema,
  deleteCoverResponseSchema,
  generateThumbnailResponseSchema,
  saveWatchlistResponseSchema,
  unsaveWatchlistResponseSchema,
  duplicateWatchlistResponseSchema,
  getWatchlistRecommendationsResponseSchema,
  searchTMDBResponseSchema,
  getItemDetailsResponseSchema,
} from '../schemas/watchlists.schemas.js';
import {
  createWatchlistSchema,
  updateWatchlistSchema,
  addCollaboratorSchema,
  addItemSchema,
  moveItemSchema,
  reorderItemsSchema,
  reorderWatchlistsSchema,
  uploadCoverSchema,
  limitQuerySchema,
  tmdbSearchQuerySchema,
  languageQuerySchema,
} from '../validators/watchlists.validator.js';
import type { AppEnv } from '../app.js';
import type { Context } from 'hono';

// ========================================
// Helpers de documentation OpenAPI (describeRoute)
// ========================================
// On garde `zValidator` pour la validation runtime (zéro changement de
// comportement) et on documente en parallèle via describeRoute pour alimenter
// le spec (et donc le SDK Kubb), en réutilisant les mêmes schémas zod.

const TAG = 'watchlists';

const publicCacheHeaders = async (c: Context<AppEnv>, next: () => Promise<void>) => {
  await next();
  c.header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600');
};

// `featured` est personnalisé quand un user est connecté (isOwner/isSaved…) :
// cache public UNIQUEMENT pour les anonymes, private sinon. `Vary: Cookie`
// dans tous les cas pour qu'un cache partagé ne serve jamais la réponse
// personnalisée d'un user à un autre (ni la version anonyme à un connecté).
const featuredCacheHeaders = async (c: Context<AppEnv>, next: () => Promise<void>) => {
  await next();
  c.header('Vary', 'Cookie');
  if (c.get('user')) {
    c.header('Cache-Control', 'private, no-cache');
  } else {
    c.header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600');
  }
};

const watchlistRoutes = new Hono<AppEnv>()
  // ========================================
  // Public routes
  // ========================================
  .get(
    '/public/featured',
    optionalAuth,
    featuredCacheHeaders,
    describeRoute({
      operationId: 'getPublicFeatured',
      tags: [TAG],
      parameters: queryParams(['limit']),
      responses: ok(getPublicFeaturedResponseSchema, 'Watchlists publiques mises en avant'),
    }),
    zValidator('query', limitQuerySchema),
    (c) => WatchlistsController.getPublicFeatured(c),
  )
  .get(
    '/public/:id',
    describeRoute({
      operationId: 'getPublicWatchlist',
      tags: [TAG],
      responses: ok(getPublicWatchlistResponseSchema, 'Watchlist publique par id'),
    }),
    (c) => WatchlistsController.getPublicWatchlist(c),
  )
  .get(
    '/by-genre/:genre',
    publicCacheHeaders,
    describeRoute({
      operationId: 'getWatchlistsByGenre',
      tags: [TAG],
      responses: ok(getWatchlistsByGenreResponseSchema, "Watchlists publiques d'un genre"),
    }),
    (c) => WatchlistsController.getWatchlistsByGenre(c),
  )
  .get(
    '/count-by-genre/:genre',
    publicCacheHeaders,
    describeRoute({
      operationId: 'getWatchlistCountByGenre',
      tags: [TAG],
      responses: ok(getWatchlistCountByGenreResponseSchema, "Nombre de watchlists d'un genre"),
    }),
    (c) => WatchlistsController.getWatchlistCountByGenre(c),
  )
  .get(
    '/search/tmdb',
    describeRoute({
      operationId: 'searchTMDBForWatchlist',
      tags: [TAG],
      parameters: queryParams(['query', 'language', 'region', 'page'], ['query']),
      responses: ok(searchTMDBResponseSchema, "Recherche TMDB (ajout d'item)"),
    }),
    zValidator('query', tmdbSearchQuerySchema),
    (c) => WatchlistsController.searchTMDB(c),
  )
  .get(
    '/items/:tmdbId/:type/details',
    describeRoute({
      operationId: 'getItemDetails',
      tags: [TAG],
      parameters: queryParams(['language']),
      responses: ok(getItemDetailsResponseSchema, "Détails enrichis d'un media"),
    }),
    zValidator('query', languageQuerySchema),
    (c) => WatchlistsController.getItemDetails(c),
  )
  .get(
    '/:id/recommendations',
    optionalAuth,
    describeRoute({
      operationId: 'getWatchlistRecommendations',
      tags: [TAG],
      parameters: queryParams(['language']),
      responses: ok(
        getWatchlistRecommendationsResponseSchema,
        'Recommandations pour une watchlist',
      ),
    }),
    zValidator('query', languageQuerySchema),
    (c) => WatchlistsController.getWatchlistRecommendations(c),
  )
  // ========================================
  // Protected routes
  // ========================================
  .get(
    '/mine',
    auth,
    describeRoute({
      operationId: 'getMyWatchlists',
      tags: [TAG],
      responses: ok(getMyWatchlistsResponseSchema, 'Watchlists du user (owned + collab + saved)'),
    }),
    (c) => WatchlistsController.getMyWatchlists(c),
  )
  .post(
    '/',
    auth,
    describeRoute({
      operationId: 'createWatchlist',
      tags: [TAG],
      requestBody: jsonBody(createWatchlistSchema),
      responses: ok(createWatchlistResponseSchema, 'Watchlist créée'),
    }),
    zValidator('json', createWatchlistSchema),
    (c) => WatchlistsController.createWatchlist(c, c.req.valid('json')),
  )
  .put(
    '/reorder',
    auth,
    describeRoute({
      operationId: 'reorderWatchlists',
      tags: [TAG],
      requestBody: jsonBody(reorderWatchlistsSchema),
      responses: ok(reorderWatchlistsResponseSchema, 'Ordre des watchlists mis à jour'),
    }),
    zValidator('json', reorderWatchlistsSchema),
    (c) => WatchlistsController.reorderWatchlists(c, c.req.valid('json')),
  )
  .get(
    '/:id',
    auth,
    describeRoute({
      operationId: 'getWatchlistById',
      tags: [TAG],
      responses: ok(getWatchlistByIdResponseSchema, "Détail d'une watchlist + flags"),
    }),
    (c) => WatchlistsController.getWatchlistById(c),
  )
  .put(
    '/:id',
    auth,
    describeRoute({
      operationId: 'updateWatchlist',
      tags: [TAG],
      requestBody: jsonBody(updateWatchlistSchema),
      responses: ok(updateWatchlistResponseSchema, 'Watchlist mise à jour'),
    }),
    zValidator('json', updateWatchlistSchema),
    (c) => WatchlistsController.updateWatchlist(c, c.req.valid('json')),
  )
  .delete(
    '/:id',
    auth,
    describeRoute({
      operationId: 'deleteWatchlist',
      tags: [TAG],
      responses: ok(deleteWatchlistResponseSchema, 'Watchlist supprimée'),
    }),
    (c) => WatchlistsController.deleteWatchlist(c),
  )
  // Collaborator management
  .post(
    '/:id/collaborators',
    auth,
    describeRoute({
      operationId: 'addCollaborator',
      tags: [TAG],
      requestBody: jsonBody(addCollaboratorSchema),
      responses: ok(addCollaboratorResponseSchema, 'Collaborateur ajouté'),
    }),
    zValidator('json', addCollaboratorSchema),
    (c) => WatchlistsController.addCollaborator(c, c.req.valid('json')),
  )
  .delete(
    '/:id/collaborators/:collaboratorId',
    auth,
    describeRoute({
      operationId: 'removeCollaborator',
      tags: [TAG],
      responses: ok(removeCollaboratorResponseSchema, 'Collaborateur retiré'),
    }),
    (c) => WatchlistsController.removeCollaborator(c),
  )
  .post(
    '/:id/leave',
    auth,
    describeRoute({
      operationId: 'leaveWatchlist',
      tags: [TAG],
      responses: ok(leaveWatchlistResponseSchema, 'Le user a quitté la watchlist'),
    }),
    (c) => WatchlistsController.leaveWatchlist(c),
  )
  // Item management
  .post(
    '/:id/items',
    auth,
    describeRoute({
      operationId: 'addItemToWatchlist',
      tags: [TAG],
      requestBody: jsonBody(addItemSchema),
      responses: ok(addItemResponseSchema, 'Item ajouté'),
    }),
    zValidator('json', addItemSchema),
    (c) => WatchlistsController.addItemToWatchlist(c, c.req.valid('json')),
  )
  .delete(
    '/:id/items/:tmdbId',
    auth,
    describeRoute({
      operationId: 'removeItemFromWatchlist',
      tags: [TAG],
      responses: ok(removeItemResponseSchema, 'Item retiré'),
    }),
    (c) => WatchlistsController.removeItemFromWatchlist(c),
  )
  .put(
    '/:id/items/:tmdbId/position',
    auth,
    describeRoute({
      operationId: 'moveItemPosition',
      tags: [TAG],
      requestBody: jsonBody(moveItemSchema),
      responses: ok(moveItemResponseSchema, 'Item déplacé'),
    }),
    zValidator('json', moveItemSchema),
    (c) => WatchlistsController.moveItemPosition(c, c.req.valid('json')),
  )
  .put(
    '/:id/items/reorder',
    auth,
    describeRoute({
      operationId: 'reorderItems',
      tags: [TAG],
      requestBody: jsonBody(reorderItemsSchema),
      responses: ok(reorderItemsResponseSchema, 'Items réordonnés'),
    }),
    zValidator('json', reorderItemsSchema),
    (c) => WatchlistsController.reorderItems(c, c.req.valid('json')),
  )
  // Cover management
  .post(
    '/:id/upload-cover',
    auth,
    describeRoute({
      operationId: 'uploadCover',
      tags: [TAG],
      requestBody: jsonBody(uploadCoverSchema),
      responses: ok(uploadCoverResponseSchema, 'Cover uploadée'),
    }),
    zValidator('json', uploadCoverSchema),
    (c) => WatchlistsController.uploadCover(c, c.req.valid('json')),
  )
  .delete(
    '/:id/cover',
    auth,
    describeRoute({
      operationId: 'deleteCover',
      tags: [TAG],
      responses: ok(deleteCoverResponseSchema, 'Cover supprimée'),
    }),
    (c) => WatchlistsController.deleteCover(c),
  )
  // Thumbnail generation
  .post(
    '/:id/generate-thumbnail',
    auth,
    describeRoute({
      operationId: 'generateWatchlistThumbnail',
      tags: [TAG],
      responses: ok(generateThumbnailResponseSchema, 'Thumbnail générée'),
    }),
    (c) => WatchlistsController.generateWatchlistThumbnail(c),
  )
  // Save/Unsave/Duplicate
  .post(
    '/:id/like-and-save',
    auth,
    describeRoute({
      operationId: 'saveWatchlist',
      tags: [TAG],
      responses: ok(saveWatchlistResponseSchema, 'Watchlist sauvegardée'),
    }),
    (c) => WatchlistsController.saveWatchlist(c),
  )
  .delete(
    '/:id/unlike-and-unsave',
    auth,
    describeRoute({
      operationId: 'unsaveWatchlist',
      tags: [TAG],
      responses: ok(unsaveWatchlistResponseSchema, 'Watchlist retirée des sauvegardes'),
    }),
    (c) => WatchlistsController.unsaveWatchlist(c),
  )
  .post(
    '/:id/duplicate',
    auth,
    describeRoute({
      operationId: 'duplicateWatchlist',
      tags: [TAG],
      responses: ok(duplicateWatchlistResponseSchema, 'Watchlist dupliquée'),
    }),
    (c) => WatchlistsController.duplicateWatchlist(c),
  );

export default watchlistRoutes;
