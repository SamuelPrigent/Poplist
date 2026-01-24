import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import RefreshToken from './refresh_token.js'
import Watchlist from './watchlist.js'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare email: string

  @column()
  declare username: string | null

  @column({ columnName: 'password_hash' })
  declare passwordHash: string | null

  @column({ columnName: 'google_id' })
  declare googleId: string | null

  @column({ columnName: 'avatar_url' })
  declare avatarUrl: string | null

  @column()
  declare language: string

  @column()
  declare roles: string[]

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  // Relations
  @hasMany(() => RefreshToken)
  declare refreshTokens: HasMany<typeof RefreshToken>

  @hasMany(() => Watchlist, { foreignKey: 'ownerId' })
  declare watchlists: HasMany<typeof Watchlist>

  @manyToMany(() => Watchlist, {
    pivotTable: 'saved_watchlists',
    pivotTimestamps: { createdAt: 'saved_at', updatedAt: false },
  })
  declare savedWatchlists: ManyToMany<typeof Watchlist>

  @manyToMany(() => Watchlist, {
    pivotTable: 'watchlist_collaborators',
    pivotTimestamps: { createdAt: 'added_at', updatedAt: false },
  })
  declare collaborativeWatchlists: ManyToMany<typeof Watchlist>
}
