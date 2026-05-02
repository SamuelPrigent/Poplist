import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  boolean,
  integer,
  date,
  numeric,
  primaryKey,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { Platform } from '../types/index.js';

// ========================================
// users
// ========================================
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    email: varchar('email', { length: 255 }).notNull(),
    username: varchar('username', { length: 50 }),
    passwordHash: varchar('password_hash', { length: 255 }),
    googleId: varchar('google_id', { length: 255 }),
    avatarUrl: text('avatar_url'),
    language: varchar('language', { length: 5 }).default('fr'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
  },
  (t) => [
    uniqueIndex('users_email_key').on(t.email),
    uniqueIndex('users_username_key').on(t.username),
    uniqueIndex('users_google_id_key').on(t.googleId),
    index('idx_users_email').on(t.email),
    index('idx_users_google_id').on(t.googleId),
  ]
);

// ========================================
// refresh_tokens
// ========================================
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    userAgent: text('user_agent'),
    issuedAt: timestamp('issued_at', { mode: 'date' }).defaultNow(),
    expiresAt: timestamp('expires_at', { mode: 'date' }),
  },
  (t) => [index('idx_refresh_tokens_user').on(t.userId)]
);

// ========================================
// watchlists
// ========================================
export const watchlists = pgTable(
  'watchlists',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    thumbnailUrl: text('thumbnail_url'),
    dominantColor: text('dominant_color'),
    isPublic: boolean('is_public').default(false),
    genres: text('genres').array(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
  },
  (t) => [
    index('idx_watchlists_owner').on(t.ownerId),
    index('idx_watchlists_public')
      .on(t.isPublic)
      .where(sql`(is_public = true)`),
  ]
);

// ========================================
// watchlist_items
// ========================================
export const watchlistItems = pgTable(
  'watchlist_items',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    watchlistId: uuid('watchlist_id').references(() => watchlists.id, { onDelete: 'cascade' }),
    tmdbId: integer('tmdb_id').notNull(),
    mediaType: varchar('media_type', { length: 10 }).notNull(),
    title: varchar('title', { length: 255 }),
    posterPath: text('poster_path'),
    backdropPath: text('backdrop_path'),
    overview: text('overview'),
    releaseDate: date('release_date'),
    voteAverage: numeric('vote_average', { precision: 3, scale: 1 }),
    runtime: integer('runtime'),
    numberOfSeasons: integer('number_of_seasons'),
    numberOfEpisodes: integer('number_of_episodes'),
    platformList: jsonb('platform_list').$type<Platform[]>().default([]),
    position: integer('position').default(0),
    addedAt: timestamp('added_at', { mode: 'date' }).defaultNow(),
  },
  (t) => [
    index('idx_watchlist_items_watchlist').on(t.watchlistId),
    uniqueIndex('watchlist_items_watchlist_id_tmdb_id_media_type_key').on(
      t.watchlistId,
      t.tmdbId,
      t.mediaType
    ),
  ]
);

// ========================================
// watchlist_collaborators
// ========================================
export const watchlistCollaborators = pgTable(
  'watchlist_collaborators',
  {
    watchlistId: uuid('watchlist_id')
      .notNull()
      .references(() => watchlists.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at', { mode: 'date' }).defaultNow(),
  },
  (t) => [
    primaryKey({
      name: 'watchlist_collaborators_pkey',
      columns: [t.watchlistId, t.userId],
    }),
  ]
);

// ========================================
// watchlist_likes
// ========================================
export const watchlistLikes = pgTable(
  'watchlist_likes',
  {
    watchlistId: uuid('watchlist_id')
      .notNull()
      .references(() => watchlists.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    likedAt: timestamp('liked_at', { mode: 'date' }).defaultNow(),
  },
  (t) => [
    primaryKey({
      name: 'watchlist_likes_pkey',
      columns: [t.watchlistId, t.userId],
    }),
  ]
);

// ========================================
// saved_watchlists
// ========================================
export const savedWatchlists = pgTable(
  'saved_watchlists',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    watchlistId: uuid('watchlist_id')
      .notNull()
      .references(() => watchlists.id, { onDelete: 'cascade' }),
    savedAt: timestamp('saved_at', { mode: 'date' }).defaultNow(),
  },
  (t) => [
    primaryKey({
      name: 'saved_watchlists_pkey',
      columns: [t.watchlistId, t.userId],
    }),
  ]
);

// ========================================
// user_watchlist_positions
// ========================================
export const userWatchlistPositions = pgTable(
  'user_watchlist_positions',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    watchlistId: uuid('watchlist_id')
      .notNull()
      .references(() => watchlists.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
    addedAt: timestamp('added_at', { mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    primaryKey({
      name: 'user_watchlist_positions_pkey',
      columns: [t.watchlistId, t.userId],
    }),
    index('user_watchlist_positions_user_id_position_index').on(t.userId, t.position),
  ]
);

// ========================================
// api_caches
// ========================================
export const apiCaches = pgTable(
  'api_caches',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    requestUrl: varchar('request_url', { length: 2048 }).notNull(),
    responseData: jsonb('response_data').notNull(),
    cachedAt: timestamp('cached_at', { mode: 'date' }).defaultNow(),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  },
  (t) => [
    uniqueIndex('api_caches_request_url_key').on(t.requestUrl),
    index('idx_api_caches_expires').on(t.expiresAt),
    index('idx_api_caches_url').on(t.requestUrl),
  ]
);
