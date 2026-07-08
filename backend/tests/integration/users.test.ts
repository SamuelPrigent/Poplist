import { beforeEach, describe, expect, it } from 'vitest';

import app from '../../src/app.js';
import { resetDb } from '../helpers/db-reset.js';
import { authCookie, authedFetch } from '../helpers/auth.js';
import { createUser, createWatchlist } from '../helpers/factories.js';

const ORIGIN = 'http://localhost';
const VALID_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';

async function anon(path: string, init: RequestInit = {}): Promise<Response> {
  return app.fetch(new Request(`${ORIGIN}${path}`, init));
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
});

describe('Users — /user/*', () => {
  beforeEach(async () => {
    await resetDb();
  });

  describe('GET /user/profile (auth)', () => {
    it('401 sans cookie', async () => {
      expect((await anon('/user/profile')).status).toBe(401);
    });

    it('200 + format { user: { id, email, username, avatarUrl, language, createdAt } }', async () => {
      const u = await createUser({ email: 'me@test.com' });
      const res = await authedFetch('/user/profile', authCookie(u));
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        user: {
          id: string;
          email: string;
          username: string | null;
          avatarUrl: string | null;
          language: string | null;
          createdAt: string | null;
        };
      };
      expect(body.user.id).toBe(u.id);
      expect(body.user.email).toBe('me@test.com');
      expect(typeof body.user.username).toBe('string');
      expect('avatarUrl' in body.user).toBe(true);
      expect('language' in body.user).toBe(true);
      expect('createdAt' in body.user).toBe(true);
    });
  });

  describe('GET /user/profile/:username (public)', () => {
    it('404 si username inexistant', async () => {
      expect((await anon('/user/profile/ghost_user')).status).toBe(404);
    });

    it('200 + renvoie les listes du user', async () => {
      const u = await createUser({ username: 'publicguy' });
      await createWatchlist(u.id, { name: 'Liste A' });
      await createWatchlist(u.id, { name: 'Liste B' });

      const res = await anon('/user/profile/publicguy');
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        user: { id: string; username: string | null; avatarUrl: string | null };
        watchlists: Array<{ name: string }>;
        totalPublicWatchlists: number;
      };
      expect(body.user.username).toBe('publicguy');
      expect(body.watchlists).toHaveLength(2);
      expect(body.totalPublicWatchlists).toBe(2);
    });
  });

  describe('POST /user/upload-avatar (auth, Cloudinary mocké)', () => {
    it('401 sans cookie', async () => {
      const res = await anon('/user/upload-avatar', json('POST', { imageData: VALID_IMAGE }));
      expect(res.status).toBe(401);
    });

    it('400 si imageData invalide (pas data:image/)', async () => {
      const u = await createUser();
      const res = await authedFetch(
        '/user/upload-avatar',
        authCookie(u),
        json('POST', { imageData: 'pas-une-image' }),
      );
      expect(res.status).toBe(400);
    });

    it('200 + avatarUrl Cloudinary avec auth', async () => {
      const u = await createUser();
      const res = await authedFetch(
        '/user/upload-avatar',
        authCookie(u),
        json('POST', { imageData: VALID_IMAGE }),
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        user: { avatarUrl: string | null };
        avatarUrl: string;
      };
      expect(body.avatarUrl).toContain('cloudinary');
      expect(body.user.avatarUrl).toContain('cloudinary');
    });
  });

  describe('DELETE /user/avatar (auth)', () => {
    it('401 sans cookie', async () => {
      expect((await anon('/user/avatar', json('DELETE'))).status).toBe(401);
    });

    it("404 si pas d'avatar", async () => {
      const u = await createUser();
      expect((await authedFetch('/user/avatar', authCookie(u), json('DELETE'))).status).toBe(404);
    });

    it('200 + avatarUrl null après suppression', async () => {
      const u = await createUser();
      await authedFetch(
        '/user/upload-avatar',
        authCookie(u),
        json('POST', { imageData: VALID_IMAGE }),
      );
      const res = await authedFetch('/user/avatar', authCookie(u), json('DELETE'));
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        message: string;
        user: { avatarUrl: string | null };
      };
      expect(body.user.avatarUrl).toBeNull();
    });
  });
});
