import { beforeEach, describe, expect, it } from 'vitest';

import app from '../../src/app.js';
import { db } from '../../src/db/index.js';
import { watchlistCollaborators } from '../../src/db/schema.js';
import { resetDb } from '../helpers/db-reset.js';
import { authCookie, authedFetch } from '../helpers/auth.js';
import {
  createUser,
  createWatchlist,
  createWatchlistItem,
  type CreatedUser,
} from '../helpers/factories.js';

const ORIGIN = 'http://localhost';
const RANDOM_UUID = '00000000-0000-4000-8000-000000000000';
const VALID_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';

async function anon(path: string, init: RequestInit = {}): Promise<Response> {
  return app.fetch(new Request(`${ORIGIN}${path}`, init));
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
});

async function cookieFor(user: CreatedUser): Promise<string> {
  return authCookie(user);
}

async function makeCollaborator(watchlistId: string, userId: string): Promise<void> {
  await db.insert(watchlistCollaborators).values({ watchlistId, userId });
}

describe('Watchlists — autorisations (owner / collaborateur / non-owner / anonyme)', () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ========================================================================
  // Auth requise (401) sur les routes protégées
  // ========================================================================
  describe('Auth requise → 401 sans cookie', () => {
    it('GET /watchlists/mine', async () => {
      expect((await anon('/watchlists/mine')).status).toBe(401);
    });
    it('POST /watchlists', async () => {
      expect((await anon('/watchlists', json('POST', { name: 'X' }))).status).toBe(401);
    });
    it('GET /watchlists/:id', async () => {
      const owner = await createUser();
      const wl = await createWatchlist(owner.id, { isPublic: true });
      expect((await anon(`/watchlists/${wl.id}`)).status).toBe(401);
    });
    it('PUT /watchlists/:id', async () => {
      const owner = await createUser();
      const wl = await createWatchlist(owner.id);
      expect((await anon(`/watchlists/${wl.id}`, json('PUT', { name: 'Y' }))).status).toBe(401);
    });
    it('DELETE /watchlists/:id', async () => {
      const owner = await createUser();
      const wl = await createWatchlist(owner.id);
      expect((await anon(`/watchlists/${wl.id}`, json('DELETE'))).status).toBe(401);
    });
    it('POST /watchlists/:id/items', async () => {
      const owner = await createUser();
      const wl = await createWatchlist(owner.id);
      const res = await anon(
        `/watchlists/${wl.id}/items`,
        json('POST', { tmdbId: '1000', mediaType: 'movie' }),
      );
      expect(res.status).toBe(401);
    });
  });

  // ========================================================================
  // Visibilité d'une liste privée
  // ========================================================================
  describe('Liste privée', () => {
    it('GET /watchlists/public/:id (privée) → 403, même contenu inaccessible', async () => {
      const owner = await createUser();
      const wl = await createWatchlist(owner.id, { isPublic: false });
      const res = await anon(`/watchlists/public/${wl.id}`);
      expect(res.status).toBe(403);
    });

    it('GET /watchlists/:id (privée) par un NON-owner → 403', async () => {
      const owner = await createUser();
      const intruder = await createUser();
      const wl = await createWatchlist(owner.id, { isPublic: false });
      const res = await authedFetch(`/watchlists/${wl.id}`, await cookieFor(intruder));
      expect(res.status).toBe(403);
    });

    it('GET /watchlists/:id (privée) par le OWNER → 200', async () => {
      const owner = await createUser();
      const wl = await createWatchlist(owner.id, { isPublic: false });
      const res = await authedFetch(`/watchlists/${wl.id}`, await cookieFor(owner));
      expect(res.status).toBe(200);
    });
  });

  // ========================================================================
  // Liste publique : lisible par tous
  // ========================================================================
  describe('Liste publique', () => {
    it('GET /watchlists/public/:id (publique) → 200', async () => {
      const owner = await createUser();
      const wl = await createWatchlist(owner.id, { isPublic: true });
      expect((await anon(`/watchlists/public/${wl.id}`)).status).toBe(200);
    });

    it('GET /watchlists/:id (publique) par un NON-owner connecté → 200', async () => {
      const owner = await createUser();
      const viewer = await createUser();
      const wl = await createWatchlist(owner.id, { isPublic: true });
      const res = await authedFetch(`/watchlists/${wl.id}`, await cookieFor(viewer));
      expect(res.status).toBe(200);
      const body = (await res.json()) as { isOwner: boolean; isCollaborator: boolean };
      expect(body.isOwner).toBe(false);
      expect(body.isCollaborator).toBe(false);
    });
  });

  // ========================================================================
  // Mutations interdites au NON-owner (403)
  // ========================================================================
  describe('Non-owner → 403 sur les mutations', () => {
    let owner: CreatedUser;
    let intruderCookie: string;
    let wlId: string;

    beforeEach(async () => {
      owner = await createUser();
      const intruder = await createUser();
      intruderCookie = await cookieFor(intruder);
      const wl = await createWatchlist(owner.id, { isPublic: true });
      wlId = wl.id;
      await createWatchlistItem(wlId, { tmdbId: 1000 });
    });

    it('PUT /watchlists/:id', async () => {
      const res = await authedFetch(
        `/watchlists/${wlId}`,
        intruderCookie,
        json('PUT', { name: 'Hack' }),
      );
      expect(res.status).toBe(403);
    });
    it('DELETE /watchlists/:id', async () => {
      expect(
        (await authedFetch(`/watchlists/${wlId}`, intruderCookie, json('DELETE'))).status,
      ).toBe(403);
    });
    it('POST /watchlists/:id/items', async () => {
      const res = await authedFetch(
        `/watchlists/${wlId}/items`,
        intruderCookie,
        json('POST', { tmdbId: '2000', mediaType: 'movie' }),
      );
      expect(res.status).toBe(403);
    });
    it('DELETE /watchlists/:id/items/:tmdbId', async () => {
      expect(
        (await authedFetch(`/watchlists/${wlId}/items/1000`, intruderCookie, json('DELETE')))
          .status,
      ).toBe(403);
    });
    it('POST /watchlists/:id/collaborators (owner-only)', async () => {
      const res = await authedFetch(
        `/watchlists/${wlId}/collaborators`,
        intruderCookie,
        json('POST', { username: 'whoever' }),
      );
      expect(res.status).toBe(403);
    });
    it('POST /watchlists/:id/upload-cover (owner-only)', async () => {
      const res = await authedFetch(
        `/watchlists/${wlId}/upload-cover`,
        intruderCookie,
        json('POST', { imageData: VALID_IMAGE }),
      );
      expect(res.status).toBe(403);
    });
  });

  // ========================================================================
  // Owner : autorisé (200)
  // ========================================================================
  describe('Owner → autorisé', () => {
    it('PUT /watchlists/:id met à jour', async () => {
      const owner = await createUser();
      const wl = await createWatchlist(owner.id);
      const res = await authedFetch(
        `/watchlists/${wl.id}`,
        await cookieFor(owner),
        json('PUT', { name: 'Renamed' }),
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { watchlist: { name: string } };
      expect(body.watchlist.name).toBe('Renamed');
    });

    it('POST /watchlists/:id/items ajoute (TMDB mocké)', async () => {
      const owner = await createUser();
      const wl = await createWatchlist(owner.id);
      const res = await authedFetch(
        `/watchlists/${wl.id}/items`,
        await cookieFor(owner),
        json('POST', { tmdbId: '1000', mediaType: 'movie' }),
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        watchlist: { items: Array<{ tmdbId: number }> };
      };
      expect(body.watchlist.items.some((i) => i.tmdbId === 1000)).toBe(true);
    });

    it('DELETE /watchlists/:id supprime', async () => {
      const owner = await createUser();
      const wl = await createWatchlist(owner.id);
      expect(
        (await authedFetch(`/watchlists/${wl.id}`, await cookieFor(owner), json('DELETE'))).status,
      ).toBe(200);
    });
  });

  // ========================================================================
  // Collaborateur : peut éditer, mais pas les actions owner-only
  // ========================================================================
  describe('Collaborateur', () => {
    let owner: CreatedUser;
    let collabCookie: string;
    let wlId: string;

    beforeEach(async () => {
      owner = await createUser();
      const collab = await createUser();
      collabCookie = await cookieFor(collab);
      const wl = await createWatchlist(owner.id, { isPublic: false });
      wlId = wl.id;
      await makeCollaborator(wlId, collab.id);
    });

    it('GET /watchlists/:id (privée) → 200 + isCollaborator true', async () => {
      const res = await authedFetch(`/watchlists/${wlId}`, collabCookie);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { isOwner: boolean; isCollaborator: boolean };
      expect(body.isOwner).toBe(false);
      expect(body.isCollaborator).toBe(true);
    });
    it('PUT /watchlists/:id → 200 (peut éditer)', async () => {
      expect(
        (
          await authedFetch(
            `/watchlists/${wlId}`,
            collabCookie,
            json('PUT', { name: 'Collab edit' }),
          )
        ).status,
      ).toBe(200);
    });
    it('POST /watchlists/:id/items → 200 (peut ajouter)', async () => {
      const res = await authedFetch(
        `/watchlists/${wlId}/items`,
        collabCookie,
        json('POST', { tmdbId: '1000', mediaType: 'movie' }),
      );
      expect(res.status).toBe(200);
    });
    it('DELETE /watchlists/:id → 403 (suppression owner-only)', async () => {
      expect((await authedFetch(`/watchlists/${wlId}`, collabCookie, json('DELETE'))).status).toBe(
        403,
      );
    });
    it('POST /watchlists/:id/upload-cover → 403 (owner-only)', async () => {
      const res = await authedFetch(
        `/watchlists/${wlId}/upload-cover`,
        collabCookie,
        json('POST', { imageData: VALID_IMAGE }),
      );
      expect(res.status).toBe(403);
    });
  });

  // ========================================================================
  // Recommandations : public OU owner/collab
  // ========================================================================
  describe('GET /watchlists/:id/recommendations', () => {
    it('liste privée, NON-owner → 403', async () => {
      const owner = await createUser();
      const intruder = await createUser();
      const wl = await createWatchlist(owner.id, { isPublic: false });
      await createWatchlistItem(wl.id, { tmdbId: 1000 });
      const res = await authedFetch(
        `/watchlists/${wl.id}/recommendations`,
        await cookieFor(intruder),
      );
      expect(res.status).toBe(403);
    });
    it('liste publique, anonyme → 200', async () => {
      const owner = await createUser();
      const wl = await createWatchlist(owner.id, { isPublic: true });
      await createWatchlistItem(wl.id, { tmdbId: 1000, mediaType: 'movie' });
      const res = await anon(`/watchlists/${wl.id}/recommendations`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { items: unknown[]; generatedAt: string };
      expect(Array.isArray(body.items)).toBe(true);
      expect(typeof body.generatedAt).toBe('string');
    });
    it('liste privée, owner → 200', async () => {
      const owner = await createUser();
      const wl = await createWatchlist(owner.id, { isPublic: false });
      await createWatchlistItem(wl.id, { tmdbId: 1000, mediaType: 'movie' });
      const res = await authedFetch(`/watchlists/${wl.id}/recommendations`, await cookieFor(owner));
      expect(res.status).toBe(200);
    });
  });

  // ========================================================================
  // /mine : isolation entre users + format
  // ========================================================================
  describe('GET /watchlists/mine', () => {
    it('ne renvoie que MES listes (pas celles des autres)', async () => {
      const me = await createUser();
      const other = await createUser();
      const mine = await createWatchlist(me.id, { name: 'A moi' });
      await createWatchlist(other.id, { name: 'A un autre' });

      const res = await authedFetch('/watchlists/mine', await cookieFor(me));
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        watchlists: Array<{ id: string; isOwner: boolean }>;
      };
      expect(body.watchlists).toHaveLength(1);
      expect(body.watchlists[0].id).toBe(mine.id);
      expect(body.watchlists[0].isOwner).toBe(true);
    });
  });

  // ========================================================================
  // 404 : id inexistant / invalide
  // ========================================================================
  describe('404 / id invalide', () => {
    it('GET /watchlists/:id inexistant → 404', async () => {
      const user = await createUser();
      expect((await authedFetch(`/watchlists/${RANDOM_UUID}`, await cookieFor(user))).status).toBe(
        404,
      );
    });
    it('GET /watchlists/public/:id inexistant → 404', async () => {
      expect((await anon(`/watchlists/public/${RANDOM_UUID}`)).status).toBe(404);
    });
    it('GET /watchlists/:id avec id offline → 404', async () => {
      const user = await createUser();
      expect((await authedFetch('/watchlists/offline-abc', await cookieFor(user))).status).toBe(
        404,
      );
    });
  });

  // ========================================================================
  // Format de réponse (pragmatique : champs clés + types)
  // ========================================================================
  describe('Format de réponse', () => {
    it('GET /watchlists/:id renvoie { watchlist, isSaved, isOwner, isCollaborator }', async () => {
      const owner = await createUser();
      const wl = await createWatchlist(owner.id, { isPublic: true });
      await createWatchlistItem(wl.id, { tmdbId: 1000, title: 'Film 1' });

      const res = await authedFetch(`/watchlists/${wl.id}`, await cookieFor(owner));
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        watchlist: {
          id: string;
          name: string;
          isPublic: boolean;
          items: Array<{ tmdbId: number; title: string | null }>;
        };
        isSaved: boolean;
        isOwner: boolean;
        isCollaborator: boolean;
      };
      expect(body.watchlist.id).toBe(wl.id);
      expect(typeof body.watchlist.name).toBe('string');
      expect(body.watchlist.isPublic).toBe(true);
      expect(Array.isArray(body.watchlist.items)).toBe(true);
      expect(body.watchlist.items[0].tmdbId).toBe(1000);
      expect(typeof body.isSaved).toBe('boolean');
      expect(body.isOwner).toBe(true);
      expect(typeof body.isCollaborator).toBe('boolean');
    });
  });
});
