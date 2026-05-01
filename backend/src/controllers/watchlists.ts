import type { Context } from 'hono';
import { and, asc, desc, eq, gt, inArray, lt, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  savedWatchlists,
  userWatchlistPositions,
  users,
  watchlistCollaborators,
  watchlistItems,
  watchlistLikes,
  watchlists,
} from '../db/schema.js';
import { cloudinary, deleteFromCloudinary } from '../services/cloudinary.js';
import {
  deleteThumbnailFromCloudinary,
  generateThumbnail,
  regenerateThumbnail,
  uploadThumbnailToCloudinary,
} from '../services/thumbnail.js';
import { enrichMediaData, getFullMediaDetails, searchMedia } from '../services/tmdb.js';
import {
  extractDominantColorFromBase64,
  extractDominantColorFromUrl,
  FALLBACK_COLOR,
} from '../services/dominant-color.js';
import { saveToCache } from '../services/cache.js';
import type { z } from 'zod';
import {
  createWatchlistSchema,
  updateWatchlistSchema,
  addCollaboratorSchema,
  addItemSchema,
  moveItemSchema,
  reorderItemsSchema,
  reorderWatchlistsSchema,
  uploadCoverSchema,
} from '../validators/watchlists.js';
import type { AppEnv } from '../app.js';
import type { Platform } from '../types/index.js';

type C = Context<AppEnv>;

export type CreateWatchlistInput = z.infer<typeof createWatchlistSchema>;
export type UpdateWatchlistInput = z.infer<typeof updateWatchlistSchema>;
export type AddCollaboratorInput = z.infer<typeof addCollaboratorSchema>;
export type AddItemInput = z.infer<typeof addItemSchema>;
export type MoveItemInput = z.infer<typeof moveItemSchema>;
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>;
export type ReorderWatchlistsInput = z.infer<typeof reorderWatchlistsSchema>;
export type UploadCoverInput = z.infer<typeof uploadCoverSchema>;

// ========================================
// Helpers
// ========================================

function param(c: C, name: string): string {
  return c.req.param(name) as string;
}

function isValidWatchlistId(id: string): boolean {
  if (id.startsWith('offline-')) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

function getTMDBImageUrl(path: string | null | undefined, size: string = 'w342'): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

type DBUser = typeof users.$inferSelect;
type DBWatchlist = typeof watchlists.$inferSelect;
type DBWatchlistItem = typeof watchlistItems.$inferSelect;

type FormattedUser = Pick<DBUser, 'id' | 'email' | 'username' | 'avatarUrl'>;

type FormattedWatchlist = {
  id: DBWatchlist['id'];
  ownerId: DBWatchlist['ownerId'];
  name: DBWatchlist['name'];
  description: DBWatchlist['description'];
  imageUrl: DBWatchlist['imageUrl'];
  thumbnailUrl: DBWatchlist['thumbnailUrl'];
  dominantColor: DBWatchlist['dominantColor'];
  isPublic: DBWatchlist['isPublic'];
  genres: DBWatchlist['genres'];
  position: DBWatchlist['position'];
  createdAt: DBWatchlist['createdAt'];
  updatedAt: DBWatchlist['updatedAt'];
  owner?: FormattedUser;
  collaborators: FormattedUser[];
  items: DBWatchlistItem[];
  likedBy?: FormattedUser[];
};

type WatchlistWithRelations = DBWatchlist & {
  owner?: FormattedUser | null;
  collaborators?: Array<{ user: FormattedUser }>;
  items?: DBWatchlistItem[];
  likedBy?: Array<{ user: FormattedUser }>;
};

export function formatWatchlistWithRelations(watchlist: WatchlistWithRelations): FormattedWatchlist {
  return {
    id: watchlist.id,
    ownerId: watchlist.ownerId,
    name: watchlist.name,
    description: watchlist.description,
    imageUrl: watchlist.imageUrl,
    thumbnailUrl: watchlist.thumbnailUrl,
    dominantColor: watchlist.dominantColor,
    isPublic: watchlist.isPublic,
    genres: watchlist.genres,
    position: watchlist.position,
    createdAt: watchlist.createdAt,
    updatedAt: watchlist.updatedAt,
    owner: watchlist.owner
      ? {
          id: watchlist.owner.id,
          email: watchlist.owner.email,
          username: watchlist.owner.username,
          avatarUrl: watchlist.owner.avatarUrl,
        }
      : undefined,
    collaborators: (watchlist.collaborators ?? []).map(c => ({
      id: c.user.id,
      email: c.user.email,
      username: c.user.username,
      avatarUrl: c.user.avatarUrl,
    })),
    items: watchlist.items ?? [],
    likedBy: watchlist.likedBy?.map(l => ({
      id: l.user.id,
      email: l.user.email,
      username: l.user.username,
      avatarUrl: l.user.avatarUrl,
    })),
  };
}

// ========================================
// Helper bulk-fetch des relations (Core API, joins explicites)
// ========================================

const userColumnsSelect = {
  id: users.id,
  email: users.email,
  username: users.username,
  avatarUrl: users.avatarUrl,
};

/**
 * Charge les relations d'une liste de watchlists en bulk (évite N+1).
 * Fait plusieurs queries SELECT explicites avec INNER JOIN pour collab/likes,
 * puis aggrège côté JS dans le shape attendu par formatWatchlistWithRelations.
 */
export async function loadWatchlistRelations(
  base: DBWatchlist[],
  options: { withLikedBy?: boolean } = {}
): Promise<WatchlistWithRelations[]> {
  if (base.length === 0) return [];

  const watchlistIds = base.map(w => w.id);
  const ownerIds = [...new Set(base.map(w => w.ownerId).filter((id): id is string => id !== null))];

  // 1. Owners
  const owners =
    ownerIds.length > 0
      ? await db.select(userColumnsSelect).from(users).where(inArray(users.id, ownerIds))
      : [];
  const ownerMap = new Map(owners.map(u => [u.id, u]));

  // 2. Items
  const itemRows = await db
    .select()
    .from(watchlistItems)
    .where(inArray(watchlistItems.watchlistId, watchlistIds))
    .orderBy(asc(watchlistItems.position));
  const itemsByWatchlist = new Map<string, DBWatchlistItem[]>();
  itemRows.forEach(i => {
    if (i.watchlistId === null) return;
    if (!itemsByWatchlist.has(i.watchlistId)) itemsByWatchlist.set(i.watchlistId, []);
    itemsByWatchlist.get(i.watchlistId)!.push(i);
  });

  // 3. Collaborators (INNER JOIN avec users)
  const collabRows = await db
    .select({
      watchlistId: watchlistCollaborators.watchlistId,
      id: users.id,
      email: users.email,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(watchlistCollaborators)
    .innerJoin(users, eq(watchlistCollaborators.userId, users.id))
    .where(inArray(watchlistCollaborators.watchlistId, watchlistIds));
  const collabsByWatchlist = new Map<string, FormattedUser[]>();
  collabRows.forEach(r => {
    if (!collabsByWatchlist.has(r.watchlistId)) collabsByWatchlist.set(r.watchlistId, []);
    collabsByWatchlist.get(r.watchlistId)!.push({
      id: r.id,
      email: r.email,
      username: r.username,
      avatarUrl: r.avatarUrl,
    });
  });

  // 4. LikedBy (optional, INNER JOIN avec users)
  const likesByWatchlist = new Map<string, FormattedUser[]>();
  if (options.withLikedBy) {
    const likeRows = await db
      .select({
        watchlistId: watchlistLikes.watchlistId,
        id: users.id,
        email: users.email,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(watchlistLikes)
      .innerJoin(users, eq(watchlistLikes.userId, users.id))
      .where(inArray(watchlistLikes.watchlistId, watchlistIds));
    likeRows.forEach(r => {
      if (!likesByWatchlist.has(r.watchlistId)) likesByWatchlist.set(r.watchlistId, []);
      likesByWatchlist.get(r.watchlistId)!.push({
        id: r.id,
        email: r.email,
        username: r.username,
        avatarUrl: r.avatarUrl,
      });
    });
  }

  return base.map(w => {
    const result: WatchlistWithRelations = {
      ...w,
      owner: w.ownerId ? ownerMap.get(w.ownerId) ?? null : null,
      items: itemsByWatchlist.get(w.id) ?? [],
      collaborators: (collabsByWatchlist.get(w.id) ?? []).map(user => ({ user })),
    };
    if (options.withLikedBy) {
      result.likedBy = (likesByWatchlist.get(w.id) ?? []).map(user => ({ user }));
    }
    return result;
  });
}

/** Charge UNE watchlist + ses relations (raccourci pour le helper plural). */
async function loadOneWatchlistRelations(
  watchlistId: string,
  options: { withLikedBy?: boolean } = {}
): Promise<WatchlistWithRelations | null> {
  const [base] = await db.select().from(watchlists).where(eq(watchlists.id, watchlistId)).limit(1);
  if (!base) return null;
  const [enriched] = await loadWatchlistRelations([base], options);
  return enriched;
}

// ========================================
// Public
// ========================================

export const getPublicFeatured = async (c: C) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '6', 10), 1000);
  const userId = c.get('user')?.sub;

  const baseWatchlists = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.isPublic, true))
    .orderBy(desc(watchlists.createdAt))
    .limit(limit);

  const enriched = await loadWatchlistRelations(baseWatchlists, { withLikedBy: true });

  const sortedWatchlists = enriched
    .map(w => ({
      ...formatWatchlistWithRelations(w),
      followersCount: w.likedBy?.length || 0,
    }))
    .sort((a, b) => b.followersCount - a.followersCount);

  if (userId) {
    const savedRows = await db
      .select({ watchlistId: savedWatchlists.watchlistId })
      .from(savedWatchlists)
      .where(eq(savedWatchlists.userId, userId));
    const savedIdsSet = new Set(savedRows.map(r => r.watchlistId));

    const watchlistsWithFlags = sortedWatchlists.map(w => ({
      ...w,
      isOwner: w.ownerId === userId,
      isCollaborator: w.collaborators?.some(col => col.id === userId) || false,
      isSaved: savedIdsSet.has(w.id),
    }));

    return c.json({ watchlists: watchlistsWithFlags });
  }

  return c.json({ watchlists: sortedWatchlists });
};

