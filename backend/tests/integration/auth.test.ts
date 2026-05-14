import { beforeEach, describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

import app from '../../src/app.js';
import { db } from '../../src/db/index.js';
import { refreshTokens, users } from '../../src/db/schema.js';
import { resetDb } from '../helpers/db-reset.js';
import { createUser } from '../helpers/factories.js';
import { authedFetch, loginAndGetCookie } from '../helpers/auth.js';

const ORIGIN = 'http://localhost';

async function postJson(path: string, body: unknown, headers: Record<string, string> = {}) {
  return app.fetch(
    new Request(`${ORIGIN}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    })
  );
}

describe('POST /auth/signup', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('crée un nouveau user, retourne 201, pose les cookies et insère un refresh token', async () => {
    const res = await postJson('/auth/signup', {
      email: 'newbie@test.com',
      password: 'StrongPass123!',
    });
    expect(res.status).toBe(201);

    const body = (await res.json()) as { user: { id: string; email: string; username: string } };
    expect(body.user.email).toBe('newbie@test.com');
    expect(body.user.username).toBeTruthy();
    expect(body.user.id).toMatch(/^[0-9a-f-]{36}$/);

    const setCookies = res.headers.getSetCookie();
    expect(setCookies.some(c => c.startsWith('accessToken='))).toBe(true);
    expect(setCookies.some(c => c.startsWith('refreshToken='))).toBe(true);

    const [dbUser] = await db.select().from(users).where(eq(users.id, body.user.id));
    expect(dbUser.passwordHash).toBeTruthy();
    expect(await bcrypt.compare('StrongPass123!', dbUser.passwordHash!)).toBe(true);

    const tokens = await db.select().from(refreshTokens).where(eq(refreshTokens.userId, body.user.id));
    expect(tokens).toHaveLength(1);
  });

  it('retourne 409 si email déjà pris', async () => {
    await createUser({ email: 'taken@test.com' });

    const res = await postJson('/auth/signup', {
      email: 'taken@test.com',
      password: 'StrongPass123!',
    });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'User already exists' });
  });

  it('retourne 400 si email invalide', async () => {
    const res = await postJson('/auth/signup', {
      email: 'pas-un-email',
      password: 'StrongPass123!',
    });
    expect(res.status).toBe(400);
  });

  it('retourne 400 si password trop court (< 8)', async () => {
    const res = await postJson('/auth/signup', {
      email: 'short@test.com',
      password: 'short',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('retourne 200 + user + cookies avec credentials valides', async () => {
    const created = await createUser({ email: 'login@test.com', password: 'GoodPass123!' });

    const res = await postJson('/auth/login', {
      email: 'login@test.com',
      password: 'GoodPass123!',
    });
    expect(res.status).toBe(200);

    const body = (await res.json()) as { user: { id: string; email: string } };
    expect(body.user.id).toBe(created.id);
    expect(body.user.email).toBe('login@test.com');

    const setCookies = res.headers.getSetCookie();
    expect(setCookies.some(c => c.startsWith('accessToken='))).toBe(true);
    expect(setCookies.some(c => c.startsWith('refreshToken='))).toBe(true);
  });

  it('retourne 401 si email inexistant', async () => {
    const res = await postJson('/auth/login', {
      email: 'ghost@test.com',
      password: 'Whatever123!',
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Invalid credentials' });
  });

  it('retourne 401 si mauvais password', async () => {
    await createUser({ email: 'login2@test.com', password: 'RightPass123!' });

    const res = await postJson('/auth/login', {
      email: 'login2@test.com',
      password: 'WrongPass123!',
    });
    expect(res.status).toBe(401);
  });

  it('retourne 401 pour un user OAuth (passwordHash null)', async () => {
    await db.insert(users).values({
      email: 'oauth@test.com',
      username: 'oauthuser',
      googleId: 'google-123',
      passwordHash: null,
    });

    const res = await postJson('/auth/login', {
      email: 'oauth@test.com',
      password: 'Whatever123!',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /auth/me', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('retourne 200 + user info avec cookie valide', async () => {
    const created = await createUser({ email: 'me@test.com' });
    const cookie = await loginAndGetCookie(created.email, created.plainPassword);

    const res = await authedFetch('/auth/me', cookie);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { user: { email: string; username: string; hasPassword: boolean } };
    expect(body.user.email).toBe('me@test.com');
    expect(body.user.hasPassword).toBe(true);
  });

  it('retourne 401 sans cookie', async () => {
    const res = await app.fetch(new Request(`${ORIGIN}/auth/me`));
    expect(res.status).toBe(401);
  });

  it('retourne 401 avec un access token bidon', async () => {
    const res = await app.fetch(
      new Request(`${ORIGIN}/auth/me`, {
        headers: { Cookie: 'accessToken=not-a-real-jwt' },
      })
    );
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/refresh', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('rotation : retourne nouveaux cookies et invalide l\'ancien refresh token', async () => {
    const created = await createUser();
    const cookie = await loginAndGetCookie(created.email, created.plainPassword);

    const [oldToken] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, created.id));
    expect(oldToken).toBeTruthy();

    const res = await postJson('/auth/refresh', {}, { Cookie: cookie });
    expect(res.status).toBe(200);

    const newCookies = res.headers.getSetCookie();
    expect(newCookies.some(c => c.startsWith('accessToken='))).toBe(true);
    expect(newCookies.some(c => c.startsWith('refreshToken='))).toBe(true);

    const tokens = await db.select().from(refreshTokens).where(eq(refreshTokens.userId, created.id));
    expect(tokens).toHaveLength(1);
    expect(tokens[0].id).not.toBe(oldToken.id);
  });

  it('retourne 401 sans cookie', async () => {
    const res = await postJson('/auth/refresh', {});
    expect(res.status).toBe(401);
  });

  it('retourne 401 si refresh token mal formé', async () => {
    const res = await postJson('/auth/refresh', {}, { Cookie: 'refreshToken=bogus' });
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('supprime le refresh token de la DB et clear les cookies', async () => {
    const created = await createUser();
    const cookie = await loginAndGetCookie(created.email, created.plainPassword);

    const before = await db.select().from(refreshTokens).where(eq(refreshTokens.userId, created.id));
    expect(before).toHaveLength(1);

    const res = await postJson('/auth/logout', {}, { Cookie: cookie });
    expect(res.status).toBe(200);

    const setCookies = res.headers.getSetCookie();
    expect(setCookies.some(c => /accessToken=;|accessToken=\s*;/.test(c))).toBe(true);

    const after = await db.select().from(refreshTokens).where(eq(refreshTokens.userId, created.id));
    expect(after).toHaveLength(0);
  });

  it('idempotent : 200 même sans cookie', async () => {
    const res = await postJson('/auth/logout', {});
    expect(res.status).toBe(200);
  });
});

describe('GET /auth/username/check/:username', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('retourne available: true pour un username libre', async () => {
    const res = await app.fetch(new Request(`${ORIGIN}/auth/username/check/freebie`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ available: true, username: 'freebie' });
  });

  it('retourne available: false si username pris', async () => {
    await createUser({ username: 'taken_name' });
    const res = await app.fetch(new Request(`${ORIGIN}/auth/username/check/taken_name`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ available: false, username: 'taken_name' });
  });

  it('retourne 400 si username trop court', async () => {
    const res = await app.fetch(new Request(`${ORIGIN}/auth/username/check/ab`));
    expect(res.status).toBe(400);
  });

  it('retourne 400 avec caractères interdits', async () => {
    const res = await app.fetch(new Request(`${ORIGIN}/auth/username/check/bad-name!`));
    expect(res.status).toBe(400);
  });
});

describe('PUT /auth/profile/username', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('met à jour le username du user authentifié', async () => {
    const created = await createUser();
    const cookie = await loginAndGetCookie(created.email, created.plainPassword);

    const res = await authedFetch('/auth/profile/username', cookie, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'new_handle' }),
    });
    expect(res.status).toBe(200);

    const [dbUser] = await db.select().from(users).where(eq(users.id, created.id));
    expect(dbUser.username).toBe('new_handle');
  });

  it('retourne 409 si username déjà pris par un autre user', async () => {
    await createUser({ username: 'already_taken' });
    const other = await createUser();
    const cookie = await loginAndGetCookie(other.email, other.plainPassword);

    const res = await authedFetch('/auth/profile/username', cookie, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'already_taken' }),
    });
    expect(res.status).toBe(409);
  });

  it('retourne 401 sans auth', async () => {
    const res = await app.fetch(
      new Request(`${ORIGIN}/auth/profile/username`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'anything' }),
      })
    );
    expect(res.status).toBe(401);
  });
});

describe('PUT /auth/profile/password', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('change le password, permet de relogin avec le nouveau', async () => {
    const created = await createUser({ password: 'OldPass123!' });
    const cookie = await loginAndGetCookie(created.email, 'OldPass123!');

    const res = await authedFetch('/auth/profile/password', cookie, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword: 'OldPass123!', newPassword: 'NewPass123!' }),
    });
    expect(res.status).toBe(200);

    const loginOld = await postJson('/auth/login', { email: created.email, password: 'OldPass123!' });
    expect(loginOld.status).toBe(401);

    const loginNew = await postJson('/auth/login', { email: created.email, password: 'NewPass123!' });
    expect(loginNew.status).toBe(200);
  });

  it('retourne 401 si oldPassword incorrect', async () => {
    const created = await createUser({ password: 'RealPass123!' });
    const cookie = await loginAndGetCookie(created.email, 'RealPass123!');

    const res = await authedFetch('/auth/profile/password', cookie, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword: 'WrongOld!', newPassword: 'NewPass123!' }),
    });
    expect(res.status).toBe(401);
  });
});

describe('PUT /auth/profile/language', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('met à jour la langue', async () => {
    const created = await createUser({ language: 'fr' });
    const cookie = await loginAndGetCookie(created.email, created.plainPassword);

    const res = await authedFetch('/auth/profile/language', cookie, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'en' }),
    });
    expect(res.status).toBe(200);

    const [dbUser] = await db.select().from(users).where(eq(users.id, created.id));
    expect(dbUser.language).toBe('en');
  });

  it('retourne 400 pour une langue non supportée', async () => {
    const created = await createUser();
    const cookie = await loginAndGetCookie(created.email, created.plainPassword);

    const res = await authedFetch('/auth/profile/language', cookie, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'xx' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /auth/profile/account', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('supprime le user, ses refresh tokens, et le re-login devient impossible', async () => {
    const created = await createUser();
    const cookie = await loginAndGetCookie(created.email, created.plainPassword);

    const res = await authedFetch('/auth/profile/account', cookie, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation: 'confirmer' }),
    });
    expect(res.status).toBe(200);

    const remaining = await db.select().from(users).where(eq(users.id, created.id));
    expect(remaining).toHaveLength(0);

    const tokens = await db.select().from(refreshTokens).where(eq(refreshTokens.userId, created.id));
    expect(tokens).toHaveLength(0);

    const loginAttempt = await postJson('/auth/login', {
      email: created.email,
      password: created.plainPassword,
    });
    expect(loginAttempt.status).toBe(401);
  });

  it('retourne 400 si confirmation incorrecte', async () => {
    const created = await createUser();
    const cookie = await loginAndGetCookie(created.email, created.plainPassword);

    const res = await authedFetch('/auth/profile/account', cookie, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation: 'pas le bon mot' }),
    });
    expect(res.status).toBe(400);
  });

  it('retourne 401 sans auth', async () => {
    const res = await app.fetch(
      new Request(`${ORIGIN}/auth/profile/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'confirmer' }),
      })
    );
    expect(res.status).toBe(401);
  });
});
