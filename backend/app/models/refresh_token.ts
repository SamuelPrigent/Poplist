import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class RefreshToken extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'user_id' })
  declare userId: string

  @column({ columnName: 'token_hash' })
  declare tokenHash: string

  @column({ columnName: 'user_agent' })
  declare userAgent: string | null

  @column.dateTime({ columnName: 'issued_at' })
  declare issuedAt: DateTime

  @column.dateTime({ columnName: 'expires_at' })
  declare expiresAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