export const getPublicWatchlist = async (c: C) => {
  const id = param(c, 'id');

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  const watchlist = await loadOneWatchlistRelations(id, { withLikedBy: true });

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  if (!watchlist.isPublic) {
    return c.json({ error: 'This watchlist is private' }, 403);
  }

  return c.json({ watchlist: formatWatchlistWithRelations(watchlist) });
};

export const getWatchlistsByGenre = async (c: C) => {
  const genre = param(c, 'genre');

  if (!genre || genre.trim().length === 0) {
    return c.json({ error: 'Genre parameter is required' }, 400);
  }

  const baseWatchlists = await db
    .select()
    .from(watchlists)
    .where(and(eq(watchlists.isPublic, true), sql`${genre} = ANY(${watchlists.genres})`))
    .orderBy(desc(watchlists.createdAt));

  const enriched = await loadWatchlistRelations(baseWatchlists, { withLikedBy: true });

  return c.json({ watchlists: enriched.map(formatWatchlistWithRelations) });
};

export const getWatchlistCountByGenre = async (c: C) => {
  const genre = param(c, 'genre');

  if (!genre || genre.trim().length === 0) {
    return c.json({ error: 'Genre parameter is required' }, 400);
  }

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(watchlists)
    .where(and(eq(watchlists.isPublic, true), sql`${genre} = ANY(${watchlists.genres})`));

  return c.json({ genre, count: result[0]?.count ?? 0 });
};

export const searchTMDB = async (c: C) => {
  const query = c.req.query('query');
  const language = c.req.query('language') || 'fr-FR';
  const page = parseInt(c.req.query('page') || '1', 10);

  if (!query || query.trim().length === 0) {
    return c.json({ error: 'Query parameter is required' }, 400);
  }

  const results = await searchMedia(query, language, page);

  const cacheKey = `tmdb:search:${query}:${language}:${page}`;
  await saveToCache(cacheKey, results, 1);

  return c.json(results);
};

export const getItemDetails = async (c: C) => {
  const tmdbId = param(c, 'tmdbId');
  const type = param(c, 'type');
  const language = c.req.query('language') || 'fr-FR';

  if (!tmdbId || !type) {
    return c.json({ error: 'tmdbId and type are required' }, 400);
  }

  if (type !== 'movie' && type !== 'tv') {
    return c.json({ error: 'type must be either "movie" or "tv"' }, 400);
  }

  const details = await getFullMediaDetails(tmdbId, type, language);

  if (!details) {
    return c.json({ error: 'Media details not found' }, 404);
  }

  const responseData = { details };

  const cacheKey = `tmdb:details:${type}:${tmdbId}:${language}`;
  await saveToCache(cacheKey, responseData, 7);

  return c.json(responseData);
};

// ========================================
// Protected
// ========================================

