import type { Context } from 'hono'
import type { InputJsonValue } from '@prisma/client/runtime/library'
import prisma from '../lib/prisma.js'
import { cloudinary, deleteFromCloudinary } from '../services/cloudinary.js'
import {
  deleteThumbnailFromCloudinary,
  generateThumbnail,
  regenerateThumbnail,
  uploadThumbnailToCloudinary,
} from '../services/thumbnail.js'
import { enrichMediaData, getFullMediaDetails, searchMedia } from '../services/tmdb.js'
import { saveToCache } from '../services/cache.js'
import {
  createWatchlistSchema,
  updateWatchlistSchema,
  addCollaboratorSchema,
  addItemSchema,
  moveItemSchema,
  reorderItemsSchema,
  reorderWatchlistsSchema,
} from '../validators/watchlists.js'
import type { AppEnv } from '../app.js'
import type { Platform } from '../types/index.js'

type C = Context<AppEnv>

// ========================================
// Helpers
// ========================================

function isValidWatchlistId(id: string): boolean {
  if (id.startsWith('offline-')) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

function getTMDBImageUrl(path: string | null | undefined, size: string = 'w342'): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `https://image.tmdb.org/t/p/${size}${path}`
}

function formatWatchlistWithRelations(watchlist: any) {
  return {
    id: watchlist.id,
    ownerId: watchlist.ownerId,
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
      ? { id: watchlist.owner.id, email: watchlist.owner.email, username: watchlist.owner.username, avatarUrl: watchlist.owner.avatarUrl }
      : undefined,
    collaborators: watchlist.collaborators?.map((c: any) => ({
      id: c.user?.id ?? c.id,
      email: c.user?.email ?? c.email,
      username: c.user?.username ?? c.username,
      avatarUrl: c.user?.avatarUrl ?? c.avatarUrl,
    })),
    items: watchlist.items,
    likedBy: watchlist.likedBy?.map((l: any) => ({
      id: l.user?.id ?? l.id,
      email: l.user?.email ?? l.email,
      username: l.user?.username ?? l.username,
      avatarUrl: l.user?.avatarUrl ?? l.avatarUrl,
    })),
  }
}

const fullWatchlistInclude = {
  owner: { select: { id: true, email: true, username: true, avatarUrl: true } },
  collaborators: { include: { user: { select: { id: true, email: true, username: true, avatarUrl: true } } } },
  items: { orderBy: { position: 'asc' as const } },
  likedBy: { include: { user: { select: { id: true, email: true, username: true, avatarUrl: true } } } },
}

// ========================================
// Public
// ========================================

