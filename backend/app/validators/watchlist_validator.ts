import vine from '@vinejs/vine'

const platformSchema = vine.object({
  name: vine.string(),
  logoPath: vine.string().optional(),
})

const watchlistItemSchema = vine.object({
  tmdbId: vine.number(),
  title: vine.string(),
  posterPath: vine.string().nullable().optional(),
  mediaType: vine.enum(['movie', 'tv']),
  platformList: vine.array(platformSchema).optional(),
  runtime: vine.number().optional(),
  numberOfSeasons: vine.number().optional(),
  numberOfEpisodes: vine.number().optional(),
  addedAt: vine.string().optional(),
})

export const createWatchlistValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1).maxLength(100),
    description: vine.string().maxLength(500).optional(),
    isPublic: vine.boolean().optional(),
    genres: vine.array(vine.string()).optional(),
    items: vine.array(watchlistItemSchema).optional(),
    fromLocalStorage: vine.boolean().optional(),
  })
)

export const updateWatchlistValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1).maxLength(100).optional(),
    description: vine.string().maxLength(500).optional(),
    isPublic: vine.boolean().optional(),
    genres: vine.array(vine.string()).optional(),
    items: vine.array(watchlistItemSchema).optional(),
  })
)

export const addCollaboratorValidator = vine.compile(
  vine.object({
    username: vine.string().minLength(3).maxLength(20),
  })
)

export const addItemValidator = vine.compile(
  vine.object({
    tmdbId: vine.string(),
    mediaType: vine.enum(['movie', 'tv']),
    language: vine.string().optional(),
    region: vine.string().optional(),
  })
)

export const moveItemValidator = vine.compile(
  vine.object({
    position: vine.enum(['first', 'last']),
  })
)

export const reorderItemsValidator = vine.compile(
  vine.object({
    orderedTmdbIds: vine.array(vine.string()),
  })
)

export const reorderWatchlistsValidator = vine.compile(
  vine.object({
    orderedWatchlistIds: vine.array(vine.string()),
  })
)
