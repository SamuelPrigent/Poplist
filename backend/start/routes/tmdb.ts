import router from '@adonisjs/core/services/router'

const TmdbController = () => import('#controllers/tmdb_controller')

router
  .group(() => {
    // Trending content
    router.get('/trending/:timeWindow', [TmdbController, 'getTrending'])

    // Discover with filters
    router.get('/discover/:type', [TmdbController, 'discover'])

    // Genres list
    router.get('/genre/:type/list', [TmdbController, 'getGenres'])

    // Popular content
    router.get('/:type/popular', [TmdbController, 'getPopular'])

    // Top rated content
    router.get('/:type/top_rated', [TmdbController, 'getTopRated'])

    // Watch providers
    router.get('/:type/:id/providers', [TmdbController, 'getProviders'])

    // Similar content (must be last due to dynamic params)
    router.get('/:type/:id/similar', [TmdbController, 'getSimilar'])
  })
  .prefix('/tmdb')