export const getPublicFeatured = async (c: C) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '6', 10), 1000)
  const userId = c.get('user')?.sub

  const watchlists = await prisma.watchlist.findMany({
    where: { isPublic: true },
    include: fullWatchlistInclude,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  const sortedWatchlists = watchlists
    .map((w) => ({
      ...formatWatchlistWithRelations(w),
      followersCount: w.likedBy?.length || 0,
    }))
    .sort((a, b) => b.followersCount - a.followersCount)

  if (userId) {
    const savedIds = await prisma.savedWatchlist.findMany({
      where: { userId },
      select: { watchlistId: true },
    })
    const savedIdsSet = new Set(savedIds.map((r) => r.watchlistId))

    const watchlistsWithFlags = sortedWatchlists.map((w: any) => ({
      ...w,
      isOwner: w.ownerId === userId,
      isCollaborator: w.collaborators?.some((col: any) => col.id === userId) || false,
      isSaved: savedIdsSet.has(w.id),
    }))

    return c.json({ watchlists: watchlistsWithFlags })
  }

  return c.json({ watchlists: sortedWatchlists })
}

export const getPublicWatchlist = async (c: C) => {
  const id = c.req.param('id')

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  const watchlist = await prisma.watchlist.findUnique({
    where: { id },
    include: fullWatchlistInclude,
  })

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  if (!watchlist.isPublic) {
    return c.json({ error: 'This watchlist is private' }, 403)
  }

  return c.json({ watchlist: formatWatchlistWithRelations(watchlist) })
}

export const getWatchlistsByGenre = async (c: C) => {
  const genre = c.req.param('genre')

  if (!genre || genre.trim().length === 0) {
    return c.json({ error: 'Genre parameter is required' }, 400)
  }

  const watchlists = await prisma.watchlist.findMany({
    where: {
      isPublic: true,
      genres: { has: genre },
    },
    include: fullWatchlistInclude,
    orderBy: { createdAt: 'desc' },
  })

  return c.json({ watchlists: watchlists.map(formatWatchlistWithRelations) })
}

export const getWatchlistCountByGenre = async (c: C) => {
  const genre = c.req.param('genre')

  if (!genre || genre.trim().length === 0) {
    return c.json({ error: 'Genre parameter is required' }, 400)
  }

  const count = await prisma.watchlist.count({
    where: {
      isPublic: true,
      genres: { has: genre },
    },
  })

  return c.json({ genre, count })
}

export const searchTMDB = async (c: C) => {
  const query = c.req.query('query')
  const language = c.req.query('language') || 'fr-FR'
  const page = parseInt(c.req.query('page') || '1', 10)

  if (!query || query.trim().length === 0) {
    return c.json({ error: 'Query parameter is required' }, 400)
  }

  const results = await searchMedia(query, language, page)

  const cacheKey = `tmdb:search:${query}:${language}:${page}`
  await saveToCache(cacheKey, results, 1)

  return c.json(results)
}

export const getItemDetails = async (c: C) => {
  const tmdbId = c.req.param('tmdbId')
  const type = c.req.param('type')
  const language = c.req.query('language') || 'fr-FR'

  if (!tmdbId || !type) {
    return c.json({ error: 'tmdbId and type are required' }, 400)
  }

  if (type !== 'movie' && type !== 'tv') {
    return c.json({ error: 'type must be either "movie" or "tv"' }, 400)
  }

  const details = await getFullMediaDetails(tmdbId, type, language)

  if (!details) {
    return c.json({ error: 'Media details not found' }, 404)
  }

  const responseData = { details }

  const cacheKey = `tmdb:details:${type}:${tmdbId}:${language}`
  await saveToCache(cacheKey, responseData, 7)

  return c.json(responseData)
}

// ========================================
// Protected
// ========================================

export const getMyWatchlists = async (c: C) => {
  const userId = c.get('user')!.sub

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  const userPositions = await prisma.userWatchlistPosition.findMany({
    where: { userId },
    orderBy: { position: 'asc' },
  })
  const positionMap = new Map(userPositions.map((r) => [r.watchlistId, r.position]))

  const ownedWatchlists = await prisma.watchlist.findMany({
    where: { ownerId: userId },
    include: {
      owner: { select: { id: true, email: true, username: true, avatarUrl: true } },
      collaborators: { include: { user: { select: { id: true, email: true, username: true, avatarUrl: true } } } },
      items: { orderBy: { position: 'asc' } },
    },
  })

  const collabRecords = await prisma.watchlistCollaborator.findMany({
    where: { userId },
    select: { watchlistId: true },
  })
  const collabIds = collabRecords.map((r) => r.watchlistId)

  const collaborativeWatchlists =
    collabIds.length > 0
      ? await prisma.watchlist.findMany({
          where: { id: { in: collabIds } },
          include: {
            owner: { select: { id: true, email: true, username: true, avatarUrl: true } },
            collaborators: { include: { user: { select: { id: true, email: true, username: true, avatarUrl: true } } } },
            items: { orderBy: { position: 'asc' } },
          },
        })
      : []

  const savedRecords = await prisma.savedWatchlist.findMany({
    where: { userId },
    select: { watchlistId: true },
  })
  const savedIds = savedRecords.map((r) => r.watchlistId)

  const savedWatchlists =
    savedIds.length > 0
      ? await prisma.watchlist.findMany({
          where: { id: { in: savedIds } },
          include: {
            owner: { select: { id: true, email: true, username: true, avatarUrl: true } },
            collaborators: { include: { user: { select: { id: true, email: true, username: true, avatarUrl: true } } } },
            items: { orderBy: { position: 'asc' } },
          },
        })
      : []

  const watchlistsMap = new Map<string, any>()
  const savedIdsSet = new Set(savedIds)
  const collabIdsSet = new Set(collabIds)

  ownedWatchlists.forEach((w) => {
    watchlistsMap.set(w.id, {
      ...formatWatchlistWithRelations(w),
      isOwner: true,
      isCollaborator: false,
      isSaved: savedIdsSet.has(w.id),
      libraryPosition: positionMap.get(w.id) ?? 9999,
    })
  })

  collaborativeWatchlists.forEach((w) => {
    if (!watchlistsMap.has(w.id)) {
      watchlistsMap.set(w.id, {
        ...formatWatchlistWithRelations(w),
        isOwner: false,
        isCollaborator: true,
        isSaved: savedIdsSet.has(w.id),
        libraryPosition: positionMap.get(w.id) ?? 9999,
      })
    }
  })

  savedWatchlists.forEach((w) => {
    if (!watchlistsMap.has(w.id)) {
      watchlistsMap.set(w.id, {
        ...formatWatchlistWithRelations(w),
        isOwner: false,
        isCollaborator: collabIdsSet.has(w.id),
        isSaved: true,
        libraryPosition: positionMap.get(w.id) ?? 9999,
      })
    }
  })

  const watchlists = Array.from(watchlistsMap.values()).sort(
    (a, b) => (a.libraryPosition ?? 9999) - (b.libraryPosition ?? 9999)
  )

  return c.json({ watchlists })
}

export const createWatchlist = async (c: C) => {
  const userId = c.get('user')!.sub
  const body = await c.req.json()
  const parsed = createWatchlistSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 422)
  }
  const data = parsed.data

  if (data.fromLocalStorage) {
    const existing = await prisma.watchlist.findFirst({
      where: { ownerId: userId, name: data.name },
    })
    if (existing) {
      data.name = `${data.name} (local)`
    }
  }

  const watchlist = await prisma.watchlist.create({
    data: {
      ownerId: userId,
      name: data.name,
      description: data.description,
      isPublic: data.isPublic || false,
      genres: data.genres || [],
      position: 0,
    },
  })

  await prisma.$executeRaw`UPDATE user_watchlist_positions SET position = position + 1 WHERE user_id = ${userId}::uuid`

  await prisma.userWatchlistPosition.create({
    data: { userId, watchlistId: watchlist.id, position: 0 },
  })

  if (data.items && data.items.length > 0) {
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i]
      await prisma.watchlistItem.create({
        data: {
          watchlistId: watchlist.id,
          tmdbId: item.tmdbId,
          mediaType: item.mediaType,
          title: item.title,
          posterPath: item.posterPath,
          platformList: (item.platformList || []).map((p: any) => ({
            name: p.name || '',
            logoPath: p.logoPath || '',
          })) as InputJsonValue,
          runtime: item.runtime,
          numberOfSeasons: item.numberOfSeasons,
          numberOfEpisodes: item.numberOfEpisodes,
          position: i,
        },
      })
    }

    const posterUrls = data.items
      .slice(0, 4)
      .map((item) => getTMDBImageUrl(item.posterPath))
      .filter((url): url is string => url !== null)

    if (posterUrls.length > 0) {
      regenerateThumbnail(watchlist.id, posterUrls)
        .then(async (thumbnailUrl) => {
          if (thumbnailUrl) {
            await prisma.watchlist.update({
              where: { id: watchlist.id },
              data: { thumbnailUrl },
            })
          }
        })
        .catch((err: Error) => console.error('Failed to regenerate thumbnail:', err))
    }
  }

  const fullWatchlist = await prisma.watchlist.findUnique({
    where: { id: watchlist.id },
    include: { items: { orderBy: { position: 'asc' } } },
  })

  return c.json({ watchlist: fullWatchlist }, 201)
}

