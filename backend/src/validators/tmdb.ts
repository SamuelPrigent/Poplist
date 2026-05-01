import { z } from 'zod';

export const trendingQuerySchema = z.object({
  language: z.string().optional(),
  page: z.string().optional(),
});

export const discoverQuerySchema = z.object({
  language: z.string().optional(),
  page: z.string().optional(),
  region: z.string().optional(),
  sort_by: z.string().optional(),
  with_genres: z.string().optional(),
  'vote_count.gte': z.string().optional(),
  'vote_average.gte': z.string().optional(),
  'primary_release_date.gte': z.string().optional(),
  'primary_release_date.lte': z.string().optional(),
  'first_air_date.gte': z.string().optional(),
  'first_air_date.lte': z.string().optional(),
});

export const genresQuerySchema = z.object({
  language: z.string().optional(),
});

export const popularQuerySchema = z.object({
  language: z.string().optional(),
  page: z.string().optional(),
  region: z.string().optional(),
});

export const topRatedQuerySchema = z.object({
  language: z.string().optional(),
  page: z.string().optional(),
  region: z.string().optional(),
});

export const providersQuerySchema = z.object({
  region: z.string().optional(),
});

export const similarQuerySchema = z.object({
  language: z.string().optional(),
  page: z.string().optional(),
});
