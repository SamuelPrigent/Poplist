import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import WatchlistItem from './watchlist_item.js'

export default class Watchlist extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'owner_id' })
  declare ownerId: string

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column({ columnName: 'image_url' })
  declare imageUrl: string | null

  @column({ columnName: 'thumbnail_url' })
  declare thumbnailUrl: string | null

  @column({ columnName: 'is_public' })
  declare isPublic: boolean

  @column()
  declare genres: string[] | null

  @column()
  declare position: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => User, { foreignKey: 'ownerId' })
  declare owner: BelongsTo<typeof User>

  @hasMany(() => WatchlistItem)
  declare items: HasMany<typeof WatchlistItem>

  @manyToMany(() => User, {
    pivotTable: 'watchlist_collaborators',
    pivotTimestamps: { createdAt: 'added_at', updatedAt: false },
  })
  declare collaborators: ManyToMany<typeof User>

  @manyToMany(() => User, {
    pivotTable: 'watchlist_likes',
    pivotTimestamps: { createdAt: 'liked_at', updatedAt: false },
  })
  declare likedBy: ManyToMany<typeof User>
}