export const reorderWatchlists = async (c: C) => {
  const userId = c.get('user')!.sub
  const body = await c.req.json()
  const parsed = reorderWatchlistsSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed' }, 422)
  }

  for (let i = 0; i < parsed.data.orderedWatchlistIds.length; i++) {
    await prisma.userWatchlistPosition.updateMany({
      where: { userId, watchlistId: parsed.data.orderedWatchlistIds[i] },
      data: { position: i },
    })
  }

  return c.json({ message: 'Watchlists reordered successfully' })
}

export const getWatchlistById = async (c: C) => {
  const userId = c.get('user')!.sub
  const id = c.req.param('id')

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  const watchlist = await prisma.watchlist.findUnique({
    where: { id },
    include: fullWatchlistInclude,
  })

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  const isOwner = watchlist.ownerId === userId
  const isCollaborator = watchlist.collaborators.some((c) => c.userId === userId)
  const isPublic = watchlist.isPublic

  if (!isOwner && !isCollaborator && !isPublic) {
    return c.json({ error: 'Access denied' }, 403)
  }

  const savedCheck = await prisma.savedWatchlist.findUnique({
    where: { userId_watchlistId: { userId, watchlistId: id } },
  })
  const isSaved = !!savedCheck

  return c.json({
    watchlist: formatWatchlistWithRelations(watchlist),
    isSaved,
    isOwner,
    isCollaborator,
  })
}

export const updateWatchlist = async (c: C) => {
  const userId = c.get('user')!.sub
  const id = c.req.param('id')
  const body = await c.req.json()
  const parsed = updateWatchlistSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 422)
  }
  const data = parsed.data

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  const watchlist = await prisma.watchlist.findUnique({
    where: { id },
    include: {
      collaborators: true,
      items: { orderBy: { position: 'asc' } },
    },
  })

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  const isOwner = watchlist.ownerId === userId
  const isCollaborator = watchlist.collaborators.some((c) => c.userId === userId)

  if (!isOwner && !isCollaborator) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const updateData: any = {}
  if (data.name) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.isPublic !== undefined) updateData.isPublic = data.isPublic
  if (data.genres !== undefined) updateData.genres = data.genres

  if (data.items) {
    await prisma.watchlistItem.deleteMany({ where: { watchlistId: id } })

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i]
      const cleanedPlatformList = (item.platformList || [])
        .filter((p: any): p is Platform => p !== null && p !== undefined)
        .map((p: any) => {
          if (typeof p === 'string') {
            return p.trim() ? { name: p, logoPath: '' } : null
          }
          if (p && typeof p === 'object' && 'name' in p && typeof p.name === 'string' && p.name.trim()) {
            return { name: p.name, logoPath: typeof p.logoPath === 'string' ? p.logoPath : '' }
          }
          return null
        })
        .filter((p: any): p is Platform => p !== null)

      const platformListValue = cleanedPlatformList.length > 0
        ? cleanedPlatformList
        : [{ name: 'Inconnu', logoPath: '' }]

      await prisma.watchlistItem.create({
        data: {
          watchlistId: id,
          tmdbId: item.tmdbId,
          mediaType: item.mediaType,
          title: item.title,
          posterPath: item.posterPath,
          platformList: platformListValue as unknown as InputJsonValue,
          runtime: item.runtime,
          numberOfSeasons: item.numberOfSeasons,
          numberOfEpisodes: item.numberOfEpisodes,
          position: i,
          addedAt: item.addedAt ? new Date(item.addedAt) : new Date(),
        },
      })
    }
  }

  await prisma.watchlist.update({ where: { id }, data: updateData })

  const updated = await prisma.watchlist.findUnique({
    where: { id },
    include: { items: { orderBy: { position: 'asc' } } },
  })

  return c.json({ watchlist: updated })
}

