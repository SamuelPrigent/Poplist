import type { Context } from 'hono'
import prisma from '../lib/prisma.js'
import { cloudinary, deleteFromCloudinary } from '../services/cloudinary.js'
import type { AppEnv } from '../app.js'

type C = Context<AppEnv>

export const getProfile = async (c: C) => {
  const user = c.get('user')!

  const fullUser = await prisma.user.findUnique({ where: { id: user.sub } })
  if (!fullUser) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({
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

export const getUserProfileByUsername = async (c: C) => {
  const username = c.req.param('username')

  const foundUser = await prisma.user.findUnique({ where: { username } })
  if (!foundUser) {
    return c.json({ error: 'User not found' }, 404)
  }

  const publicWatchlists = await prisma.watchlist.findMany({
    where: { ownerId: foundUser.id, isPublic: true },
    include: {
      owner: { select: { id: true, username: true, avatarUrl: true } },
      collaborators: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
      items: { orderBy: { position: 'asc' } },
    },
    orderBy: { position: 'asc' },
  })

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
      ? { id: watchlist.owner.id, username: watchlist.owner.username, avatarUrl: watchlist.owner.avatarUrl }
      : null,
    collaborators: watchlist.collaborators.map((c) => ({
      id: c.user.id,
      username: c.user.username,
      avatarUrl: c.user.avatarUrl,
    })),
    items: watchlist.items,
  }))

  return c.json({
    user: {
      id: foundUser.id,
      username: foundUser.username,
      avatarUrl: foundUser.avatarUrl,
    },
    watchlists: formattedWatchlists,
    totalPublicWatchlists: formattedWatchlists.length,
  })
}

export const uploadAvatar = async (c: C) => {
  const user = c.get('user')!

  const fullUser = await prisma.user.findUnique({ where: { id: user.sub } })
  if (!fullUser) {
    return c.json({ error: 'User not found' }, 404)
  }

  const body = await c.req.json()
  if (!body.imageData) {
    return c.json({ error: 'No image data provided' }, 400)
  }

  if (!body.imageData.startsWith('data:image/')) {
    return c.json({ error: 'Invalid image format. Must be a base64 data URL.' }, 400)
  }

  try {
    if (fullUser.avatarUrl) {
      await deleteFromCloudinary(fullUser.avatarUrl)
    }

    const result = await cloudinary.uploader.upload(body.imageData, {
      folder: 'avatars',
      width: 200,
      height: 200,
      crop: 'fill',
      gravity: 'face',
      resource_type: 'image',
    })

    const updated = await prisma.user.update({
      where: { id: user.sub },
      data: { avatarUrl: result.secure_url },
    })

    return c.json({
      user: {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        avatarUrl: updated.avatarUrl,
        language: updated.language,
        roles: updated.roles,
      },
      avatarUrl: result.secure_url,
    })
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return c.json({ error: 'Failed to upload avatar to Cloudinary' }, 500)
  }
}

export const deleteAvatar = async (c: C) => {
  const user = c.get('user')!

  const fullUser = await prisma.user.findUnique({ where: { id: user.sub } })
  if (!fullUser) {
    return c.json({ error: 'User not found' }, 404)
  }

  if (!fullUser.avatarUrl) {
    return c.json({ error: 'No avatar to delete' }, 404)
  }

  await deleteFromCloudinary(fullUser.avatarUrl)

  const updated = await prisma.user.update({
    where: { id: user.sub },
    data: { avatarUrl: null },
  })

  return c.json({
    message: 'Avatar deleted successfully',
    user: {
      id: updated.id,
      email: updated.email,
      username: updated.username,
      avatarUrl: updated.avatarUrl,
      language: updated.language,
      roles: updated.roles,
    },
  })
}
