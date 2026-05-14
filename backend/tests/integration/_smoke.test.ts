/**
 * Smoke test : valide que le pipeline tests d'intégration tourne.
 * - DB joignable (poplist-db-test)
 * - Helpers fonctionnent (resetDb, createUser, loginAndGetCookie)
 * - Hono `app.fetch` répond
 *
 * Ne couvre AUCUNE règle métier. C'est juste là pour valider la fondation.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { resetDb } from '../helpers/db-reset.js';
import { createUser } from '../helpers/factories.js';
import { authedFetch, loginAndGetCookie } from '../helpers/auth.js';

describe('[smoke] integration pipeline', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('hono répond sur /health sans cookie', async () => {
    const res = await app.fetch(new Request('http://localhost/health'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('ok');
  });

  it('crée un user, login, et /auth/me retourne ses infos', async () => {
    const created = await createUser({ username: 'smoke_user' });

    const cookie = await loginAndGetCookie(created.email, created.plainPassword);
    expect(cookie).toContain('accessToken=');

    const me = await authedFetch('/auth/me', cookie);
    expect(me.status).toBe(200);
    const body = (await me.json()) as { user: { email: string; username: string } };
    expect(body.user.email).toBe(created.email);
    expect(body.user.username).toBe('smoke_user');
  });
});