export const deleteWatchlist = async (c: C) => {
  const userId = c.get('user')!.sub
  const id = c.req.param('id')

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  const watchlist = await prisma.watchlist.findUnique({ where: { id } })

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  if (watchlist.ownerId !== userId) {
    return c.json({ error: 'Only owner can delete watchlist' }, 403)
  }

  if (watchlist.imageUrl) {
    await deleteFromCloudinary(watchlist.imageUrl)
  }
  if (watchlist.thumbnailUrl) {
    await deleteThumbnailFromCloudinary(id)
  }

  const positionRecords = await prisma.userWatchlistPosition.findMany({
    where: { watchlistId: id },
  })

  await prisma.watchlistLike.deleteMany({ where: { watchlistId: id } })
  await prisma.savedWatchlist.deleteMany({ where: { watchlistId: id } })
  await prisma.watchlistCollaborator.deleteMany({ where: { watchlistId: id } })
  await prisma.userWatchlistPosition.deleteMany({ where: { watchlistId: id } })

  for (const record of positionRecords) {
    await prisma.$executeRaw`UPDATE user_watchlist_positions SET position = position - 1 WHERE user_id = ${record.userId}::uuid AND position > ${record.position}`
  }

  await prisma.watchlist.delete({ where: { id } })

  return c.json({ message: 'Watchlist deleted successfully' })
}

export const addCollaborator = async (c: C) => {
  const userId = c.get('user')!.sub
  const id = c.req.param('id')
  const body = await c.req.json()
  const parsed = addCollaboratorSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed' }, 422)
  }

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Invalid watchlist ID' }, 400)
  }

  const watchlist = await prisma.watchlist.findUnique({
    where: { id },
    include: { collaborators: { include: { user: true } } },
  })

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  if (watchlist.ownerId !== userId) {
    return c.json({ error: 'Only the owner can add collaborators' }, 403)
  }

  const collaborator = await prisma.user.findUnique({ where: { username: parsed.data.username } })
  if (!collaborator) {
    return c.json({ error: 'User not found' }, 404)
  }

  if (collaborator.id === userId) {
    return c.json({ error: 'Cannot add yourself as a collaborator' }, 400)
  }

  if (watchlist.collaborators.some((c) => c.userId === collaborator.id)) {
    return c.json({ error: 'User is already a collaborator' }, 400)
  }

  await prisma.watchlistLike.deleteMany({ where: { userId: collaborator.id, watchlistId: id } })
  await prisma.savedWatchlist.deleteMany({ where: { userId: collaborator.id, watchlistId: id } })

  const existingPosition = await prisma.userWatchlistPosition.findUnique({
    where: { userId_watchlistId: { userId: collaborator.id, watchlistId: id } },
  })

  if (existingPosition) {
    await prisma.userWatchlistPosition.delete({
      where: { userId_watchlistId: { userId: collaborator.id, watchlistId: id } },
    })
    await prisma.$executeRaw`UPDATE user_watchlist_positions SET position = position - 1 WHERE user_id = ${collaborator.id}::uuid AND position > ${existingPosition.position}`
  }

  await prisma.watchlistCollaborator.create({
    data: { watchlistId: id, userId: collaborator.id },
  })

  await prisma.$executeRaw`UPDATE user_watchlist_positions SET position = position + 1 WHERE user_id = ${collaborator.id}::uuid`

  await prisma.userWatchlistPosition.create({
    data: { userId: collaborator.id, watchlistId: id, position: 0 },
  })

  const updatedCollaborators = await prisma.watchlistCollaborator.findMany({
    where: { watchlistId: id },
    include: { user: { select: { id: true, username: true, email: true, avatarUrl: true } } },
  })

  return c.json({
    collaborators: updatedCollaborators.map((c) => ({
      id: c.user.id,
      username: c.user.username,
      email: c.user.email,
      avatarUrl: c.user.avatarUrl || null,
    })),
  })
}