export const getMyWatchlists = async (c: C) => {
  const userId = c.get('user')!.sub;

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const userPositions = await db
    .select({
      watchlistId: userWatchlistPositions.watchlistId,
      position: userWatchlistPositions.position,
    })
    .from(userWatchlistPositions)
    .where(eq(userWatchlistPositions.userId, userId))
    .orderBy(asc(userWatchlistPositions.position));
  const positionMap = new Map(userPositions.map(r => [r.watchlistId, r.position]));

  const ownedBase = await db.select().from(watchlists).where(eq(watchlists.ownerId, userId));

  const collabRecords = await db
    .select({ watchlistId: watchlistCollaborators.watchlistId })
    .from(watchlistCollaborators)
    .where(eq(watchlistCollaborators.userId, userId));
  const collabIds = collabRecords.map(r => r.watchlistId);

  const collaborativeBase =
    collabIds.length > 0
      ? await db.select().from(watchlists).where(inArray(watchlists.id, collabIds))
      : [];

  const savedRecords = await db
    .select({ watchlistId: savedWatchlists.watchlistId })
    .from(savedWatchlists)
    .where(eq(savedWatchlists.userId, userId));
  const savedIds = savedRecords.map(r => r.watchlistId);

  const savedBase =
    savedIds.length > 0
      ? await db.select().from(watchlists).where(inArray(watchlists.id, savedIds))
      : [];

  // Bulk-fetch des relations en une seule passe (déduplication par id)
  const allBaseMap = new Map<string, DBWatchlist>();
  ownedBase.forEach(w => allBaseMap.set(w.id, w));
  collaborativeBase.forEach(w => allBaseMap.set(w.id, w));
  savedBase.forEach(w => allBaseMap.set(w.id, w));
  const allEnriched = await loadWatchlistRelations(Array.from(allBaseMap.values()));
  const enrichedMap = new Map(allEnriched.map(w => [w.id, w]));

  type MyWatchlist = FormattedWatchlist & {
    isOwner: boolean;
    isCollaborator: boolean;
    isSaved: boolean;
    libraryPosition: number;
  };
  const watchlistsMap = new Map<string, MyWatchlist>();
  const savedIdsSet = new Set(savedIds);
  const collabIdsSet = new Set(collabIds);

  ownedBase.forEach(w => {
    const enriched = enrichedMap.get(w.id);
    if (!enriched) return;
    watchlistsMap.set(w.id, {
      ...formatWatchlistWithRelations(enriched),
      isOwner: true,
      isCollaborator: false,
      isSaved: savedIdsSet.has(w.id),
      libraryPosition: positionMap.get(w.id) ?? 9999,
    });
  });

  collaborativeBase.forEach(w => {
    if (watchlistsMap.has(w.id)) return;
    const enriched = enrichedMap.get(w.id);
    if (!enriched) return;
    watchlistsMap.set(w.id, {
      ...formatWatchlistWithRelations(enriched),
      isOwner: false,
      isCollaborator: true,
      isSaved: savedIdsSet.has(w.id),
      libraryPosition: positionMap.get(w.id) ?? 9999,
    });
  });

  savedBase.forEach(w => {
    if (watchlistsMap.has(w.id)) return;
    const enriched = enrichedMap.get(w.id);
    if (!enriched) return;
    watchlistsMap.set(w.id, {
      ...formatWatchlistWithRelations(enriched),
      isOwner: false,
      isCollaborator: collabIdsSet.has(w.id),
      isSaved: true,
      libraryPosition: positionMap.get(w.id) ?? 9999,
    });
  });

  const result = Array.from(watchlistsMap.values()).sort(
    (a, b) => (a.libraryPosition ?? 9999) - (b.libraryPosition ?? 9999)
  );

  return c.json({ watchlists: result });
};

export const createWatchlist = async (c: C, data: CreateWatchlistInput) => {
  const userId = c.get('user')!.sub;

  if (data.fromLocalStorage) {
    const [existing] = await db
      .select({ id: watchlists.id })
      .from(watchlists)
      .where(and(eq(watchlists.ownerId, userId), eq(watchlists.name, data.name)))
      .limit(1);
    if (existing) {
      data.name = `${data.name} (local)`;
    }
  }

  const [watchlist] = await db
    .insert(watchlists)
    .values({
      ownerId: userId,
      name: data.name,
      description: data.description,
      isPublic: data.isPublic || false,
      genres: data.genres || [],
      position: 0,
    })
    .returning();

  await db
    .update(userWatchlistPositions)
    .set({ position: sql`${userWatchlistPositions.position} + 1` })
    .where(eq(userWatchlistPositions.userId, userId));

  await db
    .insert(userWatchlistPositions)
    .values({ userId, watchlistId: watchlist.id, position: 0 });

  if (data.items && data.items.length > 0) {
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      await db.insert(watchlistItems).values({
        watchlistId: watchlist.id,
        tmdbId: item.tmdbId,
        mediaType: item.mediaType,
        title: item.title,
        posterPath: item.posterPath,
        platformList: (item.platformList || []).map(p => ({
          name: p.name || '',
          logoPath: p.logoPath || '',
        })),
        runtime: item.runtime,
        numberOfSeasons: item.numberOfSeasons,
        numberOfEpisodes: item.numberOfEpisodes,
        position: i,
      });
    }

    const posterUrls = data.items
      .slice(0, 4)
      .map(item => getTMDBImageUrl(item.posterPath))
      .filter((url): url is string => url !== null);

    if (posterUrls.length > 0) {
      regenerateThumbnail(watchlist.id, posterUrls)
        .then(async thumbnailUrl => {
          if (thumbnailUrl) {
            await db
              .update(watchlists)
              .set({ thumbnailUrl })
              .where(eq(watchlists.id, watchlist.id));
          }
        })
        .catch((err: Error) => console.error('Failed to regenerate thumbnail:', err));
    }
  }

  const fullWatchlist = await loadOneWatchlistRelations(watchlist.id, { withLikedBy: true });

  if (!fullWatchlist) {
    return c.json({ error: 'Watchlist creation failed' }, 500);
  }

  return c.json({ watchlist: formatWatchlistWithRelations(fullWatchlist) }, 201);
};

export const reorderWatchlists = async (c: C, data: ReorderWatchlistsInput) => {
  const userId = c.get('user')!.sub;

  for (let i = 0; i < data.orderedWatchlistIds.length; i++) {
    await db
      .update(userWatchlistPositions)
      .set({ position: i })
      .where(
        and(
          eq(userWatchlistPositions.userId, userId),
          eq(userWatchlistPositions.watchlistId, data.orderedWatchlistIds[i])
        )
      );
  }

  return c.json({ message: 'Watchlists reordered successfully' });
};

