/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

// Import route modules
import './routes/auth.js'
import './routes/users.js'
import './routes/tmdb.js'
import './routes/watchlists.js'

// Health check
router.get('/', async () => {
  return { status: 'ok', message: 'Poplist API is running' }
})

router.get('/health', async () => {
  return { status: 'ok', message: 'Poplist API is running' }
})

// Image proxy for TMDB images (public, no auth required)
router.get('/image-proxy', async ({ request, response }) => {
  try {
    const imagePath = request.input('path')

    if (!imagePath || !imagePath.startsWith('/')) {
      return response.badRequest({ error: 'Invalid image path' })
    }

    // Fetch image from TMDB
    const imageUrl = `https://image.tmdb.org/t/p/original${imagePath}`
    const fetchResponse = await fetch(imageUrl)

    if (!fetchResponse.ok) {
      return response.notFound({ error: 'Image not found' })
    }

    // Get the image buffer
    const buffer = await fetchResponse.arrayBuffer()

    // Set appropriate headers
    const contentType = fetchResponse.headers.get('content-type') || 'image/jpeg'
    response.header('Content-Type', contentType)
    response.header('Cache-Control', 'public, max-age=86400')
    response.header('Access-Control-Allow-Origin', '*')

    // Send the image
    return response.send(Buffer.from(buffer))
  } catch (error) {
    console.error('Error proxying TMDB image:', error)
    return response.internalServerError({ error: 'Failed to proxy image' })
  }
})
