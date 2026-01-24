import router from '@adonisjs/core/services/router'
import { middleware } from '../kernel.js'

const AuthController = () => import('#controllers/auth_controller')

router
  .group(() => {
    // Email/password auth (public)
    router.post('/signup', [AuthController, 'signup'])
    router.post('/login', [AuthController, 'login'])

    // Google OAuth (public)
    router.get('/google', [AuthController, 'googleAuth'])
    router.get('/google/callback', [AuthController, 'googleCallback'])

    // Token management (public)
    router.post('/refresh', [AuthController, 'refresh'])
    router.post('/logout', [AuthController, 'logout'])
    router.post('/set-tokens', [AuthController, 'setTokens'])

    // Username availability check (public)
    router.get('/username/check/:username', [AuthController, 'checkUsernameAvailability'])

    // Protected profile routes
    router
      .group(() => {
        router.get('/me', [AuthController, 'me'])
        router.put('/profile/username', [AuthController, 'updateUsername'])
        router.put('/profile/password', [AuthController, 'changePassword'])
        router.put('/profile/language', [AuthController, 'updateLanguage'])
        router.delete('/profile/account', [AuthController, 'deleteAccount'])
      })
      .use(middleware.auth())
  })
  .prefix('/auth')
