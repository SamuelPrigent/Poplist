import { v2 as cloudinary } from 'cloudinary'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { User, Watchlist, WatchlistItem, type Platform } from '#models/index'
import {
  deleteThumbnailFromCloudinary,
  generateThumbnail,
  regenerateThumbnail,
  uploadThumbnailToCloudinary,
} from '#services/thumbnail_service'
import { enrichMediaData, getFullMediaDetails, searchMedia } from '#services/tmdb_service'
import { saveToCache } from '#services/cache_service'
import {
  createWatchlistValidator,
  updateWatchlistValidator,
  addCollaboratorValidator,
  addItemValidator,
  moveItemValidator,
  reorderItemsValidator,
  reorderWatchlistsValidator,
} from '#validators/watchlist_validator'

function isValidWatchlistId(id: string): boolean {
  // UUID format validation (skip offline IDs)
  if (id.startsWith('offline-')) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

function getTMDBImageUrl(path: string | null | undefined, size: string = 'w342'): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `https://image.tmdb.org/t/p/${size}${path}`
}

function extractPublicIdFromUrl(imageUrl: string): string | null {
  try {
    const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

export default class WatchlistsController {
  async getMyWatchlists({ request, response }: HttpContext) {
    const userId = request.user?.sub
    if (!userId) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const user = await User.find(userId)
    if (!user) {
      return response.notFound({ error: 'User not found' })
    }

    // Get user's watchlist positions (unified ordering system)
    const userPositions = await db
      .from('user_watchlist_positions')
      .where('user_id', userId)
      .select('watchlist_id', 'position')
      .orderBy('position', 'asc')
    const positionMap = new Map(userPositions.map((r) => [r.watchlist_id, r.position]))

    // Get all watchlists the user has access to
    const ownedWatchlists = await Watchlist.query()
      .where('ownerId', userId)
      .preload('owner', (q) => q.select('id', 'email', 'username', 'avatarUrl'))
      .preload('collaborators', (q) => q.select('id', 'email', 'username', 'avatarUrl'))
      .preload('items', (q) => q.orderBy('position', 'asc'))

    const collaboratorWatchlistIds = await db
      .from('watchlist_collaborators')
      .where('user_id', userId)
      .select('watchlist_id')
    const collabIds = collaboratorWatchlistIds.map((r) => r.watchlist_id)

    const collaborativeWatchlists =
      collabIds.length > 0
        ? await Watchlist.query()
            .whereIn('id', collabIds)
            .preload('owner', (q) => q.select('id', 'email', 'username', 'avatarUrl'))
            .preload('collaborators', (q) => q.select('id', 'email', 'username', 'avatarUrl'))
            .preload('items', (q) => q.orderBy('position', 'asc'))
        : []

    const savedWatchlistIds = await db
      .from('saved_watchlists')
      .where('user_id', userId)
      .select('watchlist_id')
    const savedIds = savedWatchlistIds.map((r) => r.watchlist_id)

    const savedWatchlists =
      savedIds.length > 0
        ? await Watchlist.query()
            .whereIn('id', savedIds)
            .preload('owner', (q) => q.select('id', 'email', 'username', 'avatarUrl'))
            .preload('collaborators', (q) => q.select('id', 'email', 'username', 'avatarUrl'))
            .preload('items', (q) => q.orderBy('position', 'asc'))
        : []

    // Build response with flags
    const watchlistsMap = new Map<string, any>()
    const savedIdsSet = new Set(savedIds)
    const collabIdsSet = new Set(collabIds)

    // Add owned
    ownedWatchlists.forEach((w) => {
      watchlistsMap.set(w.id, {
        ...w.serialize(),
        isOwner: true,
        isCollaborator: false,
        isSaved: savedIdsSet.has(w.id),
        libraryPosition: positionMap.get(w.id) ?? 9999,
      })
    })

    // Add collaborative
    collaborativeWatchlists.forEach((w) => {
      if (!watchlistsMap.has(w.id)) {
        watchlistsMap.set(w.id, {
          ...w.serialize(),
          isOwner: false,
          isCollaborator: true,
          isSaved: savedIdsSet.has(w.id),
          libraryPosition: positionMap.get(w.id) ?? 9999,
        })
      }
    })

    // Add saved (that aren't already in the map)
    savedWatchlists.forEach((w) => {
      if (!watchlistsMap.has(w.id)) {
        watchlistsMap.set(w.id, {
          ...w.serialize(),
          isOwner: false,
          isCollaborator: collabIdsSet.has(w.id),
          isSaved: true,
          libraryPosition: positionMap.get(w.id) ?? 9999,
        })
      }
    })

    // Sort by unified library position
    const watchlists = Array.from(watchlistsMap.values()).sort((a, b) => {
      return (a.libraryPosition ?? 9999) - (b.libraryPosition ?? 9999)
    })

    return response.json({ watchlists })
  }

  async createWatchlist({ request, response }: HttpContext) {
    const userId = request.user?.sub
    if (!userId) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const data = await request.validateUsing(createWatchlistValidator)

    // Check for duplicate name if fromLocalStorage
    if (data.fromLocalStorage) {
      const existing = await Watchlist.query()
        .where('ownerId', userId)
        .where('name', data.name)
        .first()

      if (existing) {
        data.name = `${data.name} (local)`
      }
    }

    const watchlist = await Watchlist.create({
      ownerId: userId,
      name: data.name,
      description: data.description,
      isPublic: data.isPublic || false,
      genres: data.genres,
      position: 0,
    })

    // Add to user's library at position 0, shift others
    await db
      .from('user_watchlist_positions')
      .where('user_id', userId)
      .increment('position', 1)

    await db.table('user_watchlist_positions').insert({
      user_id: userId,
      watchlist_id: watchlist.id,
      position: 0,
      added_at: DateTime.now().toSQL(),
    })

    // Add items if provided
    if (data.items && data.items.length > 0) {
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i]
        await WatchlistItem.create({
          watchlistId: watchlist.id,
          tmdbId: item.tmdbId,
          mediaType: item.mediaType,
          title: item.title,
          posterPath: item.posterPath,
          platformList: (item.platformList || []).map((p: any) => ({
            name: p.name || '',
            logoPath: p.logoPath || '',
          })),
          runtime: item.runtime,
          numberOfSeasons: item.numberOfSeasons,
          numberOfEpisodes: item.numberOfEpisodes,
          position: i,
          addedAt: DateTime.now(),
        })
      }

      // Generate thumbnail
      const posterUrls = data.items
        .slice(0, 4)
        .map((item) => getTMDBImageUrl(item.posterPath))
        .filter((url): url is string => url !== null)

      if (posterUrls.length > 0) {
        regenerateThumbnail(watchlist.id, posterUrls)
          .then(async (thumbnailUrl) => {
            if (thumbnailUrl) {
              watchlist.thumbnailUrl = thumbnailUrl
              await watchlist.save()
            }
          })
          .catch((err: Error) => console.error('Failed to regenerate thumbnail:', err))
      }
    }

    // Reload with items
    await watchlist.load('items')

    return response.created({ watchlist })
  }

  async updateWatchlist({ request, response, params }: HttpContext) {
    const userId = request.user?.sub
    if (!userId) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const { id } = params
    const data = await request.validateUsing(updateWatchlistValidator)

    if (!isValidWatchlistId(id)) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    const watchlist = await Watchlist.query()
      .where('id', id)
      .preload('collaborators')
      .preload('items', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!watchlist) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    const isOwner = watchlist.ownerId === userId
    const isCollaborator = watchlist.collaborators.some((c) => c.id === userId)

    if (!isOwner && !isCollaborator) {
      return response.forbidden({ error: 'Forbidden' })
    }

    if (data.name) watchlist.name = data.name
    if (data.description !== undefined) watchlist.description = data.description
    if (data.isPublic !== undefined) watchlist.isPublic = data.isPublic
    if (data.genres !== undefined) watchlist.genres = data.genres

    // Handle items update
    if (data.items) {
      // Delete existing items
      await WatchlistItem.query().where('watchlistId', watchlist.id).delete()

      // Create new items
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i]
        const cleanedPlatformList = (item.platformList || [])
          .filter((p): p is Platform => p !== null && p !== undefined)
          .map((p: Platform | string) => {
            if (typeof p === 'string') {
              return p.trim() ? { name: p, logoPath: '' } : null
            }
            if (p && typeof p === 'object' && 'name' in p && typeof p.name === 'string' && p.name.trim()) {
              return { name: p.name, logoPath: typeof p.logoPath === 'string' ? p.logoPath : '' }
            }
            return null
          })
          .filter((p): p is Platform => p !== null)

        await WatchlistItem.create({
          watchlistId: watchlist.id,
          tmdbId: item.tmdbId,
          mediaType: item.mediaType,
          title: item.title,
          posterPath: item.posterPath,
          platformList: cleanedPlatformList.length > 0 ? cleanedPlatformList : [{ name: 'Inconnu', logoPath: '' }],
          runtime: item.runtime,
          numberOfSeasons: item.numberOfSeasons,
          numberOfEpisodes: item.numberOfEpisodes,
          position: i,
          addedAt: item.addedAt ? DateTime.fromJSDate(new Date(item.addedAt)) : DateTime.now(),
        })
      }
    }

    await watchlist.save()
    await watchlist.load('items', (q) => q.orderBy('position', 'asc'))

    return response.json({ watchlist })
  }

  async deleteWatchlist({ request, response, params }: HttpContext) {
    const userId = request.user?.sub
    if (!userId) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const { id } = params

    if (!isValidWatchlistId(id)) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    const watchlist = await Watchlist.find(id)

    if (!watchlist) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    if (watchlist.ownerId !== userId) {
      return response.forbidden({ error: 'Only owner can delete watchlist' })
    }

    if (watchlist.thumbnailUrl) {
      await deleteThumbnailFromCloudinary(id)
    }

    // Get all users who had this watchlist and their positions (for normalization)
    const positionRecords = await db
      .from('user_watchlist_positions')
      .where('watchlist_id', id)
      .select('user_id', 'position')

    // Delete from pivot tables
    await db.from('watchlist_likes').where('watchlist_id', id).delete()
    await db.from('saved_watchlists').where('watchlist_id', id).delete()
    await db.from('watchlist_collaborators').where('watchlist_id', id).delete()
    await db.from('user_watchlist_positions').where('watchlist_id', id).delete()

    // Normalize positions for all affected users
    for (const record of positionRecords) {
      await db
        .from('user_watchlist_positions')
        .where('user_id', record.user_id)
        .where('position', '>', record.position)
        .decrement('position', 1)
    }

    // Delete watchlist (items will cascade)
    await watchlist.delete()

    return response.json({ message: 'Watchlist deleted successfully' })
  }

  async getPublicWatchlist({ response, params }: HttpContext) {
    const { id } = params

    if (!isValidWatchlistId(id)) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    const watchlist = await Watchlist.query()
      .where('id', id)
      .preload('owner', (q) => q.select('id', 'email', 'username', 'avatarUrl'))
      .preload('collaborators', (q) => q.select('id', 'email', 'username', 'avatarUrl'))
      .preload('items', (q) => q.orderBy('position', 'asc'))
      .preload('likedBy', (q) => q.select('id', 'email', 'username', 'avatarUrl'))
      .first()

    if (!watchlist) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    if (!watchlist.isPublic) {
      return response.forbidden({ error: 'This watchlist is private' })
    }

    return response.json({ watchlist })
  }

  async getPublicWatchlists({ request, response }: HttpContext) {
    const qs = request.qs()
    const limit = Math.min(Number.parseInt(qs.limit as string, 10) || 6, 1000)
    const userId = request.user?.sub

    // Get public watchlists with like count
    const watchlists = await Watchlist.query()
      .where('isPublic', true)
      .preload('owner', (q) => q.select('id', 'email', 'username', 'avatarUrl'))
      .preload('collaborators', (q) => q.select('id', 'email', 'username', 'avatarUrl'))
      .preload('items', (q) => q.orderBy('position', 'asc'))
      .preload('likedBy')
      .orderBy('createdAt', 'desc')
      .limit(limit)

    // Sort by followers count
    const sortedWatchlists = watchlists
      .map((w) => {
        const serialized = w.serialize()
        return {
          ...serialized,
          followersCount: w.likedBy?.length || 0,
        } as Record<string, any>
      })
      .sort((a, b) => b.followersCount - a.followersCount)

    if (userId) {
      const savedIds = await db.from('saved_watchlists').where('user_id', userId).select('watchlist_id')
      const savedIdsSet = new Set(savedIds.map((r) => r.watchlist_id))

      const watchlistsWithFlags = sortedWatchlists.map((w: any) => ({
        ...w,
        isOwner: w.ownerId === userId,
        isCollaborator: w.collaborators?.some((c: any) => c.id === userId) || false,
        isSaved: savedIdsSet.has(w.id),
      }))

      return response.json({ watchlists: watchlistsWithFlags })
    }

    return response.json({ watchlists: sortedWatchlists })
  }

  async getWatchlistsByGenre({ response, params }: HttpContext) {
    const { genre } = params

    if (!genre || genre.trim().length === 0) {
      return response.badRequest({ error: 'Genre parameter is required' })
    }

    const watchlists = await Watchlist.query()
      .where('isPublic', true)
      .whereRaw('? = ANY(genres)', [genre])
      .preload('owner', (q) => q.select('id', 'email', 'username', 'avatarUrl'))
      .preload('collaborators', (q) => q.select('id', 'email', 'username', 'avatarUrl'))
      .preload('items', (q) => q.orderBy('position', 'asc'))
      .preload('likedBy', (q) => q.select('id', 'email', 'username', 'avatarUrl'))
      .orderBy('createdAt', 'desc')

    return response.json({ watchlists })
  }

  async getWatchlistCountByGenre({ response, params }: HttpContext) {
    const { genre } = params

    if (!genre || genre.trim().length === 0) {
      return response.badRequest({ error: 'Genre parameter is required' })
    }

    const result = await Watchlist.query()
      .where('isPublic', true)
      .whereRaw('? = ANY(genres)', [genre])
      .count('* as count')
      .first()

    return response.json({ genre, count: Number((result as any)?.$extras?.count || 0) })
  }

  async getWatchlistById({ request, response, params }: HttpContext) {
    const userId = request.user?.sub
    if (!userId) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const { id } = params

    if (!isValidWatchlistId(id)) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    const watchlist = await Watchlist.query()
      .where('id', id)
      .preload('owner', (q) => q.select('id', 'email', 'username', 'avatarUrl'))
      .preload('collaborators', (q) => q.select('id', 'email', 'username', 'avatarUrl'))
      .preload('items', (q) => q.orderBy('position', 'asc'))
      .preload('likedBy', (q) => q.select('id', 'email', 'username', 'avatarUrl'))
      .first()

    if (!watchlist) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    const isOwner = watchlist.ownerId === userId
    const isCollaborator = watchlist.collaborators.some((c) => c.id === userId)
    const isPublic = watchlist.isPublic

    if (!isOwner && !isCollaborator && !isPublic) {
      return response.forbidden({ error: 'Access denied' })
    }

    const savedCheck = await db
      .from('saved_watchlists')
      .where('user_id', userId)
      .where('watchlist_id', id)
      .first()
    const isSaved = !!savedCheck

    return response.json({ watchlist, isSaved, isOwner, isCollaborator })
  }

  async addItemToWatchlist({ request, response, params }: HttpContext) {
    const userId = request.user?.sub
    if (!userId) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const { id } = params
    const data = await request.validateUsing(addItemValidator)

    if (!isValidWatchlistId(id)) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    const watchlist = await Watchlist.query()
      .where('id', id)
      .preload('collaborators')
      .preload('items', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!watchlist) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    const isOwner = watchlist.ownerId === userId
    const isCollaborator = watchlist.collaborators.some((c) => c.id === userId)

    if (!isOwner && !isCollaborator) {
      return response.forbidden({ error: 'Forbidden' })
    }

    const tmdbIdNum = Number.parseInt(data.tmdbId, 10)
    const itemExists = watchlist.items.some((item) => item.tmdbId === tmdbIdNum)
    if (itemExists) {
      return response.badRequest({ error: 'Item already exists in watchlist' })
    }

    const enrichedData = await enrichMediaData(
      data.tmdbId,
      data.mediaType,
      data.language || 'fr-FR',
      data.region || 'FR'
    )

    if (!enrichedData) {
      return response.internalServerError({ error: 'Failed to fetch media details from TMDB' })
    }

    const maxPos = await WatchlistItem.query()
      .where('watchlistId', watchlist.id)
      .max('position as max')
      .first()
    const newPosition = ((maxPos as any)?.$extras?.max ?? -1) + 1

    await WatchlistItem.create({
      watchlistId: watchlist.id,
      tmdbId: Number.parseInt(enrichedData.tmdbId, 10),
      mediaType: enrichedData.mediaType,
      title: enrichedData.title,
      posterPath: enrichedData.posterPath,
      platformList: enrichedData.platformList,
      runtime: enrichedData.runtime,
      numberOfSeasons: enrichedData.numberOfSeasons,
      numberOfEpisodes: enrichedData.numberOfEpisodes,
      position: newPosition,
      addedAt: DateTime.now(),
    })

    await watchlist.load('items', (q) => q.orderBy('position', 'asc'))

    // Regenerate thumbnail
    const posterUrls = watchlist.items
      .slice(0, 4)
      .map((item) => getTMDBImageUrl(item.posterPath))
      .filter((url): url is string => url !== null)

    regenerateThumbnail(id, posterUrls)
      .then(async (thumbnailUrl) => {
        if (thumbnailUrl) {
          watchlist.thumbnailUrl = thumbnailUrl
          await watchlist.save()
        }
      })
      .catch((err: Error) => console.error('Failed to regenerate thumbnail:', err))

    return response.json({ watchlist })
  }

  async removeItemFromWatchlist({ request, response, params }: HttpContext) {
    const userId = request.user?.sub
    if (!userId) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const { id, tmdbId } = params

    const watchlist = await Watchlist.query()
      .where('id', id)
      .preload('collaborators')
      .preload('items', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!watchlist) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    const isOwner = watchlist.ownerId === userId
    const isCollaborator = watchlist.collaborators.some((c) => c.id === userId)

    if (!isOwner && !isCollaborator) {
      return response.forbidden({ error: 'Forbidden' })
    }

    const tmdbIdNum = Number.parseInt(tmdbId, 10)
    const deleted = await WatchlistItem.query()
      .where('watchlistId', watchlist.id)
      .where('tmdbId', tmdbIdNum)
      .delete()

    if (!deleted) {
      return response.notFound({ error: 'Item not found in watchlist' })
    }

    await watchlist.load('items', (q) => q.orderBy('position', 'asc'))

    // Regenerate thumbnail
    const posterUrls = watchlist.items
      .slice(0, 4)
      .map((item) => getTMDBImageUrl(item.posterPath))
      .filter((url): url is string => url !== null)

    regenerateThumbnail(id, posterUrls)
      .then(async (thumbnailUrl) => {
        if (thumbnailUrl) {
          watchlist.thumbnailUrl = thumbnailUrl
          await watchlist.save()
        } else if (posterUrls.length === 0) {
          watchlist.thumbnailUrl = null
          await watchlist.save()
        }
      })
      .catch((err: Error) => console.error('Failed to regenerate thumbnail:', err))

    return response.json({ watchlist })
  }

  async moveItemPosition({ request, response, params }: HttpContext) {
    const userId = request.user?.sub
    if (!userId) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const { id, tmdbId } = params
    const data = await request.validateUsing(moveItemValidator)

    const watchlist = await Watchlist.query()
      .where('id', id)
      .preload('collaborators')
      .preload('items', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!watchlist) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    const isOwner = watchlist.ownerId === userId
    const isCollaborator = watchlist.collaborators.some((c) => c.id === userId)

    if (!isOwner && !isCollaborator) {
      return response.forbidden({ error: 'Forbidden' })
    }

    const tmdbIdNum = Number.parseInt(tmdbId, 10)
    const item = watchlist.items.find((i) => i.tmdbId === tmdbIdNum)
    if (!item) {
      return response.notFound({ error: 'Item not found in watchlist' })
    }

    if (data.position === 'first') {
      // Move to first position
      await WatchlistItem.query()
        .where('watchlistId', watchlist.id)
        .where('position', '<', item.position)
        .increment('position', 1)
      item.position = 0
    } else {
      // Move to last position
      const maxPos = watchlist.items.length - 1
      await WatchlistItem.query()
        .where('watchlistId', watchlist.id)
        .where('position', '>', item.position)
        .decrement('position', 1)
      item.position = maxPos
    }

    await item.save()
    await watchlist.load('items', (q) => q.orderBy('position', 'asc'))

    // Regenerate thumbnail synchronously for move to ensure correct display
    const posterUrls = watchlist.items
      .slice(0, 4)
      .map((item) => getTMDBImageUrl(item.posterPath))
      .filter((url): url is string => url !== null)

    if (posterUrls.length > 0) {
      try {
        const thumbnailUrl = await regenerateThumbnail(id, posterUrls)
        if (thumbnailUrl) {
          watchlist.thumbnailUrl = thumbnailUrl
          await watchlist.save()
        }
      } catch (err) {
        console.error('Failed to regenerate thumbnail:', err)
      }
    }

    return response.json({ watchlist })
  }

  async reorderItems({ request, response, params }: HttpContext) {
    const userId = request.user?.sub
    if (!userId) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const { id } = params
    const data = await request.validateUsing(reorderItemsValidator)

    if (!isValidWatchlistId(id)) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    const watchlist = await Watchlist.query()
      .where('id', id)
      .preload('collaborators')
      .preload('items', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!watchlist) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    const isOwner = watchlist.ownerId === userId
    const isCollaborator = watchlist.collaborators.some((c) => c.id === userId)

    if (!isOwner && !isCollaborator) {
      return response.forbidden({ error: 'Forbidden' })
    }

    if (data.orderedTmdbIds.length !== watchlist.items.length) {
      return response.badRequest({ error: 'Invalid item order: missing or extra items' })
    }

    // Update positions
    for (let i = 0; i < data.orderedTmdbIds.length; i++) {
      const tmdbId = Number.parseInt(data.orderedTmdbIds[i], 10)
      await WatchlistItem.query()
        .where('watchlistId', watchlist.id)
        .where('tmdbId', tmdbId)
        .update({ position: i })
    }

    await watchlist.load('items', (q) => q.orderBy('position', 'asc'))

    // Regenerate thumbnail synchronously for reorder to ensure correct display
    const posterUrls = watchlist.items
      .slice(0, 4)
      .map((item) => getTMDBImageUrl(item.posterPath))
      .filter((url): url is string => url !== null)

    if (posterUrls.length > 0) {
      try {
        const thumbnailUrl = await regenerateThumbnail(id, posterUrls)
        if (thumbnailUrl) {
          watchlist.thumbnailUrl = thumbnailUrl
          await watchlist.save()
        }
      } catch (err) {
        console.error('Failed to regenerate thumbnail:', err)
      }
    }

    return response.json({ watchlist })
  }

  async uploadCover({ request, response, params }: HttpContext) {
    const userId = request.user?.sub
    if (!userId) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const { id } = params

    if (!isValidWatchlistId(id)) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    const watchlist = await Watchlist.find(id)

    if (!watchlist) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    if (watchlist.ownerId !== userId) {
      return response.forbidden({ error: 'Only owner can upload cover' })
    }

    const body = request.body()
    if (!body.imageData) {
      return response.badRequest({ error: 'No image data provided' })
    }

    if (!body.imageData.startsWith('data:image/')) {
      return response.badRequest({ error: 'Invalid image format. Must be a base64 data URL.' })
    }

    try {
      if (watchlist.imageUrl) {
        const oldPublicId = extractPublicIdFromUrl(watchlist.imageUrl)
        if (oldPublicId) {
          try {
            await cloudinary.uploader.destroy(oldPublicId)
          } catch {
            console.warn('Failed to delete old image')
          }
        }
      }

      const result = await cloudinary.uploader.upload(body.imageData, {
        folder: 'watchlists',
        width: 500,
        height: 500,
        crop: 'fill',
        resource_type: 'image',
      })

      watchlist.imageUrl = result.secure_url
      await watchlist.save()

      return response.json({
        watchlist,
        imageUrl: result.secure_url,
      })
    } catch (error) {
      return response.internalServerError({
        msg: 'Failed to upload image to Cloudinary',
        error,
      })
    }
  }

  async deleteCover({ request, response, params }: HttpContext) {
    const userId = request.user?.sub
    if (!userId) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const { id } = params

    if (!isValidWatchlistId(id)) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    const watchlist = await Watchlist.find(id)

    if (!watchlist) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    if (watchlist.ownerId !== userId) {
      return response.forbidden({ error: 'Only owner can delete cover' })
    }

    if (!watchlist.imageUrl) {
      return response.notFound({ error: 'No cover image to delete' })
    }

    const publicId = extractPublicIdFromUrl(watchlist.imageUrl)

    if (!publicId) {
      return response.badRequest({ error: 'Invalid image URL format' })
    }

    try {
      await cloudinary.uploader.destroy(publicId)

      watchlist.imageUrl = null
      await watchlist.save()

      return response.json({
        message: 'Cover image deleted successfully',
        watchlist,
      })
    } catch (error) {
      return response.internalServerError({
        msg: 'Failed to delete image from Cloudinary',
        error,
      })
    }
  }

  async reorderWatchlists({ request, response }: HttpContext) {
    const userId = request.user?.sub
    if (!userId) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const data = await request.validateUsing(reorderWatchlistsValidator)

    // Update positions in unified user_watchlist_positions table
    for (let i = 0; i < data.orderedWatchlistIds.length; i++) {
      await db
        .from('user_watchlist_positions')
        .where('user_id', userId)
        .where('watchlist_id', data.orderedWatchlistIds[i])
        .update({ position: i })
    }

    return response.json({ message: 'Watchlists reordered successfully' })
  }

  async searchTMDB({ request, response }: HttpContext) {
    const qs = request.qs()
    const query = qs.query as string
    const language = (qs.language as string) || 'fr-FR'
    const page = Number.parseInt(qs.page as string, 10) || 1

    if (!query || query.trim().length === 0) {
      return response.badRequest({ error: 'Query parameter is required' })
    }

    const results = await searchMedia(query, language, page)

    const cacheKey = `tmdb:search:${query}:${language}:${page}`
    await saveToCache(cacheKey, results, 1)

    return response.json(results)
  }

  async getItemDetails({ request, response, params }: HttpContext) {
    const { tmdbId, type } = params
    const qs = request.qs()
    const language = (qs.language as string) || 'fr-FR'

    if (!tmdbId || !type) {
      return response.badRequest({ error: 'tmdbId and type are required' })
    }

    if (type !== 'movie' && type !== 'tv') {
      return response.badRequest({ error: 'type must be either "movie" or "tv"' })
    }

    const details = await getFullMediaDetails(tmdbId, type, language)

    if (!details) {
      return response.notFound({ error: 'Media details not found' })
    }

    const responseData = { details }

    const cacheKey = `tmdb:details:${type}:${tmdbId}:${language}`
    await saveToCache(cacheKey, responseData, 7)

    return response.json(responseData)
  }

  async saveWatchlist({ request, response, params }: HttpContext) {
    const userId = request.user?.sub
    if (!userId) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const { id } = params

    if (!isValidWatchlistId(id)) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    const watchlist = await Watchlist.find(id)

    if (!watchlist) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    if (!watchlist.isPublic) {
      return response.forbidden({ error: 'Can only save public watchlists' })
    }

    if (watchlist.ownerId === userId) {
      return response.badRequest({ error: 'Cannot save your own watchlist' })
    }

    // Check if already saved
    const existingSave = await db
      .from('saved_watchlists')
      .where('user_id', userId)
      .where('watchlist_id', id)
      .first()

    if (existingSave) {
      return response.badRequest({ error: 'Watchlist already saved' })
    }

    // Save watchlist
    await db.table('saved_watchlists').insert({
      user_id: userId,
      watchlist_id: id,
      saved_at: DateTime.now().toSQL(),
    })

    // Add to likedBy
    const existingLike = await db
      .from('watchlist_likes')
      .where('user_id', userId)
      .where('watchlist_id', id)
      .first()

    if (!existingLike) {
      await db.table('watchlist_likes').insert({
        user_id: userId,
        watchlist_id: id,
        liked_at: DateTime.now().toSQL(),
      })
    }

    // Add to user's library at position 0, shift others
    await db
      .from('user_watchlist_positions')
      .where('user_id', userId)
      .increment('position', 1)

    await db.table('user_watchlist_positions').insert({
      user_id: userId,
      watchlist_id: id,
      position: 0,
      added_at: DateTime.now().toSQL(),
    })

    return response.json({ message: 'Watchlist saved successfully' })
  }

  async unsaveWatchlist({ request, response, params }: HttpContext) {
    const userId = request.user?.sub
    if (!userId) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const { id } = params

    const deleted = await db
      .from('saved_watchlists')
      .where('user_id', userId)
      .where('watchlist_id', id)
      .delete()

    if (!deleted) {
      return response.notFound({ error: 'Watchlist not in saved list' })
    }

    // Remove from likedBy
    await db.from('watchlist_likes').where('user_id', userId).where('watchlist_id', id).delete()

    // Remove from user's library positions and normalize
    const positionRecord = await db
      .from('user_watchlist_positions')
      .where('user_id', userId)
      .where('watchlist_id', id)
      .first()

    if (positionRecord) {
      await db
        .from('user_watchlist_positions')
        .where('user_id', userId)
        .where('watchlist_id', id)
        .delete()

      // Decrement positions for items that were after this one
      await db
        .from('user_watchlist_positions')
        .where('user_id', userId)
        .where('position', '>', positionRecord.position)
        .decrement('position', 1)
    }

    return response.json({ message: 'Watchlist removed from library' })
  }

  async duplicateWatchlist({ request, response, params }: HttpContext) {
    const userId = request.user?.sub
    if (!userId) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const { id } = params

    if (!isValidWatchlistId(id)) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    const originalWatchlist = await Watchlist.query()
      .where('id', id)
      .preload('collaborators')
      .preload('items', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!originalWatchlist) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    const isOwner = originalWatchlist.ownerId === userId
    const isCollaborator = originalWatchlist.collaborators.some((c) => c.id === userId)

    if (!originalWatchlist.isPublic && !isOwner && !isCollaborator) {
      return response.forbidden({ error: 'Access denied' })
    }

    if (isOwner) {
      return response.badRequest({ error: 'Cannot duplicate your own watchlist' })
    }

    // Create duplicated watchlist
    const duplicatedWatchlist = await Watchlist.create({
      ownerId: userId,
      name: `${originalWatchlist.name} (copy)`,
      description: originalWatchlist.description,
      isPublic: false,
      genres: originalWatchlist.genres,
      thumbnailUrl: originalWatchlist.thumbnailUrl,
      position: 0,
    })

    // Add to user's library at position 0, shift others
    await db
      .from('user_watchlist_positions')
      .where('user_id', userId)
      .increment('position', 1)

    await db.table('user_watchlist_positions').insert({
      user_id: userId,
      watchlist_id: duplicatedWatchlist.id,
      position: 0,
      added_at: DateTime.now().toSQL(),
    })

    // Copy items
    for (let i = 0; i < originalWatchlist.items.length; i++) {
      const item = originalWatchlist.items[i]
      await WatchlistItem.create({
        watchlistId: duplicatedWatchlist.id,
        tmdbId: item.tmdbId,
        mediaType: item.mediaType,
        title: item.title,
        posterPath: item.posterPath,
        platformList: item.platformList,
        runtime: item.runtime,
        numberOfSeasons: item.numberOfSeasons,
        numberOfEpisodes: item.numberOfEpisodes,
        position: i,
        addedAt: DateTime.now(),
      })
    }

    await duplicatedWatchlist.load('items', (q) => q.orderBy('position', 'asc'))

    // Regenerate thumbnail
    const posterUrls = duplicatedWatchlist.items
      .slice(0, 4)
      .map((item) => getTMDBImageUrl(item.posterPath))
      .filter((url): url is string => url !== null)

    if (posterUrls.length > 0) {
      regenerateThumbnail(duplicatedWatchlist.id, posterUrls)
        .then(async (thumbnailUrl) => {
          if (thumbnailUrl) {
            duplicatedWatchlist.thumbnailUrl = thumbnailUrl
            await duplicatedWatchlist.save()
          }
        })
        .catch((err: Error) => console.error('Failed to regenerate thumbnail:', err))
    }

    return response.created({ watchlist: duplicatedWatchlist })
  }

  async generateWatchlistThumbnail({ request, response, params }: HttpContext) {
    const userId = request.user?.sub
    if (!userId) {
      return response.unauthorized({ error: 'Unauthorized' })
    }

    const { id } = params

    if (!isValidWatchlistId(id)) {
      return response.badRequest({ error: 'Invalid watchlist ID' })
    }

    const watchlist = await Watchlist.query()
      .where('id', id)
      .preload('collaborators')
      .preload('items', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!watchlist) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    const isOwner = watchlist.ownerId === userId
    const isCollaborator = watchlist.collaborators.some((c) => c.id === userId)

    if (!isOwner && !isCollaborator) {
      return response.forbidden({ error: 'Forbidden' })
    }

    const posterUrls = watchlist.items
      .slice(0, 4)
      .map((item) => getTMDBImageUrl(item.posterPath))
      .filter((url): url is string => url !== null)

    if (posterUrls.length === 0) {
      return response.badRequest({ error: 'No posters available to generate thumbnail' })
    }

    const thumbnailBuffer = await generateThumbnail(posterUrls)
    const thumbnailUrl = await uploadThumbnailToCloudinary(thumbnailBuffer, id)

    watchlist.thumbnailUrl = thumbnailUrl
    await watchlist.save()

    return response.json({ thumbnailUrl })
  }

  async addCollaborator({ request, response, params }: HttpContext) {
    const userId = request.user?.sub
    if (!userId) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const { id } = params
    const data = await request.validateUsing(addCollaboratorValidator)

    if (!isValidWatchlistId(id)) {
      return response.badRequest({ error: 'Invalid watchlist ID' })
    }

    const watchlist = await Watchlist.query().where('id', id).preload('collaborators').first()

    if (!watchlist) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    if (watchlist.ownerId !== userId) {
      return response.forbidden({ error: 'Only the owner can add collaborators' })
    }

    const collaborator = await User.findBy('username', data.username)
    if (!collaborator) {
      return response.notFound({ error: 'User not found' })
    }

    if (collaborator.id === userId) {
      return response.badRequest({ error: 'Cannot add yourself as a collaborator' })
    }

    if (watchlist.collaborators.some((c) => c.id === collaborator.id)) {
      return response.badRequest({ error: 'User is already a collaborator' })
    }

    // Remove from likedBy/saved if was following
    await db.from('watchlist_likes').where('user_id', collaborator.id).where('watchlist_id', id).delete()
    await db.from('saved_watchlists').where('user_id', collaborator.id).where('watchlist_id', id).delete()

    // Check if collaborator already has this watchlist in their positions (from saved)
    const existingPosition = await db
      .from('user_watchlist_positions')
      .where('user_id', collaborator.id)
      .where('watchlist_id', id)
      .first()

    if (existingPosition) {
      // Remove old position entry and normalize
      await db
        .from('user_watchlist_positions')
        .where('user_id', collaborator.id)
        .where('watchlist_id', id)
        .delete()

      await db
        .from('user_watchlist_positions')
        .where('user_id', collaborator.id)
        .where('position', '>', existingPosition.position)
        .decrement('position', 1)
    }

    // Add as collaborator
    await db.table('watchlist_collaborators').insert({
      watchlist_id: id,
      user_id: collaborator.id,
      added_at: DateTime.now().toSQL(),
    })

    // Add to collaborator's library at position 0, shift others
    await db
      .from('user_watchlist_positions')
      .where('user_id', collaborator.id)
      .increment('position', 1)

    await db.table('user_watchlist_positions').insert({
      user_id: collaborator.id,
      watchlist_id: id,
      position: 0,
      added_at: DateTime.now().toSQL(),
    })

    // Reload watchlist with all collaborators
    await watchlist.load('collaborators')
    const collaborators = watchlist.collaborators.map((c) => ({
      id: c.id,
      username: c.username,
      email: c.email,
      avatarUrl: c.avatarUrl || null,
    }))

    return response.json({ collaborators })
  }

  async removeCollaborator({ request, response, params }: HttpContext) {
    const userId = request.user?.sub
    if (!userId) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const { id, collaboratorId } = params

    if (!isValidWatchlistId(id)) {
      return response.badRequest({ error: 'Invalid watchlist ID' })
    }

    const watchlist = await Watchlist.find(id)
    if (!watchlist) {
      return response.notFound({ error: 'Watchlist not found' })
    }

    if (watchlist.ownerId !== userId) {
      return response.forbidden({ error: 'Only the owner can remove collaborators' })
    }

    const deleted = await db
      .from('watchlist_collaborators')
      .where('watchlist_id', id)
      .where('user_id', collaboratorId)
      .delete()

    if (!deleted) {
      return response.notFound({ error: 'Collaborator not found' })
    }

    // Remove from collaborator's library positions and normalize
    const positionRecord = await db
      .from('user_watchlist_positions')
      .where('user_id', collaboratorId)
      .where('watchlist_id', id)
      .first()

    if (positionRecord) {
      await db
        .from('user_watchlist_positions')
        .where('user_id', collaboratorId)
        .where('watchlist_id', id)
        .delete()

      await db
        .from('user_watchlist_positions')
        .where('user_id', collaboratorId)
        .where('position', '>', positionRecord.position)
        .decrement('position', 1)
    }

    // Reload watchlist with remaining collaborators
    await watchlist.load('collaborators')
    const collaborators = watchlist.collaborators.map((c) => ({
      id: c.id,
      username: c.username,
      email: c.email,
      avatarUrl: c.avatarUrl || null,
    }))

    return response.json({ collaborators })
  }

  async leaveWatchlist({ request, response, params }: HttpContext) {
    const userId = request.user?.sub
    if (!userId) {
      return response.unauthorized({ error: 'Not authenticated' })
    }

    const { id } = params

    if (!isValidWatchlistId(id)) {
      return response.badRequest({ error: 'Invalid watchlist ID' })
    }

    const deleted = await db
      .from('watchlist_collaborators')
      .where('watchlist_id', id)
      .where('user_id', userId)
      .delete()

    if (!deleted) {
      return response.forbidden({ error: 'You are not a collaborator of this watchlist' })
    }

    // Remove from user's library positions and normalize
    const positionRecord = await db
      .from('user_watchlist_positions')
      .where('user_id', userId)
      .where('watchlist_id', id)
      .first()

    if (positionRecord) {
      await db
        .from('user_watchlist_positions')
        .where('user_id', userId)
        .where('watchlist_id', id)
        .delete()

      await db
        .from('user_watchlist_positions')
        .where('user_id', userId)
        .where('position', '>', positionRecord.position)
        .decrement('position', 1)
    }

    return response.json({ message: 'Left watchlist successfully' })
  }
}
