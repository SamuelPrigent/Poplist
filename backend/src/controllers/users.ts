import type { Context } from 'hono';
import type { z } from 'zod';
import { and, asc, eq, getTableColumns } from 'drizzle-orm';
import type { UsersAPI } from '@poplist/shared';
import { db } from '../db/index.js';
import { userWatchlistPositions, users, watchlists } from '../db/schema.js';
import { cloudinary, deleteFromCloudinary } from '../services/cloudinary.js';
import { uploadAvatarSchema } from '../validators/users.js';
import { formatWatchlistWithRelations, loadWatchlistRelations } from './watchlists.js';
import type { AppEnv } from '../app.js';

type C = Context<AppEnv>;

export type UploadAvatarInput = z.infer<typeof uploadAvatarSchema>;

export const getProfile = async (c: C) => {
  const user = c.get('user')!;

  const [fullUser] = await db.select().from(users).where(eq(users.id, user.sub)).limit(1);
  if (!fullUser) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({
    user: {
      id: fullUser.id,
      email: fullUser.email,
      username: fullUser.username,
      avatarUrl: fullUser.avatarUrl,
      language: fullUser.language,
      createdAt: fullUser.createdAt?.toISOString() ?? null,
    },
  } satisfies UsersAPI.GetProfileResponse);
};

export const getUserProfileByUsername = async (c: C) => {
  const username = c.req.param('username') as string;

  const [foundUser] = await db
    .select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (!foundUser) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Tri : ordre choisi par le owner dans sa library (user_watchlist_positions),
  // fallback sur createdAt pour les listes sans ligne (ordre déterministe).
  const baseWatchlists = await db
    .select(getTableColumns(watchlists))
    .from(watchlists)
    .leftJoin(
      userWatchlistPositions,
      and(
        eq(userWatchlistPositions.watchlistId, watchlists.id),
        eq(userWatchlistPositions.userId, foundUser.id)
      )
    )
    .where(and(eq(watchlists.ownerId, foundUser.id), eq(watchlists.isPublic, true)))
    .orderBy(asc(userWatchlistPositions.position), asc(watchlists.createdAt));

  const enriched = await loadWatchlistRelations(baseWatchlists);

  const formattedWatchlists = enriched.map(w => formatWatchlistWithRelations(w));

  return c.json({
    user: {
      id: foundUser.id,
      username: foundUser.username,
      avatarUrl: foundUser.avatarUrl,
    },
    watchlists: formattedWatchlists,
    totalPublicWatchlists: formattedWatchlists.length,
  } satisfies UsersAPI.GetUserProfileByUsernameResponse);
};

export const uploadAvatar = async (c: C, data: UploadAvatarInput) => {
  const user = c.get('user')!;

  const [fullUser] = await db
    .select({ avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, user.sub))
    .limit(1);
  if (!fullUser) {
    return c.json({ error: 'User not found' }, 404);
  }

  try {
    if (fullUser.avatarUrl) {
      await deleteFromCloudinary(fullUser.avatarUrl);
    }

    const result = await cloudinary.uploader.upload(data.imageData, {
      folder: 'avatars',
      width: 200,
      height: 200,
      crop: 'fill',
      gravity: 'face',
      resource_type: 'image',
    });

    const [updated] = await db
      .update(users)
      .set({ avatarUrl: result.secure_url })
      .where(eq(users.id, user.sub))
      .returning();

    return c.json({
      user: {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        avatarUrl: updated.avatarUrl,
        language: updated.language,
      },
      avatarUrl: result.secure_url,
    } satisfies UsersAPI.UploadAvatarResponse);
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return c.json({ error: 'Failed to upload avatar to Cloudinary' }, 500);
  }
};

export const deleteAvatar = async (c: C) => {
  const user = c.get('user')!;

  const [fullUser] = await db
    .select({ avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, user.sub))
    .limit(1);
  if (!fullUser) {
    return c.json({ error: 'User not found' }, 404);
  }

  if (!fullUser.avatarUrl) {
    return c.json({ error: 'No avatar to delete' }, 404);
  }

  await deleteFromCloudinary(fullUser.avatarUrl);

  const [updated] = await db
    .update(users)
    .set({ avatarUrl: null })
    .where(eq(users.id, user.sub))
    .returning();

  return c.json({
    message: 'Avatar deleted successfully',
    user: {
      id: updated.id,
      email: updated.email,
      username: updated.username,
      avatarUrl: updated.avatarUrl,
      language: updated.language,
    },
  } satisfies UsersAPI.DeleteAvatarResponse);
};