export const removeCollaborator = async (c: C) => {
  const userId = c.get('user')!.sub
  const id = c.req.param('id')
  const collaboratorId = c.req.param('collaboratorId')

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Invalid watchlist ID' }, 400)
  }

  const watchlist = await prisma.watchlist.findUnique({ where: { id } })
  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  if (watchlist.ownerId !== userId) {
    return c.json({ error: 'Only the owner can remove collaborators' }, 403)
  }

  const deleted = await prisma.watchlistCollaborator.deleteMany({
    where: { watchlistId: id, userId: collaboratorId },
  })

  if (deleted.count === 0) {
    return c.json({ error: 'Collaborator not found' }, 404)
  }

  const positionRecord = await prisma.userWatchlistPosition.findUnique({
    where: { userId_watchlistId: { userId: collaboratorId, watchlistId: id } },
  })

  if (positionRecord) {
    await prisma.userWatchlistPosition.delete({
      where: { userId_watchlistId: { userId: collaboratorId, watchlistId: id } },
    })
    await prisma.$executeRaw`UPDATE user_watchlist_positions SET position = position - 1 WHERE user_id = ${collaboratorId}::uuid AND position > ${positionRecord.position}`
  }

  const updatedCollaborators = await prisma.watchlistCollaborator.findMany({
    where: { watchlistId: id },
    include: { user: { select: { id: true, username: true, email: true, avatarUrl: true } } },
  })

  return c.json({
    collaborators: updatedCollaborators.map((c) => ({
      id: c.user.id,
      username: c.user.username,
      email: c.user.email,
      avatarUrl: c.user.avatarUrl || null,
    })),
  })
}

export const leaveWatchlist = async (c: C) => {
  const userId = c.get('user')!.sub
  const id = c.req.param('id')

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Invalid watchlist ID' }, 400)
  }

  const deleted = await prisma.watchlistCollaborator.deleteMany({
    where: { watchlistId: id, userId },
  })

  if (deleted.count === 0) {
    return c.json({ error: 'You are not a collaborator of this watchlist' }, 403)
  }

  const positionRecord = await prisma.userWatchlistPosition.findUnique({
    where: { userId_watchlistId: { userId, watchlistId: id } },
  })

  if (positionRecord) {
    await prisma.userWatchlistPosition.delete({
      where: { userId_watchlistId: { userId, watchlistId: id } },
    })
    await prisma.$executeRaw`UPDATE user_watchlist_positions SET position = position - 1 WHERE user_id = ${userId}::uuid AND position > ${positionRecord.position}`
  }

  return c.json({ message: 'Left watchlist successfully' })
}

export const addItemToWatchlist = async (c: C) => {
  const userId = c.get('user')!.sub
  const id = c.req.param('id')
  const body = await c.req.json()
  const parsed = addItemSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 422)
  }
  const data = parsed.data

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  const watchlist = await prisma.watchlist.findUnique({
    where: { id },
    include: {
      collaborators: true,
      items: { orderBy: { position: 'asc' } },
    },
  })

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  const isOwner = watchlist.ownerId === userId
  const isCollaborator = watchlist.collaborators.some((c) => c.userId === userId)

  if (!isOwner && !isCollaborator) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const tmdbIdNum = parseInt(data.tmdbId, 10)
  const itemExists = watchlist.items.some((item) => item.tmdbId === tmdbIdNum)
  if (itemExists) {
    return c.json({ error: 'Item already exists in watchlist' }, 400)
  }

  const enrichedData = await enrichMediaData(
    data.tmdbId,
    data.mediaType,
    data.language || 'fr-FR',
    data.region || 'FR'
  )

  if (!enrichedData) {
    return c.json({ error: 'Failed to fetch media details from TMDB' }, 500)
  }

  const maxPosItem = watchlist.items.length > 0
    ? Math.max(...watchlist.items.map((i) => i.position ?? 0))
    : -1
  const newPosition = maxPosItem + 1

  await prisma.watchlistItem.create({
    data: {
      watchlistId: id,
      tmdbId: parseInt(enrichedData.tmdbId, 10),
      mediaType: enrichedData.mediaType,
      title: enrichedData.title,
      posterPath: enrichedData.posterPath,
      platformList: enrichedData.platformList as unknown as InputJsonValue,
      runtime: enrichedData.runtime,
      numberOfSeasons: enrichedData.numberOfSeasons,
      numberOfEpisodes: enrichedData.numberOfEpisodes,
      position: newPosition,
    },
  })

  const updatedWatchlist = await prisma.watchlist.findUnique({
    where: { id },
    include: { items: { orderBy: { position: 'asc' } } },
  })

  const posterUrls = updatedWatchlist!.items
    .slice(0, 4)
    .map((item) => getTMDBImageUrl(item.posterPath))
    .filter((url): url is string => url !== null)

  regenerateThumbnail(id, posterUrls)
    .then(async (thumbnailUrl) => {
      if (thumbnailUrl) {
        await prisma.watchlist.update({ where: { id }, data: { thumbnailUrl } })
      }
    })
    .catch((err: Error) => console.error('Failed to regenerate thumbnail:', err))

  return c.json({ watchlist: updatedWatchlist })
}