export const getWatchlistById = async (c: C) => {
  const userId = c.get('user')!.sub;
  const id = param(c, 'id');

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  const watchlist = await loadOneWatchlistRelations(id, { withLikedBy: true });

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  const isOwner = watchlist.ownerId === userId;
  const isCollaborator = watchlist.collaborators?.some(c => c.user.id === userId) ?? false;
  const isPublic = watchlist.isPublic;

  if (!isOwner && !isCollaborator && !isPublic) {
    return c.json({ error: 'Access denied' }, 403);
  }

  const [savedCheck] = await db
    .select({ userId: savedWatchlists.userId })
    .from(savedWatchlists)
    .where(and(eq(savedWatchlists.userId, userId), eq(savedWatchlists.watchlistId, id)))
    .limit(1);
  const isSaved = !!savedCheck;

  return c.json({
    watchlist: formatWatchlistWithRelations(watchlist),
    isSaved,
    isOwner,
    isCollaborator,
  });
};

export const updateWatchlist = async (c: C, data: UpdateWatchlistInput) => {
  const userId = c.get('user')!.sub;
  const id = param(c, 'id');

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  const [watchlist] = await db.select().from(watchlists).where(eq(watchlists.id, id)).limit(1);

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  const collaboratorRows = await db
    .select({ userId: watchlistCollaborators.userId })
    .from(watchlistCollaborators)
    .where(eq(watchlistCollaborators.watchlistId, id));

  const isOwner = watchlist.ownerId === userId;
  const isCollaborator = collaboratorRows.some(c => c.userId === userId);

  if (!isOwner && !isCollaborator) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const updateData: Partial<typeof watchlists.$inferInsert> = {};
  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
  if (data.genres !== undefined) updateData.genres = data.genres;

  if (data.items) {
    await db.delete(watchlistItems).where(eq(watchlistItems.watchlistId, id));

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const cleanedPlatformList = (item.platformList || [])
        .filter((p): p is Platform => p !== null && p !== undefined)
        .map((p): Platform | null => {
          if (typeof p === 'string') {
            return (p as string).trim() ? { name: p, logoPath: '' } : null;
          }
          if (
            p &&
            typeof p === 'object' &&
            'name' in p &&
            typeof p.name === 'string' &&
            p.name.trim()
          ) {
            return { name: p.name, logoPath: typeof p.logoPath === 'string' ? p.logoPath : '' };
          }
          return null;
        })
        .filter((p): p is Platform => p !== null);

      const platformListValue: Platform[] =
        cleanedPlatformList.length > 0 ? cleanedPlatformList : [{ name: 'Inconnu', logoPath: '' }];

      await db.insert(watchlistItems).values({
        watchlistId: id,
        tmdbId: item.tmdbId,
        mediaType: item.mediaType,
        title: item.title,
        posterPath: item.posterPath,
        platformList: platformListValue,
        runtime: item.runtime,
        numberOfSeasons: item.numberOfSeasons,
        numberOfEpisodes: item.numberOfEpisodes,
        position: i,
        addedAt: item.addedAt ? new Date(item.addedAt) : new Date(),
      });
    }
  }

  if (Object.keys(updateData).length > 0) {
    await db.update(watchlists).set(updateData).where(eq(watchlists.id, id));
  }

  const [updated] = await db.select().from(watchlists).where(eq(watchlists.id, id)).limit(1);
  const items = await db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.watchlistId, id))
    .orderBy(asc(watchlistItems.position));

  return c.json({ watchlist: { ...updated, items } });
};

export const deleteWatchlist = async (c: C) => {
  const userId = c.get('user')!.sub;
  const id = param(c, 'id');

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  const [watchlist] = await db.select().from(watchlists).where(eq(watchlists.id, id)).limit(1);

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  if (watchlist.ownerId !== userId) {
    return c.json({ error: 'Only owner can delete watchlist' }, 403);
  }

  if (watchlist.imageUrl) {
    await deleteFromCloudinary(watchlist.imageUrl);
  }
  if (watchlist.thumbnailUrl) {
    await deleteThumbnailFromCloudinary(id);
  }

  const positionRecords = await db
    .select({
      userId: userWatchlistPositions.userId,
      position: userWatchlistPositions.position,
    })
    .from(userWatchlistPositions)
    .where(eq(userWatchlistPositions.watchlistId, id));

  await db.delete(watchlistLikes).where(eq(watchlistLikes.watchlistId, id));
  await db.delete(savedWatchlists).where(eq(savedWatchlists.watchlistId, id));
  await db.delete(watchlistCollaborators).where(eq(watchlistCollaborators.watchlistId, id));
  await db.delete(userWatchlistPositions).where(eq(userWatchlistPositions.watchlistId, id));

  for (const record of positionRecords) {
    await db
      .update(userWatchlistPositions)
      .set({ position: sql`${userWatchlistPositions.position} - 1` })
      .where(
        and(
          eq(userWatchlistPositions.userId, record.userId),
          gt(userWatchlistPositions.position, record.position)
        )
      );
  }

  await db.delete(watchlists).where(eq(watchlists.id, id));

  return c.json({ message: 'Watchlist deleted successfully' });
};

export const addCollaborator = async (c: C, data: AddCollaboratorInput) => {
  const userId = c.get('user')!.sub;
  const id = param(c, 'id');

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Invalid watchlist ID' }, 400);
  }

  const [watchlist] = await db.select().from(watchlists).where(eq(watchlists.id, id)).limit(1);

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  if (watchlist.ownerId !== userId) {
    return c.json({ error: 'Only the owner can add collaborators' }, 403);
  }

  const [collaborator] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, data.username))
    .limit(1);
  if (!collaborator) {
    return c.json({ error: 'User not found' }, 404);
  }

  if (collaborator.id === userId) {
    return c.json({ error: 'Cannot add yourself as a collaborator' }, 400);
  }

  const [alreadyCollab] = await db
    .select({ userId: watchlistCollaborators.userId })
    .from(watchlistCollaborators)
    .where(
      and(
        eq(watchlistCollaborators.watchlistId, id),
        eq(watchlistCollaborators.userId, collaborator.id)
      )
    )
    .limit(1);
  if (alreadyCollab) {
    return c.json({ error: 'User is already a collaborator' }, 400);
  }

  await db
    .delete(watchlistLikes)
    .where(and(eq(watchlistLikes.userId, collaborator.id), eq(watchlistLikes.watchlistId, id)));
  await db
    .delete(savedWatchlists)
    .where(and(eq(savedWatchlists.userId, collaborator.id), eq(savedWatchlists.watchlistId, id)));

  const [existingPosition] = await db
    .select({ position: userWatchlistPositions.position })
    .from(userWatchlistPositions)
    .where(
      and(
        eq(userWatchlistPositions.userId, collaborator.id),
        eq(userWatchlistPositions.watchlistId, id)
      )
    )
    .limit(1);

  if (existingPosition) {
    await db
      .delete(userWatchlistPositions)
      .where(
        and(
          eq(userWatchlistPositions.userId, collaborator.id),
          eq(userWatchlistPositions.watchlistId, id)
        )
      );
    await db
      .update(userWatchlistPositions)
      .set({ position: sql`${userWatchlistPositions.position} - 1` })
      .where(
        and(
          eq(userWatchlistPositions.userId, collaborator.id),
          gt(userWatchlistPositions.position, existingPosition.position)
        )
      );
  }

  await db.insert(watchlistCollaborators).values({ watchlistId: id, userId: collaborator.id });

  await db
    .update(userWatchlistPositions)
    .set({ position: sql`${userWatchlistPositions.position} + 1` })
    .where(eq(userWatchlistPositions.userId, collaborator.id));

  await db
    .insert(userWatchlistPositions)
    .values({ userId: collaborator.id, watchlistId: id, position: 0 });

  // Fetch des collaborators à jour avec leurs users (INNER JOIN)
  const collabRows = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      avatarUrl: users.avatarUrl,
    })
    .from(watchlistCollaborators)
    .innerJoin(users, eq(watchlistCollaborators.userId, users.id))
    .where(eq(watchlistCollaborators.watchlistId, id));

  return c.json({
    collaborators: collabRows.map(r => ({
      id: r.id,
      username: r.username,
      email: r.email,
      avatarUrl: r.avatarUrl || null,
    })),
  });
};

