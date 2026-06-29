import { beforeEach, describe, expect, it } from 'vitest';

import app from '../../src/app.js';
import { resetDb } from '../helpers/db-reset.js';

const ORIGIN = 'http://localhost';

async function get(path: string): Promise<Response> {
  return app.fetch(new Request(`${ORIGIN}${path}`));
}

describe('TMDB — /tmdb/* (proxies publics, TMDB mocké via MSW)', () => {
  beforeEach(async () => {
    // Vide aussi api_caches → chaque test tape le mock MSW frais (pas le cache DB).
    await resetDb();
  });

  describe('Format liste paginée { results, page, total_pages, total_results }', () => {
    it('GET /tmdb/discover/movie → 200 + results[]', async () => {
      const res = await get('/tmdb/discover/movie');
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        results: unknown[];
        page: number;
        total_pages: number;
        total_results: number;
      };
      expect(Array.isArray(body.results)).toBe(true);
      expect(body.results.length).toBeGreaterThan(0);
      expect(typeof body.page).toBe('number');
      expect(typeof body.total_pages).toBe('number');
      expect(typeof body.total_results).toBe('number');
    });

    it('GET /tmdb/trending/day → 200 + shape liste', async () => {
      const res = await get('/tmdb/trending/day');
      expect(res.status).toBe(200);
      const body = (await res.json()) as { results: unknown[]; page: number };
      expect(Array.isArray(body.results)).toBe(true);
      expect(typeof body.page).toBe('number');
    });

    it('GET /tmdb/movie/123/similar → 200 + results[]', async () => {
      const res = await get('/tmdb/movie/123/similar');
      expect(res.status).toBe(200);
      const body = (await res.json()) as { results: unknown[] };
      expect(Array.isArray(body.results)).toBe(true);
    });

    it('GET /tmdb/search/movie?query=test → 200 + results[]', async () => {
      const res = await get('/tmdb/search/movie?query=test');
      expect(res.status).toBe(200);
      const body = (await res.json()) as { results: unknown[] };
      expect(Array.isArray(body.results)).toBe(true);
    });
  });

  describe('Autres formats', () => {
    it('GET /tmdb/genre/movie/list → 200 + genres[]', async () => {
      const res = await get('/tmdb/genre/movie/list');
      expect(res.status).toBe(200);
      const body = (await res.json()) as { genres: Array<{ id: number; name: string }> };
      expect(Array.isArray(body.genres)).toBe(true);
      expect(body.genres[0]).toHaveProperty('name');
    });

    it('GET /tmdb/movie/123/providers → 200 + results (objet par région)', async () => {
      const res = await get('/tmdb/movie/123/providers');
      expect(res.status).toBe(200);
      const body = (await res.json()) as { results: Record<string, unknown> };
      expect(typeof body.results).toBe('object');
    });
  });

  describe('Validation → 400', () => {
    it('GET /tmdb/trending/badwindow → 400', async () => {
      expect((await get('/tmdb/trending/badwindow')).status).toBe(400);
    });
    it('GET /tmdb/discover/badtype → 400', async () => {
      expect((await get('/tmdb/discover/badtype')).status).toBe(400);
    });
    it('GET /tmdb/search/movie sans query → 400', async () => {
      expect((await get('/tmdb/search/movie')).status).toBe(400);
    });
  });
});
