import bcrypt from 'bcrypt';
import { db } from '../../src/db/index.js';
import { users, watchlists, watchlistItems } from '../../src/db/schema.js';

let counter = 0;

export interface CreateUserOptions {
  email?: string;
  username?: string;
  password?: string;
  language?: string;
}

export interface CreatedUser {
  id: string;
  email: string;
  username: string;
  plainPassword: string;
}

/**
 * Crée un user avec un email + username uniques.
 * Retourne l'user inséré + le mot de passe en clair (pour login dans le test).
 */
export async function createUser(opts: CreateUserOptions = {}): Promise<CreatedUser> {
  counter++;
  const password = opts.password ?? 'TestPassword123!';
  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(users)
    .values({
      email: opts.email ?? `test-${counter}-${Date.now()}@poplist.test`,
      username: opts.username ?? `test_user_${counter}_${Date.now()}`,
      passwordHash,
      language: opts.language ?? 'fr',
    })
    .returning();

  if (!user.username) throw new Error('createUser: username manquant après insert');

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    plainPassword: password,
  };
}

export interface CreateWatchlistOptions {
  name?: string;
  description?: string;
  isPublic?: boolean;
  genres?: string[];
}

export async function createWatchlist(ownerId: string, opts: CreateWatchlistOptions = {}) {
  const [wl] = await db
    .insert(watchlists)
    .values({
      ownerId,
      name: opts.name ?? `Test Watchlist ${++counter}`,
      description: opts.description ?? null,
      isPublic: opts.isPublic ?? true,
      genres: opts.genres ?? [],
    })
    .returning();
  return wl;
}

export interface CreateWatchlistItemOptions {
  tmdbId?: number;
  mediaType?: 'movie' | 'tv';
  title?: string;
  position?: number;
}

export async function createWatchlistItem(
  watchlistId: string,
  opts: CreateWatchlistItemOptions = {}
) {
  const [item] = await db
    .insert(watchlistItems)
    .values({
      watchlistId,
      tmdbId: opts.tmdbId ?? ++counter,
      mediaType: opts.mediaType ?? 'movie',
      title: opts.title ?? `Movie ${counter}`,
      position: opts.position ?? 0,
    })
    .returning();
  return item;
}