export const removeCollaborator = async (c: C) => {
  const userId = c.get('user')!.sub;
  const id = param(c, 'id');
  const collaboratorId = param(c, 'collaboratorId');

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Invalid watchlist ID' }, 400);
  }

  const [watchlist] = await db
    .select({ ownerId: watchlists.ownerId })
    .from(watchlists)
    .where(eq(watchlists.id, id))
    .limit(1);
  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  if (watchlist.ownerId !== userId) {
    return c.json({ error: 'Only the owner can remove collaborators' }, 403);
  }

  const deleted = await db
    .delete(watchlistCollaborators)
    .where(
      and(
        eq(watchlistCollaborators.watchlistId, id),
        eq(watchlistCollaborators.userId, collaboratorId)
      )
    )
    .returning({ userId: watchlistCollaborators.userId });

  if (deleted.length === 0) {
    return c.json({ error: 'Collaborator not found' }, 404);
  }

  const [positionRecord] = await db
    .select({ position: userWatchlistPositions.position })
    .from(userWatchlistPositions)
    .where(
      and(
        eq(userWatchlistPositions.userId, collaboratorId),
        eq(userWatchlistPositions.watchlistId, id)
      )
    )
    .limit(1);

  if (positionRecord) {
    await db
      .delete(userWatchlistPositions)
      .where(
        and(
          eq(userWatchlistPositions.userId, collaboratorId),
          eq(userWatchlistPositions.watchlistId, id)
        )
      );
    await db
      .update(userWatchlistPositions)
      .set({ position: sql`${userWatchlistPositions.position} - 1` })
      .where(
        and(
          eq(userWatchlistPositions.userId, collaboratorId),
          gt(userWatchlistPositions.position, positionRecord.position)
        )
      );
  }

  const collabRows = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      avatarUrl: users.avatarUrl,
    })
    .from(watchlistCollaborators)
    .innerJoin(users, eq(watchlistCollaborators.userId, users.id))
    .where(eq(watchlistCollaborators.watchlistId, id));

  return c.json({
    collaborators: collabRows.map(r => ({
      id: r.id,
      username: r.username,
      email: r.email,
      avatarUrl: r.avatarUrl || null,
    })),
  });
};

export const leaveWatchlist = async (c: C) => {
  const userId = c.get('user')!.sub;
  const id = param(c, 'id');

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Invalid watchlist ID' }, 400);
  }

  const deleted = await db
    .delete(watchlistCollaborators)
    .where(
      and(eq(watchlistCollaborators.watchlistId, id), eq(watchlistCollaborators.userId, userId))
    )
    .returning({ userId: watchlistCollaborators.userId });

  if (deleted.length === 0) {
    return c.json({ error: 'You are not a collaborator of this watchlist' }, 403);
  }

  const [positionRecord] = await db
    .select({ position: userWatchlistPositions.position })
    .from(userWatchlistPositions)
    .where(
      and(
        eq(userWatchlistPositions.userId, userId),
        eq(userWatchlistPositions.watchlistId, id)
      )
    )
    .limit(1);

  if (positionRecord) {
    await db
      .delete(userWatchlistPositions)
      .where(
        and(
          eq(userWatchlistPositions.userId, userId),
          eq(userWatchlistPositions.watchlistId, id)
        )
      );
    await db
      .update(userWatchlistPositions)
      .set({ position: sql`${userWatchlistPositions.position} - 1` })
      .where(
        and(
          eq(userWatchlistPositions.userId, userId),
          gt(userWatchlistPositions.position, positionRecord.position)
        )
      );
  }

  return c.json({ message: 'Left watchlist successfully' });
};

export const addItemToWatchlist = async (c: C, data: AddItemInput) => {
  const userId = c.get('user')!.sub;
  const id = param(c, 'id');

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  const [watchlist] = await db.select().from(watchlists).where(eq(watchlists.id, id)).limit(1);

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  const collaboratorRows = await db
    .select({ userId: watchlistCollaborators.userId })
    .from(watchlistCollaborators)
    .where(eq(watchlistCollaborators.watchlistId, id));

  const items = await db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.watchlistId, id))
    .orderBy(asc(watchlistItems.position));

  const isOwner = watchlist.ownerId === userId;
  const isCollaborator = collaboratorRows.some(c => c.userId === userId);

  if (!isOwner && !isCollaborator) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const tmdbIdNum = parseInt(data.tmdbId, 10);
  const itemExists = items.some(item => item.tmdbId === tmdbIdNum);
  if (itemExists) {
    return c.json({ error: 'Item already exists in watchlist' }, 400);
  }

  const enrichedData = await enrichMediaData(
    data.tmdbId,
    data.mediaType,
    data.language || 'fr-FR',
    data.region || 'FR'
  );

  if (!enrichedData) {
    return c.json({ error: 'Failed to fetch media details from TMDB' }, 500);
  }

  const maxPosItem = items.length > 0 ? Math.max(...items.map(i => i.position ?? 0)) : -1;
  const newPosition = maxPosItem + 1;

  await db.insert(watchlistItems).values({
    watchlistId: id,
    tmdbId: parseInt(enrichedData.tmdbId, 10),
    mediaType: enrichedData.mediaType,
    title: enrichedData.title,
    posterPath: enrichedData.posterPath,
    platformList: enrichedData.platformList,
    runtime: enrichedData.runtime,
    numberOfSeasons: enrichedData.numberOfSeasons,
    numberOfEpisodes: enrichedData.numberOfEpisodes,
    position: newPosition,
  });

  const [updatedWatchlistRow] = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.id, id))
    .limit(1);
  const updatedItems = await db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.watchlistId, id))
    .orderBy(asc(watchlistItems.position));

  const posterUrls = updatedItems
    .slice(0, 4)
    .map(item => getTMDBImageUrl(item.posterPath))
    .filter((url): url is string => url !== null);

  regenerateThumbnail(id, posterUrls)
    .then(async thumbnailUrl => {
      if (thumbnailUrl) {
        await db.update(watchlists).set({ thumbnailUrl }).where(eq(watchlists.id, id));
      }
    })
    .catch((err: Error) => console.error('Failed to regenerate thumbnail:', err));

  // Si c'est le 1er item et pas d'image custom → calculer dominantColor
  if (newPosition === 0 && !watchlist.imageUrl && enrichedData.posterPath) {
    const posterUrl = getTMDBImageUrl(enrichedData.posterPath);
    if (posterUrl) {
      extractDominantColorFromUrl(posterUrl)
        .then(async dominantColor => {
          await db.update(watchlists).set({ dominantColor }).where(eq(watchlists.id, id));
        })
        .catch(err => console.error('Failed to extract dominant color:', err));
    }
  }

  return c.json({ watchlist: { ...updatedWatchlistRow, items: updatedItems } });
};

