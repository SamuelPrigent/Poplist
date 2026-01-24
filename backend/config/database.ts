import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbType = env.get('DB_TYPE') || 'local'
const neonDb = env.get('NEON_DB')

// Use Neon DB when DB_TYPE=neon, local Postgres otherwise
const connectionConfig = dbType === 'neon' && neonDb
  ? {
      // Append libpq compatibility flag to avoid SSL warning
      connectionString: neonDb.includes('uselibpqcompat')
        ? neonDb
        : neonDb.replace('sslmode=require', 'sslmode=require&uselibpqcompat=true'),
    }
  : {
      host: env.get('DB_HOST') || '127.0.0.1',
      port: env.get('DB_PORT') || 5432,
      user: env.get('DB_USER') || 'postgres',
      password: env.get('DB_PASSWORD') || '',
      database: env.get('DB_DATABASE') || 'poplist-db',
    }

const dbConfig = defineConfig({
  connection: 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      connection: connectionConfig,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
