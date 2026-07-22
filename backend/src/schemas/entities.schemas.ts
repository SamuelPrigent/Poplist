/**
 * Schémas zod des ENTITÉS du domaine, réutilisés par les schémas de réponse de
 * chaque domaine (`*.schemas.ts`). Définis UNE seule fois ici pour éviter les
 * collisions de composants OpenAPI (`.meta({ ref })`) entre fichiers.
 *
 * Transcription fidèle des entités `@poplist/shared` (`shared/src/entities/*`).
 * Les assertions anti-drift des fichiers de réponse garantissent la conformité.
 */
import { z } from 'zod';

// ===== Watchlists =====

export const platformSchema = z
  .object({ name: z.string(), logoPath: z.string() })
  .meta({ ref: 'Platform' });

export const watchlistOwnerSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    username: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  })
  .meta({ ref: 'WatchlistOwner' });

export const watchlistItemSchema = z
  .object({
    id: z.string(),
    watchlistId: z.string().nullable(),
    tmdbId: z.number(),
    mediaType: z.string(),
    title: z.string().nullable(),
    posterPath: z.string().nullable(),
    backdropPath: z.string().nullable(),
    overview: z.string().nullable(),
    releaseDate: z.string().nullable(),
    voteAverage: z.string().nullable(),
    runtime: z.number().nullable(),
    numberOfSeasons: z.number().nullable(),
    numberOfEpisodes: z.number().nullable(),
    platformList: z.array(platformSchema).nullable(),
    position: z.number().nullable(),
    addedAt: z.string().nullable(),
  })
  .meta({ ref: 'WatchlistItem' });

export const watchlistSchema = z
  .object({
    id: z.string(),
    ownerId: z.string().nullable(),
    name: z.string(),
    description: z.string().nullable(),
    imageUrl: z.string().nullable(),
    thumbnailUrl: z.string().nullable(),
    dominantColor: z.string().nullable(),
    genres: z.array(z.string()).nullable(),
    createdAt: z.string().nullable(),
    updatedAt: z.string().nullable(),
    owner: watchlistOwnerSchema.optional(),
    collaborators: z.array(watchlistOwnerSchema),
    items: z.array(watchlistItemSchema),
    likedBy: z.array(watchlistOwnerSchema).optional(),
    isOwner: z.boolean().optional(),
    isCollaborator: z.boolean().optional(),
    isSaved: z.boolean().optional(),
    followersCount: z.number().optional(),
    libraryPosition: z.number().optional(),
  })
  .meta({ ref: 'Watchlist' });

export const recommendedItemSchema = z
  .object({
    tmdbId: z.number(),
    mediaType: z.enum(['movie', 'tv']),
    title: z.string(),
    posterPath: z.string().nullable(),
    runtime: z.number().nullable(),
    numberOfSeasons: z.number().nullable(),
    numberOfEpisodes: z.number().nullable(),
  })
  .meta({ ref: 'RecommendedItem' });

// ===== Users =====

export const userSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    username: z.string().nullable(),
    language: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    hasPassword: z.boolean().optional(),
    createdAt: z.string().nullable().optional(),
  })
  .meta({ ref: 'User' });

export const userProfilePublicSchema = z
  .object({
    id: z.string(),
    username: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  })
  .meta({ ref: 'UserProfilePublic' });

// ===== TMDB =====

export const tmdbMediaItemSchema = z
  .object({
    id: z.number(),
    media_type: z.enum(['movie', 'tv']).optional(),
    title: z.string().optional(),
    name: z.string().optional(),
    poster_path: z.string().nullable().optional(),
    backdrop_path: z.string().nullable().optional(),
    overview: z.string().optional(),
    vote_average: z.number().optional(),
    vote_count: z.number().optional(),
    release_date: z.string().optional(),
    first_air_date: z.string().optional(),
    genre_ids: z.array(z.number()).optional(),
    runtime: z.number().optional(),
  })
  .meta({ ref: 'TMDBMediaItem' });

export const tmdbListResponseSchema = z
  .object({
    results: z.array(tmdbMediaItemSchema),
    page: z.number(),
    total_pages: z.number(),
    total_results: z.number(),
  })
  .meta({ ref: 'TMDBListResponse' });

export const tmdbGenresResponseSchema = z
  .object({
    genres: z.array(z.object({ id: z.number(), name: z.string() })),
  })
  .meta({ ref: 'TMDBGenresResponse' });

const tmdbProviderSchema = z
  .object({
    logo_path: z.string(),
    provider_id: z.number(),
    provider_name: z.string(),
    display_priority: z.number(),
  })
  .meta({ ref: 'TMDBProvider' });

export const tmdbProvidersResponseSchema = z
  .object({
    id: z.number().optional(),
    results: z.record(
      z.string(),
      z.object({
        link: z.string(),
        flatrate: z.array(tmdbProviderSchema).optional(),
        buy: z.array(tmdbProviderSchema).optional(),
        rent: z.array(tmdbProviderSchema).optional(),
      }),
    ),
  })
  .meta({ ref: 'TMDBProvidersResponse' });

const castMemberSchema = z
  .object({
    name: z.string(),
    character: z.string(),
    profileUrl: z.string(),
  })
  .meta({ ref: 'CastMember' });

export const fullMediaDetailsSchema = z
  .object({
    tmdbId: z.string(),
    title: z.string(),
    overview: z.string(),
    posterUrl: z.string(),
    backdropUrl: z.string(),
    releaseDate: z.string(),
    runtime: z.number().optional(),
    rating: z.number(),
    voteCount: z.number(),
    genres: z.array(z.string()),
    cast: z.array(castMemberSchema),
    director: z.string().optional(),
    type: z.enum(['movie', 'tv']),
    numberOfSeasons: z.number().optional(),
    numberOfEpisodes: z.number().optional(),
  })
  .meta({ ref: 'FullMediaDetails' });
