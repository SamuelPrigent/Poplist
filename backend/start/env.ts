import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum.optional(['development', 'production', 'test'] as const),
  PORT: Env.schema.number.optional(),
  APP_KEY: Env.schema.string.optional(),
  HOST: Env.schema.string.optional({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum.optional([
    'fatal',
    'error',
    'warn',
    'info',
    'debug',
    'trace',
    'silent',
  ]),

  // MongoDB (deprecated - kept for backward compatibility)
  MONGODB_URI: Env.schema.string.optional(),

  // Auth
  JWT_ACCESS_SECRET: Env.schema.string(),
  JWT_REFRESH_SECRET: Env.schema.string(),

  // Google OAuth
  GOOGLE_CLIENT_ID: Env.schema.string(),
  GOOGLE_CLIENT_SECRET: Env.schema.string(),
  GOOGLE_REDIRECT_URI: Env.schema.string.optional(),

  // Cloudinary
  CLOUDINARY_URL: Env.schema.string(),

  // TMDB
  TMDB_API: Env.schema.string(),

  // Frontend
  CLIENT_URL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  // Database type: 'local' for local PostgreSQL, 'neon' for Neon DB
  DB_TYPE: Env.schema.enum.optional(['local', 'neon'] as const),

  // Neon DB
  NEON_DB: Env.schema.string.optional(),

  // Local Postgres
  DB_HOST: Env.schema.string.optional({ format: 'host' }),
  DB_PORT: Env.schema.number.optional(),
  DB_USER: Env.schema.string.optional(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string.optional()
})