export const removeItemFromWatchlist = async (c: C) => {
  const userId = c.get('user')!.sub
  const id = c.req.param('id')
  const tmdbId = c.req.param('tmdbId')

  const watchlist = await prisma.watchlist.findUnique({
    where: { id },
    include: {
      collaborators: true,
      items: { orderBy: { position: 'asc' } },
    },
  })

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  const isOwner = watchlist.ownerId === userId
  const isCollaborator = watchlist.collaborators.some((c) => c.userId === userId)

  if (!isOwner && !isCollaborator) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const tmdbIdNum = parseInt(tmdbId, 10)
  const deleted = await prisma.watchlistItem.deleteMany({
    where: { watchlistId: id, tmdbId: tmdbIdNum },
  })

  if (deleted.count === 0) {
    return c.json({ error: 'Item not found in watchlist' }, 404)
  }

  const updatedWatchlist = await prisma.watchlist.findUnique({
    where: { id },
    include: { items: { orderBy: { position: 'asc' } } },
  })

  const posterUrls = updatedWatchlist!.items
    .slice(0, 4)
    .map((item) => getTMDBImageUrl(item.posterPath))
    .filter((url): url is string => url !== null)

  regenerateThumbnail(id, posterUrls)
    .then(async (thumbnailUrl) => {
      if (thumbnailUrl) {
        await prisma.watchlist.update({ where: { id }, data: { thumbnailUrl } })
      } else if (posterUrls.length === 0) {
        await prisma.watchlist.update({ where: { id }, data: { thumbnailUrl: null } })
      }
    })
    .catch((err: Error) => console.error('Failed to regenerate thumbnail:', err))

  return c.json({ watchlist: updatedWatchlist })
}

export const moveItemPosition = async (c: C) => {
  const userId = c.get('user')!.sub
  const id = c.req.param('id')
  const tmdbId = c.req.param('tmdbId')
  const body = await c.req.json()
  const parsed = moveItemSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed' }, 422)
  }

  const watchlist = await prisma.watchlist.findUnique({
    where: { id },
    include: {
      collaborators: true,
      items: { orderBy: { position: 'asc' } },
    },
  })

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  const isOwner = watchlist.ownerId === userId
  const isCollaborator = watchlist.collaborators.some((c) => c.userId === userId)

  if (!isOwner && !isCollaborator) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const tmdbIdNum = parseInt(tmdbId, 10)
  const item = watchlist.items.find((i) => i.tmdbId === tmdbIdNum)
  if (!item) {
    return c.json({ error: 'Item not found in watchlist' }, 404)
  }

  const itemPosition = item.position ?? 0

  if (parsed.data.position === 'first') {
    await prisma.$executeRaw`UPDATE watchlist_items SET position = position + 1 WHERE watchlist_id = ${id}::uuid AND position < ${itemPosition}`
    await prisma.watchlistItem.update({ where: { id: item.id }, data: { position: 0 } })
  } else {
    const maxPos = watchlist.items.length - 1
    await prisma.$executeRaw`UPDATE watchlist_items SET position = position - 1 WHERE watchlist_id = ${id}::uuid AND position > ${itemPosition}`
    await prisma.watchlistItem.update({ where: { id: item.id }, data: { position: maxPos } })
  }

  const updatedWatchlist = await prisma.watchlist.findUnique({
    where: { id },
    include: { items: { orderBy: { position: 'asc' } } },
  })

  const posterUrls = updatedWatchlist!.items
    .slice(0, 4)
    .map((item) => getTMDBImageUrl(item.posterPath))
    .filter((url): url is string => url !== null)

  if (posterUrls.length > 0) {
    try {
      const thumbnailUrl = await regenerateThumbnail(id, posterUrls)
      if (thumbnailUrl) {
        await prisma.watchlist.update({ where: { id }, data: { thumbnailUrl } })
      }
    } catch (err) {
      console.error('Failed to regenerate thumbnail:', err)
    }
  }

  return c.json({ watchlist: updatedWatchlist })
}

