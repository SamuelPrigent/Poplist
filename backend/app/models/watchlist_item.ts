import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Watchlist from './watchlist.js'

export interface Platform {
  name: string
  logoPath: string
}

export default class WatchlistItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'watchlist_id' })
  declare watchlistId: string

  @column({ columnName: 'tmdb_id' })
  declare tmdbId: number

  @column({ columnName: 'media_type' })
  declare mediaType: 'movie' | 'tv'

  @column()
  declare title: string

  @column({ columnName: 'poster_path' })
  declare posterPath: string | null

  @column({ columnName: 'backdrop_path' })
  declare backdropPath: string | null

  @column()
  declare overview: string | null

  @column({ columnName: 'release_date' })
  declare releaseDate: string | null

  @column({ columnName: 'vote_average' })
  declare voteAverage: number | null

  @column()
  declare runtime: number | null

  @column({ columnName: 'number_of_seasons' })
  declare numberOfSeasons: number | null

  @column({ columnName: 'number_of_episodes' })
  declare numberOfEpisodes: number | null

  @column({
    columnName: 'platform_list',
    prepare: (value: Platform[]) => JSON.stringify(value),
    consume: (value: string | Platform[]) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return []
        }
      }
      return value || []
    },
  })
  declare platformList: Platform[]

  @column()
  declare position: number

  @column.dateTime({ columnName: 'added_at' })
  declare addedAt: DateTime

  @belongsTo(() => Watchlist)
  declare watchlist: BelongsTo<typeof Watchlist>
}