export const removeItemFromWatchlist = async (c: C) => {
  const userId = c.get('user')!.sub;
  const id = param(c, 'id');
  const tmdbId = param(c, 'tmdbId');

  const [watchlist] = await db.select().from(watchlists).where(eq(watchlists.id, id)).limit(1);

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  const collaboratorRows = await db
    .select({ userId: watchlistCollaborators.userId })
    .from(watchlistCollaborators)
    .where(eq(watchlistCollaborators.watchlistId, id));

  const isOwner = watchlist.ownerId === userId;
  const isCollaborator = collaboratorRows.some(c => c.userId === userId);

  if (!isOwner && !isCollaborator) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const tmdbIdNum = parseInt(tmdbId, 10);
  const deleted = await db
    .delete(watchlistItems)
    .where(and(eq(watchlistItems.watchlistId, id), eq(watchlistItems.tmdbId, tmdbIdNum)))
    .returning({ id: watchlistItems.id });

  if (deleted.length === 0) {
    return c.json({ error: 'Item not found in watchlist' }, 404);
  }

  const [updatedWatchlistRow] = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.id, id))
    .limit(1);
  const updatedItems = await db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.watchlistId, id))
    .orderBy(asc(watchlistItems.position));

  const posterUrls = updatedItems
    .slice(0, 4)
    .map(item => getTMDBImageUrl(item.posterPath))
    .filter((url): url is string => url !== null);

  regenerateThumbnail(id, posterUrls)
    .then(async thumbnailUrl => {
      if (thumbnailUrl) {
        await db.update(watchlists).set({ thumbnailUrl }).where(eq(watchlists.id, id));
      } else if (posterUrls.length === 0) {
        await db.update(watchlists).set({ thumbnailUrl: null }).where(eq(watchlists.id, id));
      }
    })
    .catch((err: Error) => console.error('Failed to regenerate thumbnail:', err));

  // Recalculer dominantColor si pas d'image custom
  if (!watchlist.imageUrl) {
    const firstItem = updatedItems[0];
    if (firstItem?.posterPath) {
      const posterUrl = getTMDBImageUrl(firstItem.posterPath);
      if (posterUrl) {
        extractDominantColorFromUrl(posterUrl)
          .then(async dominantColor => {
            await db.update(watchlists).set({ dominantColor }).where(eq(watchlists.id, id));
          })
          .catch(err => console.error('Failed to extract dominant color:', err));
      }
    } else {
      db.update(watchlists)
        .set({ dominantColor: FALLBACK_COLOR })
        .where(eq(watchlists.id, id))
        .catch((err: Error) => console.error('Failed to reset dominant color:', err));
    }
  }

  return c.json({ watchlist: { ...updatedWatchlistRow, items: updatedItems } });
};

export const moveItemPosition = async (c: C, data: MoveItemInput) => {
  const userId = c.get('user')!.sub;
  const id = param(c, 'id');
  const tmdbId = param(c, 'tmdbId');

  const [watchlist] = await db.select().from(watchlists).where(eq(watchlists.id, id)).limit(1);

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  const collaboratorRows = await db
    .select({ userId: watchlistCollaborators.userId })
    .from(watchlistCollaborators)
    .where(eq(watchlistCollaborators.watchlistId, id));

  const items = await db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.watchlistId, id))
    .orderBy(asc(watchlistItems.position));

  const isOwner = watchlist.ownerId === userId;
  const isCollaborator = collaboratorRows.some(c => c.userId === userId);

  if (!isOwner && !isCollaborator) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const tmdbIdNum = parseInt(tmdbId, 10);
  const item = items.find(i => i.tmdbId === tmdbIdNum);
  if (!item) {
    return c.json({ error: 'Item not found in watchlist' }, 404);
  }

  const itemPosition = item.position ?? 0;

  if (data.position === 'first') {
    await db
      .update(watchlistItems)
      .set({ position: sql`${watchlistItems.position} + 1` })
      .where(
        and(eq(watchlistItems.watchlistId, id), lt(watchlistItems.position, itemPosition))
      );
    await db.update(watchlistItems).set({ position: 0 }).where(eq(watchlistItems.id, item.id));
  } else {
    const maxPos = items.length - 1;
    await db
      .update(watchlistItems)
      .set({ position: sql`${watchlistItems.position} - 1` })
      .where(
        and(eq(watchlistItems.watchlistId, id), gt(watchlistItems.position, itemPosition))
      );
    await db.update(watchlistItems).set({ position: maxPos }).where(eq(watchlistItems.id, item.id));
  }

  const [updatedWatchlistRow] = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.id, id))
    .limit(1);
  const updatedItems = await db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.watchlistId, id))
    .orderBy(asc(watchlistItems.position));

  const posterUrls = updatedItems
    .slice(0, 4)
    .map(item => getTMDBImageUrl(item.posterPath))
    .filter((url): url is string => url !== null);

  if (posterUrls.length > 0) {
    try {
      const thumbnailUrl = await regenerateThumbnail(id, posterUrls);
      if (thumbnailUrl) {
        await db.update(watchlists).set({ thumbnailUrl }).where(eq(watchlists.id, id));
      }
    } catch (err) {
      console.error('Failed to regenerate thumbnail:', err);
    }
  }

  // Recalculer dominantColor si le 1er item a changé et pas d'image custom
  const oldFirstTmdbId = items[0]?.tmdbId;
  const newFirstTmdbId = updatedItems[0]?.tmdbId;

  if (!watchlist.imageUrl && oldFirstTmdbId !== newFirstTmdbId) {
    const firstItem = updatedItems[0];
    if (firstItem?.posterPath) {
      const posterUrl = getTMDBImageUrl(firstItem.posterPath);
      if (posterUrl) {
        extractDominantColorFromUrl(posterUrl)
          .then(async dominantColor => {
            await db.update(watchlists).set({ dominantColor }).where(eq(watchlists.id, id));
          })
          .catch(err => console.error('Failed to extract dominant color:', err));
      }
    }
  }

  return c.json({ watchlist: { ...updatedWatchlistRow, items: updatedItems } });
};

