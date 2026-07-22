import type { Context } from 'hono';
import { and, asc, desc, eq, gt, inArray, lt, sql } from 'drizzle-orm';
import type {
  RecommendedItem,
  Watchlist as SharedWatchlist,
  WatchlistItem as SharedWatchlistItem,
} from '@poplist/shared/generated';
import { db } from '../db/index.js';
import {
  savedWatchlists,
  userWatchlistPositions,
  users,
  watchlistCollaborators,
  watchlistItems,
  watchlistLikes,
  watchlistRecommendations,
  watchlists,
} from '../db/schema.js';
import { cloudinary, deleteFromCloudinary } from '../services/cloudinary.service.js';
import {
  deleteThumbnailFromCloudinary,
  generateThumbnail,
  regenerateThumbnail,
  uploadThumbnailToCloudinary,
} from '../services/thumbnail.service.js';
import {
  enrichMediaData,
  getFullMediaDetails,
  getMovieDetails,
  getRecommendationsMultiPage,
  getTVDetails,
  searchMedia,
} from '../services/tmdb.service.js';
import {
  extractDominantColorFromBase64,
  extractDominantColorFromUrl,
  FALLBACK_COLOR,
} from '../services/dominant-color.service.js';
import { saveToCache } from '../services/cache.service.js';
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
} from '../validators/watchlists.validator.js';
import type { AppEnv } from '../app.js';
import type { Platform } from '../types/index.js';
import type {
  addCollaboratorResponseSchema,
  addItemResponseSchema,
  createWatchlistResponseSchema,
  deleteCoverResponseSchema,
  deleteWatchlistResponseSchema,
  duplicateWatchlistResponseSchema,
  generateThumbnailResponseSchema,
  getMyWatchlistsResponseSchema,
  getPublicFeaturedResponseSchema,
  getPublicWatchlistResponseSchema,
  getWatchlistByIdResponseSchema,
  getWatchlistCountByGenreResponseSchema,
  getWatchlistRecommendationsResponseSchema,
  getWatchlistsByGenreResponseSchema,
  leaveWatchlistResponseSchema,
  moveItemResponseSchema,
  removeCollaboratorResponseSchema,
  removeItemResponseSchema,
  reorderItemsResponseSchema,
  reorderWatchlistsResponseSchema,
  saveWatchlistResponseSchema,
  unsaveWatchlistResponseSchema,
  updateWatchlistResponseSchema,
  uploadCoverResponseSchema,
} from '../schemas/watchlists.schemas.js';

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

type WatchlistWithRelations = DBWatchlist & {
  owner?: FormattedUser | null;
  collaborators?: Array<{ user: FormattedUser }>;
  items?: DBWatchlistItem[];
  likedBy?: Array<{ user: FormattedUser }>;
};

/**
 * Convertit un WatchlistItem Drizzle (avec Date) vers le shape JSON-ready (strings ISO).
 * Utilisé par le formatter pour produire le shape attendu par le contrat shared.
 */
function formatItem(item: DBWatchlistItem): SharedWatchlistItem {
  return {
    id: item.id,
    watchlistId: item.watchlistId,
    tmdbId: item.tmdbId,
    mediaType: item.mediaType,
    title: item.title,
    posterPath: item.posterPath,
    backdropPath: item.backdropPath,
    overview: item.overview,
    releaseDate: item.releaseDate,
    voteAverage: item.voteAverage,
    runtime: item.runtime,
    numberOfSeasons: item.numberOfSeasons,
    numberOfEpisodes: item.numberOfEpisodes,
    platformList: item.platformList,
    position: item.position,
    addedAt: item.addedAt?.toISOString() ?? null,
  };
}

/**
 * Formatte une watchlist Drizzle (sans relations chargées) + ses items en shape JSON-ready.
 * Utilisé par les endpoints de mutation qui ne rechargent pas owner/collaborators/likedBy.
 */
function formatWatchlistRowWithItems(row: DBWatchlist, items: DBWatchlistItem[]): SharedWatchlist {
  return formatWatchlistWithRelations({ ...row, items, collaborators: [], owner: null });
}

