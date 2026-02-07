import { z } from 'zod';

const platformSchema = z.object({
  name: z.string(),
  logoPath: z.string().optional(),
});

const watchlistItemSchema = z.object({
  tmdbId: z.number(),
  title: z.string(),
  posterPath: z.string().nullable().optional(),
  mediaType: z.enum(['movie', 'tv']),
  platformList: z.array(platformSchema).optional(),
  runtime: z.number().optional(),
  numberOfSeasons: z.number().optional(),
  numberOfEpisodes: z.number().optional(),
  addedAt: z.string().optional(),
});

export const createWatchlistSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  genres: z.array(z.string()).optional(),
  items: z.array(watchlistItemSchema).optional(),
  fromLocalStorage: z.boolean().optional(),
});

export const updateWatchlistSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  genres: z.array(z.string()).optional(),
  items: z.array(watchlistItemSchema).optional(),
});

export const addCollaboratorSchema = z.object({
  username: z.string().min(3).max(20),
});

export const addItemSchema = z.object({
  tmdbId: z.string(),
  mediaType: z.enum(['movie', 'tv']),
  language: z.string().optional(),
  region: z.string().optional(),
});

export const moveItemSchema = z.object({
  position: z.enum(['first', 'last']),
});

export const reorderItemsSchema = z.object({
  orderedTmdbIds: z.array(z.string()),
});

export const reorderWatchlistsSchema = z.object({
  orderedWatchlistIds: z.array(z.string()),
});