export const reorderItems = async (c: C) => {
  const userId = c.get('user')!.sub
  const id = c.req.param('id')
  const body = await c.req.json()
  const parsed = reorderItemsSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed' }, 422)
  }

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  const watchlist = await prisma.watchlist.findUnique({
    where: { id },
    include: {
      collaborators: true,
      items: { orderBy: { position: 'asc' } },
    },
  })

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  const isOwner = watchlist.ownerId === userId
  const isCollaborator = watchlist.collaborators.some((c) => c.userId === userId)

  if (!isOwner && !isCollaborator) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  if (parsed.data.orderedTmdbIds.length !== watchlist.items.length) {
    return c.json({ error: 'Invalid item order: missing or extra items' }, 400)
  }

  for (let i = 0; i < parsed.data.orderedTmdbIds.length; i++) {
    const tmdbId = parseInt(parsed.data.orderedTmdbIds[i], 10)
    await prisma.watchlistItem.updateMany({
      where: { watchlistId: id, tmdbId },
      data: { position: i },
    })
  }

  const updatedWatchlist = await prisma.watchlist.findUnique({
    where: { id },
    include: { items: { orderBy: { position: 'asc' } } },
  })

  const posterUrls = updatedWatchlist!.items
    .slice(0, 4)
    .map((item) => getTMDBImageUrl(item.posterPath))
    .filter((url): url is string => url !== null)

  if (posterUrls.length > 0) {
    try {
      const thumbnailUrl = await regenerateThumbnail(id, posterUrls)
      if (thumbnailUrl) {
        await prisma.watchlist.update({ where: { id }, data: { thumbnailUrl } })
      }
    } catch (err) {
      console.error('Failed to regenerate thumbnail:', err)
    }
  }

  return c.json({ watchlist: updatedWatchlist })
}

export const uploadCover = async (c: C) => {
  const userId = c.get('user')!.sub
  const id = c.req.param('id')

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  const watchlist = await prisma.watchlist.findUnique({ where: { id } })

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  if (watchlist.ownerId !== userId) {
    return c.json({ error: 'Only owner can upload cover' }, 403)
  }

  const body = await c.req.json()
  if (!body.imageData) {
    return c.json({ error: 'No image data provided' }, 400)
  }

  if (!body.imageData.startsWith('data:image/')) {
    return c.json({ error: 'Invalid image format. Must be a base64 data URL.' }, 400)
  }

  try {
    if (watchlist.imageUrl) {
      await deleteFromCloudinary(watchlist.imageUrl)
    }

    const result = await cloudinary.uploader.upload(body.imageData, {
      folder: 'watchlists',
      width: 500,
      height: 500,
      crop: 'fill',
      resource_type: 'image',
    })

    const updated = await prisma.watchlist.update({
      where: { id },
      data: { imageUrl: result.secure_url },
    })

    return c.json({ watchlist: updated, imageUrl: result.secure_url })
  } catch (error) {
    return c.json({ msg: 'Failed to upload image to Cloudinary', error }, 500)
  }
}

export const deleteCover = async (c: C) => {
  const userId = c.get('user')!.sub
  const id = c.req.param('id')

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  const watchlist = await prisma.watchlist.findUnique({ where: { id } })

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  if (watchlist.ownerId !== userId) {
    return c.json({ error: 'Only owner can delete cover' }, 403)
  }

  if (!watchlist.imageUrl) {
    return c.json({ error: 'No cover image to delete' }, 404)
  }

  await deleteFromCloudinary(watchlist.imageUrl)

  const updated = await prisma.watchlist.update({
    where: { id },
    data: { imageUrl: null },
  })

  return c.json({ message: 'Cover image deleted successfully', watchlist: updated })
}

export const generateWatchlistThumbnail = async (c: C) => {
  const userId = c.get('user')!.sub
  const id = c.req.param('id')

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Invalid watchlist ID' }, 400)
  }

  const watchlist = await prisma.watchlist.findUnique({
    where: { id },
    include: {
      collaborators: true,
      items: { orderBy: { position: 'asc' } },
    },
  })

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  const isOwner = watchlist.ownerId === userId
  const isCollaborator = watchlist.collaborators.some((c) => c.userId === userId)

  if (!isOwner && !isCollaborator) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const posterUrls = watchlist.items
    .slice(0, 4)
    .map((item) => getTMDBImageUrl(item.posterPath))
    .filter((url): url is string => url !== null)

  if (posterUrls.length === 0) {
    return c.json({ error: 'No posters available to generate thumbnail' }, 400)
  }

  const thumbnailBuffer = await generateThumbnail(posterUrls)
  const thumbnailUrl = await uploadThumbnailToCloudinary(thumbnailBuffer, id)

  await prisma.watchlist.update({ where: { id }, data: { thumbnailUrl } })

  return c.json({ thumbnailUrl })
}