/**
 * Formatte une watchlist Drizzle + ses relations en shape JSON-ready (strings ISO).
 * Le retour matche le contrat shared.Watchlist (consommé directement par le frontend).
 */
export function formatWatchlistWithRelations(watchlist: WatchlistWithRelations): SharedWatchlist {
  return {
    id: watchlist.id,
    ownerId: watchlist.ownerId,
    name: watchlist.name,
    description: watchlist.description,
    imageUrl: watchlist.imageUrl,
    thumbnailUrl: watchlist.thumbnailUrl,
    dominantColor: watchlist.dominantColor,
    genres: watchlist.genres,
    createdAt: watchlist.createdAt?.toISOString() ?? null,
    updatedAt: watchlist.updatedAt?.toISOString() ?? null,
    owner: watchlist.owner
      ? {
          id: watchlist.owner.id,
          email: watchlist.owner.email,
          username: watchlist.owner.username,
          avatarUrl: watchlist.owner.avatarUrl,
        }
      : undefined,
    collaborators: (watchlist.collaborators ?? []).map((c) => ({
      id: c.user.id,
      email: c.user.email,
      username: c.user.username,
      avatarUrl: c.user.avatarUrl,
    })),
    items: (watchlist.items ?? []).map(formatItem),
    likedBy: watchlist.likedBy?.map((l) => ({
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
  options: { withLikedBy?: boolean } = {},
): Promise<WatchlistWithRelations[]> {
  if (base.length === 0) return [];

  const watchlistIds = base.map((w) => w.id);
  const ownerIds = [
    ...new Set(base.map((w) => w.ownerId).filter((id): id is string => id !== null)),
  ];

  // 1. Owners
  const owners =
    ownerIds.length > 0
      ? await db.select(userColumnsSelect).from(users).where(inArray(users.id, ownerIds))
      : [];
  const ownerMap = new Map(owners.map((u) => [u.id, u]));

  // 2. Items
  const itemRows = await db
    .select()
    .from(watchlistItems)
    .where(inArray(watchlistItems.watchlistId, watchlistIds))
    .orderBy(asc(watchlistItems.position));
  const itemsByWatchlist = new Map<string, DBWatchlistItem[]>();
  itemRows.forEach((i) => {
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
  collabRows.forEach((r) => {
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
    likeRows.forEach((r) => {
      if (!likesByWatchlist.has(r.watchlistId)) likesByWatchlist.set(r.watchlistId, []);
      likesByWatchlist.get(r.watchlistId)!.push({
        id: r.id,
        email: r.email,
        username: r.username,
        avatarUrl: r.avatarUrl,
      });
    });
  }

  return base.map((w) => {
    const result: WatchlistWithRelations = {
      ...w,
      owner: w.ownerId ? (ownerMap.get(w.ownerId) ?? null) : null,
      items: itemsByWatchlist.get(w.id) ?? [],
      collaborators: (collabsByWatchlist.get(w.id) ?? []).map((user) => ({ user })),
    };
    if (options.withLikedBy) {
      result.likedBy = (likesByWatchlist.get(w.id) ?? []).map((user) => ({ user }));
    }
    return result;
  });
}

/** Charge UNE watchlist + ses relations (raccourci pour le helper plural). */
async function loadOneWatchlistRelations(
  watchlistId: string,
  options: { withLikedBy?: boolean } = {},
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
    .orderBy(desc(watchlists.createdAt))
    .limit(limit);

  const enriched = await loadWatchlistRelations(baseWatchlists, { withLikedBy: true });

  const sortedWatchlists = enriched
    .map((w) => ({
      ...formatWatchlistWithRelations(w),
      followersCount: w.likedBy?.length || 0,
    }))
    .sort((a, b) => b.followersCount - a.followersCount);

  if (userId) {
    const savedRows = await db
      .select({ watchlistId: savedWatchlists.watchlistId })
      .from(savedWatchlists)
      .where(eq(savedWatchlists.userId, userId));
    const savedIdsSet = new Set(savedRows.map((r) => r.watchlistId));

    const watchlistsWithFlags = sortedWatchlists.map((w) => ({
      ...w,
      isOwner: w.ownerId === userId,
      isCollaborator: w.collaborators?.some((col) => col.id === userId) || false,
      isSaved: savedIdsSet.has(w.id),
    }));

    return c.json({ watchlists: watchlistsWithFlags } satisfies z.infer<
      typeof getPublicFeaturedResponseSchema
    >);
  }

  return c.json({ watchlists: sortedWatchlists } satisfies z.infer<
    typeof getPublicFeaturedResponseSchema
  >);
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

  return c.json({ watchlist: formatWatchlistWithRelations(watchlist) } satisfies z.infer<
    typeof getPublicWatchlistResponseSchema
  >);
};

export const getWatchlistsByGenre = async (c: C) => {
  const genre = param(c, 'genre');

  if (!genre || genre.trim().length === 0) {
    return c.json({ error: 'Genre parameter is required' }, 400);
  }

  const baseWatchlists = await db
    .select()
    .from(watchlists)
    .where(sql`${genre} = ANY(${watchlists.genres})`)
    .orderBy(desc(watchlists.createdAt));

  const enriched = await loadWatchlistRelations(baseWatchlists, { withLikedBy: true });

  return c.json({ watchlists: enriched.map(formatWatchlistWithRelations) } satisfies z.infer<
    typeof getWatchlistsByGenreResponseSchema
  >);
};

export const getWatchlistCountByGenre = async (c: C) => {
  const genre = param(c, 'genre');

  if (!genre || genre.trim().length === 0) {
    return c.json({ error: 'Genre parameter is required' }, 400);
  }

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(watchlists)
    .where(sql`${genre} = ANY(${watchlists.genres})`);

  return c.json({ genre, count: result[0]?.count ?? 0 } satisfies z.infer<
    typeof getWatchlistCountByGenreResponseSchema
  >);
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
// Recommandations (GET /watchlists/:id/recommendations)
// ========================================

const RECO_CAP = 150; // taille max de la liste finale (cumul films + séries)
const RECO_PER_TYPE = Math.ceil(RECO_CAP / 2); // ~75 candidats par type avant interleave
const RECO_PAGES_PER_SEED = 4; // ~80 candidats bruts par graine (20/page TMDB)
const RECO_TTL_MS = 30 * 24 * 60 * 60 * 1000; // fraîcheur 30 jours

/**
 * Fusion round-robin (zip) de deux listes + remainder : alterne 1 film / 1 série
 * à chaque tour, puis concatène le reste de la liste la plus longue.
 */
export function interleaveRecommendations<T>(movies: T[], series: T[]): T[] {
  const out: T[] = [];
  const max = Math.max(movies.length, series.length);
  for (let i = 0; i < max; i++) {
    if (i < movies.length) out.push(movies[i]);
    if (i < series.length) out.push(series[i]);
  }
  return out;
}

export const getWatchlistRecommendations = async (c: C) => {
  const id = param(c, 'id');
  const userId = c.get('user')?.sub;
  const language = c.req.query('language') || 'fr-FR';

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  const watchlist = await loadOneWatchlistRelations(id);
  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  // 1. Cache DB — servi tel quel si frais (< 30 j)
  const [existing] = await db
    .select()
    .from(watchlistRecommendations)
    .where(eq(watchlistRecommendations.watchlistId, id))
    .limit(1);

  if (existing?.generatedAt && Date.now() - existing.generatedAt.getTime() < RECO_TTL_MS) {
    return c.json({
      items: existing.items,
      generatedAt: existing.generatedAt.toISOString(),
    } satisfies z.infer<typeof getWatchlistRecommendationsResponseSchema>);
  }

  // 2. Recalcul
  const items = watchlist.items ?? [];
  const movieSeeds = items.filter((it) => it.mediaType === 'movie');
  const tvSeeds = items.filter((it) => it.mediaType === 'tv');
  const ownedKeys = new Set(items.map((it) => `${it.mediaType}:${it.tmdbId}`));
  const usedSeedIds: number[] = [];

  // Récupère des tmdbId candidats pour un type, avec repli si une graine renvoie 0.
  const collectForType = async (
    seeds: DBWatchlistItem[],
    type: 'movie' | 'tv',
  ): Promise<number[]> => {
    const pool = [...seeds];
    const collected = new Set<number>();
    while (pool.length > 0 && collected.size === 0) {
      const [seed] = pool.splice(Math.floor(Math.random() * pool.length), 1);
      usedSeedIds.push(seed.tmdbId);
      const recIds = await getRecommendationsMultiPage(
        type,
        String(seed.tmdbId),
        language,
        RECO_PAGES_PER_SEED,
      );
      for (const recId of recIds) {
        if (!ownedKeys.has(`${type}:${recId}`)) collected.add(recId);
      }
    }
    return Array.from(collected).slice(0, RECO_PER_TYPE);
  };

  const [movieRecIds, tvRecIds] = await Promise.all([
    collectForType(movieSeeds, 'movie'),
    collectForType(tvSeeds, 'tv'),
  ]);

  // 3. Enrichissement (runtime / saisons / épisodes) — 1 appel détails par item
  const enrichIds = async (ids: number[], type: 'movie' | 'tv'): Promise<RecommendedItem[]> => {
    const results = await Promise.all(
      ids.map(async (recId) => {
        const details =
          type === 'movie'
            ? await getMovieDetails(String(recId), language)
            : await getTVDetails(String(recId), language);
        if (!details || !details.title) return null;
        return {
          tmdbId: recId,
          mediaType: type,
          title: details.title,
          posterPath: details.posterPath,
          runtime: details.runtime ?? null,
          numberOfSeasons: details.numberOfSeasons ?? null,
          numberOfEpisodes: details.numberOfEpisodes ?? null,
        } satisfies RecommendedItem;
      }),
    );
    return results.filter((r): r is RecommendedItem => r !== null);
  };

  const [movieItems, tvItems] = await Promise.all([
    enrichIds(movieRecIds, 'movie'),
    enrichIds(tvRecIds, 'tv'),
  ]);

  // 4. Interleave films/séries + cap dur
  const finalItems = interleaveRecommendations(movieItems, tvItems).slice(0, RECO_CAP);

  // 5. Upsert (anti-race sur watchlist_id)
  const now = new Date();
  await db
    .insert(watchlistRecommendations)
    .values({
      watchlistId: id,
      items: finalItems,
      sourceItemIds: usedSeedIds,
      generatedAt: now,
    })
    .onConflictDoUpdate({
      target: watchlistRecommendations.watchlistId,
      set: { items: finalItems, sourceItemIds: usedSeedIds, generatedAt: now },
    });

  return c.json({
    items: finalItems,
    generatedAt: now.toISOString(),
  } satisfies z.infer<typeof getWatchlistRecommendationsResponseSchema>);
};

// ========================================
// Protected
// ========================================

export const getMyWatchlists = async (c: C) => {
  const userId = c.get('user')!.sub;

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
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
  const positionMap = new Map(userPositions.map((r) => [r.watchlistId, r.position]));

  const ownedBase = await db.select().from(watchlists).where(eq(watchlists.ownerId, userId));

  const collabRecords = await db
    .select({ watchlistId: watchlistCollaborators.watchlistId })
    .from(watchlistCollaborators)
    .where(eq(watchlistCollaborators.userId, userId));
  const collabIds = collabRecords.map((r) => r.watchlistId);

  const collaborativeBase =
    collabIds.length > 0
      ? await db.select().from(watchlists).where(inArray(watchlists.id, collabIds))
      : [];

  const savedRecords = await db
    .select({ watchlistId: savedWatchlists.watchlistId })
    .from(savedWatchlists)
    .where(eq(savedWatchlists.userId, userId));
  const savedIds = savedRecords.map((r) => r.watchlistId);

  const savedBase =
    savedIds.length > 0
      ? await db.select().from(watchlists).where(inArray(watchlists.id, savedIds))
      : [];

  // Bulk-fetch des relations en une seule passe (déduplication par id)
  const allBaseMap = new Map<string, DBWatchlist>();
  ownedBase.forEach((w) => allBaseMap.set(w.id, w));
  collaborativeBase.forEach((w) => allBaseMap.set(w.id, w));
  savedBase.forEach((w) => allBaseMap.set(w.id, w));
  const allEnriched = await loadWatchlistRelations(Array.from(allBaseMap.values()));
  const enrichedMap = new Map(allEnriched.map((w) => [w.id, w]));

  type MyWatchlist = SharedWatchlist & {
    isOwner: boolean;
    isCollaborator: boolean;
    isSaved: boolean;
    libraryPosition: number;
  };
  const watchlistsMap = new Map<string, MyWatchlist>();
  const savedIdsSet = new Set(savedIds);
  const collabIdsSet = new Set(collabIds);

  ownedBase.forEach((w) => {
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

  collaborativeBase.forEach((w) => {
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

  savedBase.forEach((w) => {
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
    (a, b) => (a.libraryPosition ?? 9999) - (b.libraryPosition ?? 9999),
  );

  return c.json({ watchlists: result } satisfies z.infer<typeof getMyWatchlistsResponseSchema>);
};

export const createWatchlist = async (c: C, data: CreateWatchlistInput) => {
  const userId = c.get('user')!.sub;

  const [watchlist] = await db
    .insert(watchlists)
    .values({
      ownerId: userId,
      name: data.name,
      description: data.description,
      genres: data.genres || [],
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
        platformList: (item.platformList || []).map((p) => ({
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
      .map((item) => getTMDBImageUrl(item.posterPath))
      .filter((url): url is string => url !== null);

    if (posterUrls.length > 0) {
      regenerateThumbnail(watchlist.id, posterUrls)
        .then(async (thumbnailUrl) => {
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

  return c.json(
    { watchlist: formatWatchlistWithRelations(fullWatchlist) } satisfies z.infer<
      typeof createWatchlistResponseSchema
    >,
    201,
  );
};

export const reorderWatchlists = async (c: C, data: ReorderWatchlistsInput) => {
  const userId = c.get('user')!.sub;

  // Upsert : crée la ligne si elle n'existe pas (cas typique : watchlist
  // importée externe sans ligne user_watchlist_positions), ou met à jour la
  // position existante. Frontend envoie toutes les watchlists dans l'ordre,
  // donc une passe régularise tout.
  for (let i = 0; i < data.orderedWatchlistIds.length; i++) {
    await db
      .insert(userWatchlistPositions)
      .values({
        userId,
        watchlistId: data.orderedWatchlistIds[i],
        position: i,
      })
      .onConflictDoUpdate({
        target: [userWatchlistPositions.userId, userWatchlistPositions.watchlistId],
        set: { position: i },
      });
  }

  return c.json({ message: 'Watchlists reordered successfully' } satisfies z.infer<
    typeof reorderWatchlistsResponseSchema
  >);
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
  const isCollaborator = watchlist.collaborators?.some((c) => c.user.id === userId) ?? false;

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
  } satisfies z.infer<typeof getWatchlistByIdResponseSchema>);
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
  const isCollaborator = collaboratorRows.some((c) => c.userId === userId);

  if (!isOwner && !isCollaborator) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const updateData: Partial<typeof watchlists.$inferInsert> = {};
  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
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

  return c.json({ watchlist: formatWatchlistRowWithItems(updated, items) } satisfies z.infer<
    typeof updateWatchlistResponseSchema
  >);
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
          gt(userWatchlistPositions.position, record.position),
        ),
      );
  }

  await db.delete(watchlists).where(eq(watchlists.id, id));

  return c.json({ message: 'Watchlist deleted successfully' } satisfies z.infer<
    typeof deleteWatchlistResponseSchema
  >);
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
        eq(watchlistCollaborators.userId, collaborator.id),
      ),
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
        eq(userWatchlistPositions.watchlistId, id),
      ),
    )
    .limit(1);

  if (existingPosition) {
    await db
      .delete(userWatchlistPositions)
      .where(
        and(
          eq(userWatchlistPositions.userId, collaborator.id),
          eq(userWatchlistPositions.watchlistId, id),
        ),
      );
    await db
      .update(userWatchlistPositions)
      .set({ position: sql`${userWatchlistPositions.position} - 1` })
      .where(
        and(
          eq(userWatchlistPositions.userId, collaborator.id),
          gt(userWatchlistPositions.position, existingPosition.position),
        ),
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
    collaborators: collabRows.map((r) => ({
      id: r.id,
      username: r.username,
      email: r.email,
      avatarUrl: r.avatarUrl || null,
    })),
  } satisfies z.infer<typeof addCollaboratorResponseSchema>);
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
        eq(watchlistCollaborators.userId, collaboratorId),
      ),
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
        eq(userWatchlistPositions.watchlistId, id),
      ),
    )
    .limit(1);

  if (positionRecord) {
    await db
      .delete(userWatchlistPositions)
      .where(
        and(
          eq(userWatchlistPositions.userId, collaboratorId),
          eq(userWatchlistPositions.watchlistId, id),
        ),
      );
    await db
      .update(userWatchlistPositions)
      .set({ position: sql`${userWatchlistPositions.position} - 1` })
      .where(
        and(
          eq(userWatchlistPositions.userId, collaboratorId),
          gt(userWatchlistPositions.position, positionRecord.position),
        ),
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
    collaborators: collabRows.map((r) => ({
      id: r.id,
      username: r.username,
      email: r.email,
      avatarUrl: r.avatarUrl || null,
    })),
  } satisfies z.infer<typeof removeCollaboratorResponseSchema>);
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
      and(eq(watchlistCollaborators.watchlistId, id), eq(watchlistCollaborators.userId, userId)),
    )
    .returning({ userId: watchlistCollaborators.userId });

  if (deleted.length === 0) {
    return c.json({ error: 'You are not a collaborator of this watchlist' }, 403);
  }

  const [positionRecord] = await db
    .select({ position: userWatchlistPositions.position })
    .from(userWatchlistPositions)
    .where(
      and(eq(userWatchlistPositions.userId, userId), eq(userWatchlistPositions.watchlistId, id)),
    )
    .limit(1);

  if (positionRecord) {
    await db
      .delete(userWatchlistPositions)
      .where(
        and(eq(userWatchlistPositions.userId, userId), eq(userWatchlistPositions.watchlistId, id)),
      );
    await db
      .update(userWatchlistPositions)
      .set({ position: sql`${userWatchlistPositions.position} - 1` })
      .where(
        and(
          eq(userWatchlistPositions.userId, userId),
          gt(userWatchlistPositions.position, positionRecord.position),
        ),
      );
  }

  return c.json({ message: 'Left watchlist successfully' } satisfies z.infer<
    typeof leaveWatchlistResponseSchema
  >);
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
  const isCollaborator = collaboratorRows.some((c) => c.userId === userId);

  if (!isOwner && !isCollaborator) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const tmdbIdNum = parseInt(data.tmdbId, 10);
  const itemExists = items.some((item) => item.tmdbId === tmdbIdNum);
  if (itemExists) {
    return c.json({ error: 'Item already exists in watchlist' }, 400);
  }

  const enrichedData = await enrichMediaData(
    data.tmdbId,
    data.mediaType,
    data.language || 'fr-FR',
    data.region || 'FR',
  );

  if (!enrichedData) {
    return c.json({ error: 'Failed to fetch media details from TMDB' }, 500);
  }

  const maxPosItem = items.length > 0 ? Math.max(...items.map((i) => i.position ?? 0)) : -1;
  const newPosition = maxPosItem + 1;

  await db.insert(watchlistItems).values({
    watchlistId: id,
    tmdbId: parseInt(enrichedData.tmdbId, 10),
    mediaType: enrichedData.mediaType,
    title: enrichedData.title,
    posterPath: enrichedData.posterPath,
    // Bannière paysage (utilisée par les cards mobiles / fiche détails).
    backdropPath: enrichedData.backdropUrl || null,
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
    .map((item) => getTMDBImageUrl(item.posterPath))
    .filter((url): url is string => url !== null);

  regenerateThumbnail(id, posterUrls)
    .then(async (thumbnailUrl) => {
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
        .then(async (dominantColor) => {
          await db.update(watchlists).set({ dominantColor }).where(eq(watchlists.id, id));
        })
        .catch((err) => console.error('Failed to extract dominant color:', err));
    }
  }

  return c.json({
    watchlist: formatWatchlistRowWithItems(updatedWatchlistRow, updatedItems),
  } satisfies z.infer<typeof addItemResponseSchema>);
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
  const isCollaborator = collaboratorRows.some((c) => c.userId === userId);

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
    .map((item) => getTMDBImageUrl(item.posterPath))
    .filter((url): url is string => url !== null);

  regenerateThumbnail(id, posterUrls)
    .then(async (thumbnailUrl) => {
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
          .then(async (dominantColor) => {
            await db.update(watchlists).set({ dominantColor }).where(eq(watchlists.id, id));
          })
          .catch((err) => console.error('Failed to extract dominant color:', err));
      }
    } else {
      db.update(watchlists)
        .set({ dominantColor: FALLBACK_COLOR })
        .where(eq(watchlists.id, id))
        .catch((err: Error) => console.error('Failed to reset dominant color:', err));
    }
  }

  return c.json({
    watchlist: formatWatchlistRowWithItems(updatedWatchlistRow, updatedItems),
  } satisfies z.infer<typeof removeItemResponseSchema>);
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
  const isCollaborator = collaboratorRows.some((c) => c.userId === userId);

  if (!isOwner && !isCollaborator) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const tmdbIdNum = parseInt(tmdbId, 10);
  const item = items.find((i) => i.tmdbId === tmdbIdNum);
  if (!item) {
    return c.json({ error: 'Item not found in watchlist' }, 404);
  }

  const itemPosition = item.position ?? 0;

  if (data.position === 'first') {
    await db
      .update(watchlistItems)
      .set({ position: sql`${watchlistItems.position} + 1` })
      .where(and(eq(watchlistItems.watchlistId, id), lt(watchlistItems.position, itemPosition)));
    await db.update(watchlistItems).set({ position: 0 }).where(eq(watchlistItems.id, item.id));
  } else {
    const maxPos = items.length - 1;
    await db
      .update(watchlistItems)
      .set({ position: sql`${watchlistItems.position} - 1` })
      .where(and(eq(watchlistItems.watchlistId, id), gt(watchlistItems.position, itemPosition)));
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
    .map((item) => getTMDBImageUrl(item.posterPath))
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
          .then(async (dominantColor) => {
            await db.update(watchlists).set({ dominantColor }).where(eq(watchlists.id, id));
          })
          .catch((err) => console.error('Failed to extract dominant color:', err));
      }
    }
  }

  return c.json({
    watchlist: formatWatchlistRowWithItems(updatedWatchlistRow, updatedItems),
  } satisfies z.infer<typeof moveItemResponseSchema>);
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
  const isCollaborator = collaboratorRows.some((c) => c.userId === userId);

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
    .map((item) => getTMDBImageUrl(item.posterPath))
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
          .then(async (dominantColor) => {
            await db.update(watchlists).set({ dominantColor }).where(eq(watchlists.id, id));
          })
          .catch((err) => console.error('Failed to extract dominant color:', err));
      }
    }
  }

  return c.json({
    watchlist: formatWatchlistRowWithItems(updatedWatchlistRow, updatedItems),
  } satisfies z.infer<typeof reorderItemsResponseSchema>);
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

    const updatedItems = await db
      .select()
      .from(watchlistItems)
      .where(eq(watchlistItems.watchlistId, id))
      .orderBy(asc(watchlistItems.position));

    return c.json({
      watchlist: formatWatchlistRowWithItems(updated, updatedItems),
      imageUrl: result.secure_url,
    } satisfies z.infer<typeof uploadCoverResponseSchema>);
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

  const updatedItems = await db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.watchlistId, id))
    .orderBy(asc(watchlistItems.position));

  return c.json({
    message: 'Cover image deleted successfully',
    watchlist: formatWatchlistRowWithItems(updated, updatedItems),
  } satisfies z.infer<typeof deleteCoverResponseSchema>);
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
  const isCollaborator = collaboratorRows.some((c) => c.userId === userId);

  if (!isOwner && !isCollaborator) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const posterUrls = items
    .slice(0, 4)
    .map((item) => getTMDBImageUrl(item.posterPath))
    .filter((url): url is string => url !== null);

  if (posterUrls.length === 0) {
    return c.json({ error: 'No posters available to generate thumbnail' }, 400);
  }

  const thumbnailBuffer = await generateThumbnail(posterUrls);
  const thumbnailUrl = await uploadThumbnailToCloudinary(thumbnailBuffer, id);

  await db.update(watchlists).set({ thumbnailUrl }).where(eq(watchlists.id, id));

  return c.json({ thumbnailUrl } satisfies z.infer<typeof generateThumbnailResponseSchema>);
};

export const saveWatchlist = async (c: C) => {
  const userId = c.get('user')!.sub;
  const id = param(c, 'id');

  if (!isValidWatchlistId(id)) {
    return c.json({ error: 'Watchlist not found' }, 404);
  }

  const [watchlist] = await db
    .select({ ownerId: watchlists.ownerId })
    .from(watchlists)
    .where(eq(watchlists.id, id))
    .limit(1);

  if (!watchlist) {
    return c.json({ error: 'Watchlist not found' }, 404);
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

  return c.json({ message: 'Watchlist saved successfully' } satisfies z.infer<
    typeof saveWatchlistResponseSchema
  >);
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
      and(eq(userWatchlistPositions.userId, userId), eq(userWatchlistPositions.watchlistId, id)),
    )
    .limit(1);

  if (positionRecord) {
    await db
      .delete(userWatchlistPositions)
      .where(
        and(eq(userWatchlistPositions.userId, userId), eq(userWatchlistPositions.watchlistId, id)),
      );
    await db
      .update(userWatchlistPositions)
      .set({ position: sql`${userWatchlistPositions.position} - 1` })
      .where(
        and(
          eq(userWatchlistPositions.userId, userId),
          gt(userWatchlistPositions.position, positionRecord.position),
        ),
      );
  }

  return c.json({ message: 'Watchlist removed from library' } satisfies z.infer<
    typeof unsaveWatchlistResponseSchema
  >);
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

  const originalItems = await db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.watchlistId, id))
    .orderBy(asc(watchlistItems.position));

  const isOwner = originalWatchlist.ownerId === userId;

  if (isOwner) {
    return c.json({ error: 'Cannot duplicate your own watchlist' }, 400);
  }

  const [duplicatedWatchlist] = await db
    .insert(watchlists)
    .values({
      ownerId: userId,
      name: `${originalWatchlist.name} (copy)`,
      description: originalWatchlist.description,
      genres: originalWatchlist.genres,
      thumbnailUrl: originalWatchlist.thumbnailUrl,
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
      backdropPath: item.backdropPath,
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
    .map((item) => getTMDBImageUrl(item.posterPath))
    .filter((url): url is string => url !== null);

  if (posterUrls.length > 0) {
    regenerateThumbnail(duplicatedWatchlist.id, posterUrls)
      .then(async (thumbnailUrl) => {
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
    {
      watchlist: formatWatchlistRowWithItems(duplicatedWatchlist, fullDuplicatedItems),
    } satisfies z.infer<typeof duplicateWatchlistResponseSchema>,
    201,
  );
};
