import router from '@adonisjs/core/services/router'
import { middleware } from '../kernel.js'

const WatchlistsController = () => import('#controllers/watchlists_controller')

router
  .group(() => {
    // ========================================
    // Public routes (no auth required)
    // ========================================
    router
      .get('/public/featured', [WatchlistsController, 'getPublicWatchlists'])
      .use(middleware.optionalAuth())

    router.get('/public/:id', [WatchlistsController, 'getPublicWatchlist'])
    router.get('/by-genre/:genre', [WatchlistsController, 'getWatchlistsByGenre'])
    router.get('/count-by-genre/:genre', [WatchlistsController, 'getWatchlistCountByGenre'])
    router.get('/search/tmdb', [WatchlistsController, 'searchTMDB'])
    router.get('/items/:tmdbId/:type/details', [WatchlistsController, 'getItemDetails'])

    // ========================================
    // Protected routes (auth required)
    // ========================================
    router
      .group(() => {
        // Main watchlist CRUD
        router.get('/mine', [WatchlistsController, 'getMyWatchlists'])
        router.post('/', [WatchlistsController, 'createWatchlist'])
        router.put('/reorder', [WatchlistsController, 'reorderWatchlists'])
        router.get('/:id', [WatchlistsController, 'getWatchlistById'])
        router.put('/:id', [WatchlistsController, 'updateWatchlist'])
        router.delete('/:id', [WatchlistsController, 'deleteWatchlist'])

        // Collaborator management
        router.post('/:id/collaborators', [WatchlistsController, 'addCollaborator'])
        router.delete('/:id/collaborators/:collaboratorId', [
          WatchlistsController,
          'removeCollaborator',
        ])
        router.post('/:id/leave', [WatchlistsController, 'leaveWatchlist'])

        // Item management
        router.post('/:id/items', [WatchlistsController, 'addItemToWatchlist'])
        router.delete('/:id/items/:tmdbId', [WatchlistsController, 'removeItemFromWatchlist'])
        router.put('/:id/items/:tmdbId/position', [WatchlistsController, 'moveItemPosition'])
        router.put('/:id/items/reorder', [WatchlistsController, 'reorderItems'])

        // Cover management
        router.post('/:id/upload-cover', [WatchlistsController, 'uploadCover'])
        router.delete('/:id/cover', [WatchlistsController, 'deleteCover'])

        // Thumbnail generation
        router.post('/:id/generate-thumbnail', [WatchlistsController, 'generateWatchlistThumbnail'])

        // Save/Unsave/Duplicate
        router.post('/:id/like-and-save', [WatchlistsController, 'saveWatchlist'])
        router.delete('/:id/unlike-and-unsave', [WatchlistsController, 'unsaveWatchlist'])
        router.post('/:id/duplicate', [WatchlistsController, 'duplicateWatchlist'])
      })
      .use(middleware.auth())
  })
  .prefix('/watchlists')