export const saveWatchlist = async (c: C) => {
  const userId = c.get('user')!.sub
  const id = c.req.param('id')

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  const watchlist = await prisma.watchlist.findUnique({ where: { id } })

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  if (!watchlist.isPublic) {
    return c.json({ error: 'Can only save public watchlists' }, 403)
  }

  if (watchlist.ownerId === userId) {
    return c.json({ error: 'Cannot save your own watchlist' }, 400)
  }

  const existingSave = await prisma.savedWatchlist.findUnique({
    where: { userId_watchlistId: { userId, watchlistId: id } },
  })

  if (existingSave) {
    return c.json({ error: 'Watchlist already saved' }, 400)
  }

  await prisma.savedWatchlist.create({
    data: { userId, watchlistId: id },
  })

  // Add to likedBy — use watchlistId_userId (matches @@id order in schema)
  const existingLike = await prisma.watchlistLike.findUnique({
    where: { watchlistId_userId: { watchlistId: id, userId } },
  })

  if (!existingLike) {
    await prisma.watchlistLike.create({
      data: { userId, watchlistId: id },
    })
  }

  await prisma.$executeRaw`UPDATE user_watchlist_positions SET position = position + 1 WHERE user_id = ${userId}::uuid`

  await prisma.userWatchlistPosition.create({
    data: { userId, watchlistId: id, position: 0 },
  })

  return c.json({ message: 'Watchlist saved successfully' })
}

export const unsaveWatchlist = async (c: C) => {
  const userId = c.get('user')!.sub
  const id = c.req.param('id')

  const deleted = await prisma.savedWatchlist.deleteMany({
    where: { userId, watchlistId: id },
  })

  if (deleted.count === 0) {
    return c.json({ error: 'Watchlist not in saved list' }, 404)
  }

  await prisma.watchlistLike.deleteMany({ where: { userId, watchlistId: id } })

  const positionRecord = await prisma.userWatchlistPosition.findUnique({
    where: { userId_watchlistId: { userId, watchlistId: id } },
  })

  if (positionRecord) {
    await prisma.userWatchlistPosition.delete({
      where: { userId_watchlistId: { userId, watchlistId: id } },
    })
    await prisma.$executeRaw`UPDATE user_watchlist_positions SET position = position - 1 WHERE user_id = ${userId}::uuid AND position > ${positionRecord.position}`
  }

  return c.json({ message: 'Watchlist removed from library' })
}

export const duplicateWatchlist = async (c: C) => {
  const userId = c.get('user')!.sub
  const id = c.req.param('id')

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  const originalWatchlist = await prisma.watchlist.findUnique({
    where: { id },
    include: {
      collaborators: true,
      items: { orderBy: { position: 'asc' } },
    },
  })

  if (!originalWatchlist) {
    return c.json({ error: 'Watchlist not found' }, 404)
  }

  const isOwner = originalWatchlist.ownerId === userId
  const isCollaborator = originalWatchlist.collaborators.some((c) => c.userId === userId)

  if (!originalWatchlist.isPublic && !isOwner && !isCollaborator) {
    return c.json({ error: 'Access denied' }, 403)
  }

  if (isOwner) {
    return c.json({ error: 'Cannot duplicate your own watchlist' }, 400)
  }

  const duplicatedWatchlist = await prisma.watchlist.create({
    data: {
      ownerId: userId,
      name: `${originalWatchlist.name} (copy)`,
      description: originalWatchlist.description,
      isPublic: false,
      genres: originalWatchlist.genres,
      thumbnailUrl: originalWatchlist.thumbnailUrl,
      position: 0,
    },
  })

  await prisma.$executeRaw`UPDATE user_watchlist_positions SET position = position + 1 WHERE user_id = ${userId}::uuid`

  await prisma.userWatchlistPosition.create({
    data: { userId, watchlistId: duplicatedWatchlist.id, position: 0 },
  })

  for (let i = 0; i < originalWatchlist.items.length; i++) {
    const item = originalWatchlist.items[i]
    await prisma.watchlistItem.create({
      data: {
        watchlistId: duplicatedWatchlist.id,
        tmdbId: item.tmdbId,
        mediaType: item.mediaType,
        title: item.title,
        posterPath: item.posterPath,
        platformList: item.platformList as InputJsonValue,
        runtime: item.runtime,
        numberOfSeasons: item.numberOfSeasons,
        numberOfEpisodes: item.numberOfEpisodes,
        position: i,
      },
    })
  }

  const fullDuplicated = await prisma.watchlist.findUnique({
    where: { id: duplicatedWatchlist.id },
    include: { items: { orderBy: { position: 'asc' } } },
  })

  const posterUrls = fullDuplicated!.items
    .slice(0, 4)
    .map((item) => getTMDBImageUrl(item.posterPath))
    .filter((url): url is string => url !== null)

  if (posterUrls.length > 0) {
    regenerateThumbnail(duplicatedWatchlist.id, posterUrls)
      .then(async (thumbnailUrl) => {
        if (thumbnailUrl) {
          await prisma.watchlist.update({
            where: { id: duplicatedWatchlist.id },
            data: { thumbnailUrl },
          })
        }
      })
      .catch((err: Error) => console.error('Failed to regenerate thumbnail:', err))
  }

  return c.json({ watchlist: fullDuplicated }, 201)
}
