import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_watchlist_positions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('watchlist_id')
        .notNullable()
        .references('id')
        .inTable('watchlists')
        .onDelete('CASCADE')
      table.integer('position').notNullable().defaultTo(0)
      table.timestamp('added_at').notNullable().defaultTo(this.now())

      table.primary(['user_id', 'watchlist_id'])
      table.index(['user_id', 'position'])
    })

    // Migrate existing data: add positions for owned watchlists
    this.defer(async (db) => {
      // Get all owned watchlists grouped by owner
      const ownedWatchlists = await db
        .from('watchlists')
        .select('id', 'owner_id', 'position', 'created_at')
        .orderBy('owner_id')
        .orderBy('position', 'asc')

      for (const watchlist of ownedWatchlists) {
        await db.table('user_watchlist_positions').insert({
          user_id: watchlist.owner_id,
          watchlist_id: watchlist.id,
          position: watchlist.position,
          added_at: watchlist.created_at,
        })
      }

      // Add positions for collaborative watchlists
      const collaborators = await db
        .from('watchlist_collaborators')
        .select('user_id', 'watchlist_id', 'added_at')

      for (const collab of collaborators) {
        // Get max position for this user
        const maxPos = await db
          .from('user_watchlist_positions')
          .where('user_id', collab.user_id)
          .max('position as max')
          .first()
        const newPosition = (maxPos?.max ?? -1) + 1

        await db.table('user_watchlist_positions').insert({
          user_id: collab.user_id,
          watchlist_id: collab.watchlist_id,
          position: newPosition,
          added_at: collab.added_at,
        })
      }

      // Add positions for saved watchlists
      const saved = await db.from('saved_watchlists').select('user_id', 'watchlist_id', 'saved_at')

      for (const save of saved) {
        // Check if already exists (might be owner or collaborator)
        const exists = await db
          .from('user_watchlist_positions')
          .where('user_id', save.user_id)
          .where('watchlist_id', save.watchlist_id)
          .first()

        if (!exists) {
          // Get max position for this user
          const maxPos = await db
            .from('user_watchlist_positions')
            .where('user_id', save.user_id)
            .max('position as max')
            .first()
          const newPosition = (maxPos?.max ?? -1) + 1

          await db.table('user_watchlist_positions').insert({
            user_id: save.user_id,
            watchlist_id: save.watchlist_id,
            position: newPosition,
            added_at: save.saved_at,
          })
        }
      }
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
