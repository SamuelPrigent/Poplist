import type { HttpContext } from '@adonisjs/core/http'
import { v2 as cloudinary } from 'cloudinary'
import { User, Watchlist } from '#models/index'

function extractPublicIdFromUrl(imageUrl: string): string | null {
  try {
    const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

export default class UsersController {
  async uploadAvatar({ request, response, user }: HttpContext) {
    if (!user) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const fullUser = await User.find(user.sub)
    if (!fullUser) {
      return response.notFound({ error: 'User not found' })
    }

    const imageData = request.input('imageData')
    if (!imageData) {
      return response.badRequest({ error: 'No image data provided' })
    }

    if (!imageData.startsWith('data:image/')) {
      return response.badRequest({ error: 'Invalid image format. Must be a base64 data URL.' })
    }

    try {
      // Delete old avatar if exists
      if (fullUser.avatarUrl) {
        const oldPublicId = extractPublicIdFromUrl(fullUser.avatarUrl)
        if (oldPublicId) {
          try {
            await cloudinary.uploader.destroy(oldPublicId)
          } catch {
            // Ignore deletion errors
          }
        }
      }

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(imageData, {
        folder: 'avatars',
        width: 200,
        height: 200,
        crop: 'fill',
        gravity: 'face',
        resource_type: 'image',
      })

      fullUser.avatarUrl = result.secure_url
      await fullUser.save()

      return response.ok({
        user: {
          id: fullUser.id,
          email: fullUser.email,
          username: fullUser.username,
          avatarUrl: fullUser.avatarUrl,
          language: fullUser.language,
          roles: fullUser.roles,
        },
        avatarUrl: result.secure_url,
      })
    } catch (error) {
      console.error('Cloudinary upload error:', error)
      return response.internalServerError({ error: 'Failed to upload avatar to Cloudinary' })
    }
  }

  async deleteAvatar({ response, user }: HttpContext) {
    if (!user) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const fullUser = await User.find(user.sub)
    if (!fullUser) {
      return response.notFound({ error: 'User not found' })
    }

    if (!fullUser.avatarUrl) {
      return response.notFound({ error: 'No avatar to delete' })
    }

    const publicId = extractPublicIdFromUrl(fullUser.avatarUrl)
    if (!publicId) {
      return response.badRequest({ error: 'Invalid avatar URL format' })
    }

    try {
      await cloudinary.uploader.destroy(publicId)
      fullUser.avatarUrl = null
      await fullUser.save()

      return response.ok({
        message: 'Avatar deleted successfully',
        user: {
          id: fullUser.id,
          email: fullUser.email,
          username: fullUser.username,
          avatarUrl: fullUser.avatarUrl,
          language: fullUser.language,
          roles: fullUser.roles,
        },
      })
    } catch (error) {
      console.error('Cloudinary delete error:', error)
      return response.internalServerError({ error: 'Failed to delete avatar from Cloudinary' })
    }
  }

  async getProfile({ response, user }: HttpContext) {
    if (!user) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const fullUser = await User.find(user.sub)
    if (!fullUser) {
      return response.notFound({ error: 'User not found' })
    }

    return response.ok({
      user: {
        id: fullUser.id,
        email: fullUser.email,
        username: fullUser.username,
        avatarUrl: fullUser.avatarUrl,
        language: fullUser.language,
        roles: fullUser.roles,
        createdAt: fullUser.createdAt,
      },
    })
  }

  async getUserProfileByUsername({ params, response }: HttpContext) {
    const { username } = params

    const foundUser = await User.findBy('username', username)
    if (!foundUser) {
      return response.notFound({ error: 'User not found' })
    }

    // Get public watchlists with owner and collaborators
    const publicWatchlists = await Watchlist.query()
      .where('ownerId', foundUser.id)
      .where('isPublic', true)
      .preload('owner', (query) => query.select('id', 'username', 'avatarUrl'))
      .preload('collaborators', (query) => query.select('id', 'username', 'avatarUrl'))
      .preload('items')
      .orderBy('position', 'asc')

    // Format watchlists for response
    const formattedWatchlists = publicWatchlists.map((watchlist) => ({
      id: watchlist.id,
      name: watchlist.name,
      description: watchlist.description,
      imageUrl: watchlist.imageUrl,
      thumbnailUrl: watchlist.thumbnailUrl,
      isPublic: watchlist.isPublic,
      genres: watchlist.genres,
      position: watchlist.position,
      createdAt: watchlist.createdAt,
      updatedAt: watchlist.updatedAt,
      owner: watchlist.owner
        ? {
            id: watchlist.owner.id,
            username: watchlist.owner.username,
            avatarUrl: watchlist.owner.avatarUrl,
          }
        : null,
      collaborators: watchlist.collaborators.map((c) => ({
        id: c.id,
        username: c.username,
        avatarUrl: c.avatarUrl,
      })),
      items: watchlist.items,
    }))

    return response.ok({
      user: {
        id: foundUser.id,
        username: foundUser.username,
        avatarUrl: foundUser.avatarUrl,
      },
      watchlists: formattedWatchlists,
      totalPublicWatchlists: formattedWatchlists.length,
    })
  }
}
