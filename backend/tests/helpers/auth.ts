import app from '../../src/app.js';
import { signAccessToken } from '../../src/services/jwt.service.js';

/**
 * Forge un cookie d'auth valide SANS passer par /auth/login (rapide).
 * Le middleware `auth` vérifie quand même réellement le token (secret de test) ;
 * on saute juste le coût du login (bcrypt + round-trip) pour tester les
 * endpoints protégés.
 */
export function authCookie(user: { id: string; email: string }): string {
  return `accessToken=${signAccessToken({ sub: user.id, email: user.email })}`;
}

/**
 * Login via la route HTTP réelle, retourne le header `Cookie` à réinjecter
 * dans les requêtes suivantes du même test. (Pour tester le flow de login
 * lui-même ; sinon préférer `authCookie` plus rapide.)
 */
export async function loginAndGetCookie(email: string, password: string): Promise<string> {
  const res = await app.fetch(
    new Request('http://localhost/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  );

  if (res.status !== 200) {
    const body = await res.text();
    throw new Error(`Login failed (${res.status}): ${body}`);
  }

  const setCookies = res.headers.getSetCookie();
  if (setCookies.length === 0) {
    throw new Error('Login response missing Set-Cookie header');
  }

  // Extrait juste les "name=value" de chaque Set-Cookie pour les recombiner en single header Cookie
  return setCookies.map(c => c.split(';')[0]).join('; ');
}

/**
 * Helper pratique : fait une requête authentifiée avec le cookie posé.
 */
export async function authedFetch(
  url: string,
  cookie: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Cookie', cookie);
  return app.fetch(
    new Request(`http://localhost${url.startsWith('/') ? url : `/${url}`}`, {
      ...init,
      headers,
    })
  );
}