export const reorderItems = async (c: C, data: ReorderItemsInput) => {
  const userId = c.get('user')!.sub;
  const id = param(c, 'id');

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  const [watchlist] = await db.select().from(watchlists).where(eq(watchlists.id, id)).limit(1);

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  const collaboratorRows = await db
    .select({ userId: watchlistCollaborators.userId })
    .from(watchlistCollaborators)
    .where(eq(watchlistCollaborators.watchlistId, id));

  const items = await db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.watchlistId, id))
    .orderBy(asc(watchlistItems.position));

  const isOwner = watchlist.ownerId === userId;
  const isCollaborator = collaboratorRows.some(c => c.userId === userId);

  if (!isOwner && !isCollaborator) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  if (data.orderedTmdbIds.length !== items.length) {
    return c.json({ error: 'Invalid item order: missing or extra items' }, 400);
  }

  for (let i = 0; i < data.orderedTmdbIds.length; i++) {
    const tmdbId = parseInt(data.orderedTmdbIds[i], 10);
    await db
      .update(watchlistItems)
      .set({ position: i })
      .where(and(eq(watchlistItems.watchlistId, id), eq(watchlistItems.tmdbId, tmdbId)));
  }

  const [updatedWatchlistRow] = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.id, id))
    .limit(1);
  const updatedItems = await db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.watchlistId, id))
    .orderBy(asc(watchlistItems.position));

  const posterUrls = updatedItems
    .slice(0, 4)
    .map(item => getTMDBImageUrl(item.posterPath))
    .filter((url): url is string => url !== null);

  if (posterUrls.length > 0) {
    try {
      const thumbnailUrl = await regenerateThumbnail(id, posterUrls);
      if (thumbnailUrl) {
        await db.update(watchlists).set({ thumbnailUrl }).where(eq(watchlists.id, id));
      }
    } catch (err) {
      console.error('Failed to regenerate thumbnail:', err);
    }
  }

  // Recalculer dominantColor si le 1er item a changé et pas d'image custom
  const oldFirstTmdbId = items[0]?.tmdbId;
  const newFirstTmdbId = updatedItems[0]?.tmdbId;

  if (!watchlist.imageUrl && oldFirstTmdbId !== newFirstTmdbId) {
    const firstItem = updatedItems[0];
    if (firstItem?.posterPath) {
      const posterUrl = getTMDBImageUrl(firstItem.posterPath);
      if (posterUrl) {
        extractDominantColorFromUrl(posterUrl)
          .then(async dominantColor => {
            await db.update(watchlists).set({ dominantColor }).where(eq(watchlists.id, id));
          })
          .catch(err => console.error('Failed to extract dominant color:', err));
      }
    }
  }

  return c.json({ watchlist: { ...updatedWatchlistRow, items: updatedItems } });
};

export const uploadCover = async (c: C, data: UploadCoverInput) => {
  const userId = c.get('user')!.sub;
  const id = param(c, 'id');

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  const [watchlist] = await db.select().from(watchlists).where(eq(watchlists.id, id)).limit(1);

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  if (watchlist.ownerId !== userId) {
    return c.json({ error: 'Only owner can upload cover' }, 403);
  }

  try {
    if (watchlist.imageUrl) {
      await deleteFromCloudinary(watchlist.imageUrl);
    }

    const [result, dominantColor] = await Promise.all([
      cloudinary.uploader.upload(data.imageData, {
        folder: 'watchlists',
        width: 500,
        height: 500,
        crop: 'fill',
        resource_type: 'image',
      }),
      extractDominantColorFromBase64(data.imageData),
    ]);

    const [updated] = await db
      .update(watchlists)
      .set({ imageUrl: result.secure_url, dominantColor })
      .where(eq(watchlists.id, id))
      .returning();

    return c.json({ watchlist: updated, imageUrl: result.secure_url });
  } catch (error) {
    return c.json({ msg: 'Failed to upload image to Cloudinary', error }, 500);
  }
};

export const deleteCover = async (c: C) => {
  const userId = c.get('user')!.sub;
  const id = param(c, 'id');

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  const [watchlist] = await db.select().from(watchlists).where(eq(watchlists.id, id)).limit(1);

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  if (watchlist.ownerId !== userId) {
    return c.json({ error: 'Only owner can delete cover' }, 403);
  }

  if (!watchlist.imageUrl) {
    return c.json({ error: 'No cover image to delete' }, 404);
  }

  await deleteFromCloudinary(watchlist.imageUrl);

  // Recalculer dominantColor depuis le poster du 1er item
  const [firstItem] = await db
    .select({ posterPath: watchlistItems.posterPath })
    .from(watchlistItems)
    .where(eq(watchlistItems.watchlistId, id))
    .orderBy(asc(watchlistItems.position))
    .limit(1);

  let dominantColor: string = FALLBACK_COLOR;
  if (firstItem?.posterPath) {
    const posterUrl = getTMDBImageUrl(firstItem.posterPath);
    if (posterUrl) {
      dominantColor = await extractDominantColorFromUrl(posterUrl);
    }
  }

  const [updated] = await db
    .update(watchlists)
    .set({ imageUrl: null, dominantColor })
    .where(eq(watchlists.id, id))
    .returning();

  return c.json({ message: 'Cover image deleted successfully', watchlist: updated });
};

