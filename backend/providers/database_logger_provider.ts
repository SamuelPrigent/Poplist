import type { ApplicationService } from '@adonisjs/core/types'

export default class DatabaseLoggerProvider {
  constructor(protected app: ApplicationService) {}

  async ready() {
    const port = process.env.PORT || 3456
    const host = process.env.HOST || 'localhost'
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3001'
    const dbType = process.env.DB_TYPE || 'local'
    const neonDb = process.env.NEON_DB

    try {
      // Import db service after app is ready
      const dbModule = await import('@adonisjs/lucid/services/db')
      const db = dbModule.default

      // Test database connection
      await db.rawQuery('SELECT 1')

      // Determine database info for display
      let dbInfo: string
      if (dbType === 'neon' && neonDb) {
        // Extract host from Neon connection string
        const match = neonDb.match(/@([^/]+)\/([^?]+)/)
        const neonHost = match ? match[1] : 'neon'
        const neonDbName = match ? match[2] : 'neondb'
        dbInfo = `${neonDbName}@${neonHost} (Neon)`
      } else {
        const dbName = process.env.DB_DATABASE || 'poplist-db'
        const dbHost = process.env.DB_HOST || '127.0.0.1'
        dbInfo = `${dbName}@${dbHost} (local)`
      }

      console.log('')
      console.log(`✅ Connected to PostgreSQL (${dbInfo})`)
      console.log(`🚀 Server running on http://${host}:${port}`)
      console.log(`📱 Client URL: ${clientUrl}`)
      console.log('')
    } catch (error) {
      console.error('')
      console.error('❌ PostgreSQL connection error:', error)
      console.error('')
      throw error
    }
  }

  async shutdown() {
    try {
      const dbModule = await import('@adonisjs/lucid/services/db')
      await dbModule.default.manager.closeAll()
      console.log('🔌 Disconnected from PostgreSQL')
    } catch {
      // Ignore errors during shutdown
    }
  }
}
