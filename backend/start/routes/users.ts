import router from '@adonisjs/core/services/router'
import { middleware } from '../kernel.js'

const UsersController = () => import('#controllers/users_controller')

router
  .group(() => {
    // Public route
    router.get('/profile/:username', [UsersController, 'getUserProfileByUsername'])

    // Protected routes
    router
      .group(() => {
        router.get('/profile', [UsersController, 'getProfile'])
        router.post('/upload-avatar', [UsersController, 'uploadAvatar'])
        router.delete('/avatar', [UsersController, 'deleteAvatar'])
      })
      .use(middleware.auth())
  })
  .prefix('/user')
