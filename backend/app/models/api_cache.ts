import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ApiCache extends BaseModel {
  static table = 'api_caches'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'request_url' })
  declare requestUrl: string

  @column({ columnName: 'response_data' })
  declare responseData: unknown

  @column.dateTime({ columnName: 'cached_at' })
  declare cachedAt: DateTime

  @column.dateTime({ columnName: 'expires_at' })
  declare expiresAt: DateTime
}