export const generateWatchlistThumbnail = async (c: C) => {
  const userId = c.get('user')!.sub;
  const id = param(c, 'id');

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Invalid watchlist ID' }, 400);
  }

  const [watchlist] = await db
    .select({ ownerId: watchlists.ownerId })
    .from(watchlists)
    .where(eq(watchlists.id, id))
    .limit(1);

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  const collaboratorRows = await db
    .select({ userId: watchlistCollaborators.userId })
    .from(watchlistCollaborators)
    .where(eq(watchlistCollaborators.watchlistId, id));

  const items = await db
    .select({ posterPath: watchlistItems.posterPath })
    .from(watchlistItems)
    .where(eq(watchlistItems.watchlistId, id))
    .orderBy(asc(watchlistItems.position));

  const isOwner = watchlist.ownerId === userId;
  const isCollaborator = collaboratorRows.some(c => c.userId === userId);

  if (!isOwner && !isCollaborator) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const posterUrls = items
    .slice(0, 4)
    .map(item => getTMDBImageUrl(item.posterPath))
    .filter((url): url is string => url !== null);

  if (posterUrls.length === 0) {
    return c.json({ error: 'No posters available to generate thumbnail' }, 400);
  }

  const thumbnailBuffer = await generateThumbnail(posterUrls);
  const thumbnailUrl = await uploadThumbnailToCloudinary(thumbnailBuffer, id);

  await db.update(watchlists).set({ thumbnailUrl }).where(eq(watchlists.id, id));

  return c.json({ thumbnailUrl });
};

export const saveWatchlist = async (c: C) => {
  const userId = c.get('user')!.sub;
  const id = param(c, 'id');

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  const [watchlist] = await db
    .select({ isPublic: watchlists.isPublic, ownerId: watchlists.ownerId })
    .from(watchlists)
    .where(eq(watchlists.id, id))
    .limit(1);

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  if (!watchlist.isPublic) {
    return c.json({ error: 'Can only save public watchlists' }, 403);
  }

  if (watchlist.ownerId === userId) {
    return c.json({ error: 'Cannot save your own watchlist' }, 400);
  }

  const [existingSave] = await db
    .select({ userId: savedWatchlists.userId })
    .from(savedWatchlists)
    .where(and(eq(savedWatchlists.userId, userId), eq(savedWatchlists.watchlistId, id)))
    .limit(1);

  if (existingSave) {
    return c.json({ error: 'Watchlist already saved' }, 400);
  }

  await db.insert(savedWatchlists).values({ userId, watchlistId: id });

  // Add to likedBy
  const [existingLike] = await db
    .select({ userId: watchlistLikes.userId })
    .from(watchlistLikes)
    .where(and(eq(watchlistLikes.watchlistId, id), eq(watchlistLikes.userId, userId)))
    .limit(1);

  if (!existingLike) {
    await db.insert(watchlistLikes).values({ userId, watchlistId: id });
  }

  await db
    .update(userWatchlistPositions)
    .set({ position: sql`${userWatchlistPositions.position} + 1` })
    .where(eq(userWatchlistPositions.userId, userId));

  await db.insert(userWatchlistPositions).values({ userId, watchlistId: id, position: 0 });

  return c.json({ message: 'Watchlist saved successfully' });
};

export const unsaveWatchlist = async (c: C) => {
  const userId = c.get('user')!.sub;
  const id = param(c, 'id');

  const deleted = await db
    .delete(savedWatchlists)
    .where(and(eq(savedWatchlists.userId, userId), eq(savedWatchlists.watchlistId, id)))
    .returning({ userId: savedWatchlists.userId });

  if (deleted.length === 0) {
    return c.json({ error: 'Watchlist not in saved list' }, 404);
  }

  await db
    .delete(watchlistLikes)
    .where(and(eq(watchlistLikes.userId, userId), eq(watchlistLikes.watchlistId, id)));

  const [positionRecord] = await db
    .select({ position: userWatchlistPositions.position })
    .from(userWatchlistPositions)
    .where(
      and(
        eq(userWatchlistPositions.userId, userId),
        eq(userWatchlistPositions.watchlistId, id)
      )
    )
    .limit(1);

  if (positionRecord) {
    await db
      .delete(userWatchlistPositions)
      .where(
        and(
          eq(userWatchlistPositions.userId, userId),
          eq(userWatchlistPositions.watchlistId, id)
        )
      );
    await db
      .update(userWatchlistPositions)
      .set({ position: sql`${userWatchlistPositions.position} - 1` })
      .where(
        and(
          eq(userWatchlistPositions.userId, userId),
          gt(userWatchlistPositions.position, positionRecord.position)
        )
      );
  }

  return c.json({ message: 'Watchlist removed from library' });
};

export const duplicateWatchlist = async (c: C) => {
  const userId = c.get('user')!.sub;
  const id = param(c, 'id');

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  const [originalWatchlist] = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.id, id))
    .limit(1);

  if (!originalWatchlist) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  const collaboratorRows = await db
    .select({ userId: watchlistCollaborators.userId })
    .from(watchlistCollaborators)
    .where(eq(watchlistCollaborators.watchlistId, id));

  const originalItems = await db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.watchlistId, id))
    .orderBy(asc(watchlistItems.position));

  const isOwner = originalWatchlist.ownerId === userId;
  const isCollaborator = collaboratorRows.some(c => c.userId === userId);

  if (!originalWatchlist.isPublic && !isOwner && !isCollaborator) {
    return c.json({ error: 'Access denied' }, 403);
  }

  if (isOwner) {
    return c.json({ error: 'Cannot duplicate your own watchlist' }, 400);
  }

  const [duplicatedWatchlist] = await db
    .insert(watchlists)
    .values({
      ownerId: userId,
      name: `${originalWatchlist.name} (copy)`,
      description: originalWatchlist.description,
      isPublic: false,
      genres: originalWatchlist.genres,
      thumbnailUrl: originalWatchlist.thumbnailUrl,
      position: 0,
    })
    .returning();

  await db
    .update(userWatchlistPositions)
    .set({ position: sql`${userWatchlistPositions.position} + 1` })
    .where(eq(userWatchlistPositions.userId, userId));

  await db
    .insert(userWatchlistPositions)
    .values({ userId, watchlistId: duplicatedWatchlist.id, position: 0 });

  for (let i = 0; i < originalItems.length; i++) {
    const item = originalItems[i];
    await db.insert(watchlistItems).values({
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
    });
  }

  const fullDuplicatedItems = await db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.watchlistId, duplicatedWatchlist.id))
    .orderBy(asc(watchlistItems.position));

  const posterUrls = fullDuplicatedItems
    .slice(0, 4)
    .map(item => getTMDBImageUrl(item.posterPath))
    .filter((url): url is string => url !== null);

  if (posterUrls.length > 0) {
    regenerateThumbnail(duplicatedWatchlist.id, posterUrls)
      .then(async thumbnailUrl => {
        if (thumbnailUrl) {
          await db
            .update(watchlists)
            .set({ thumbnailUrl })
            .where(eq(watchlists.id, duplicatedWatchlist.id));
        }
      })
      .catch((err: Error) => console.error('Failed to regenerate thumbnail:', err));
  }

  return c.json(
    { watchlist: { ...duplicatedWatchlist, items: fullDuplicatedItems } },
    201
  );
};
