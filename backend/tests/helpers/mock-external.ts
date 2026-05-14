import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

/**
 * Mocks pour tous les services externes appelés par le backend.
 * `onUnhandledRequest: 'error'` dans setup.ts garantit qu'un appel non mocké throw.
 *
 * Chaque test peut surcharger un handler avec `server.use(http.get(...))`
 * (réinitialisé entre tests via `server.resetHandlers()`).
 */

// ============================================
// TMDB API (https://api.themoviedb.org/3/...)
// ============================================
const TMDB_BASE = 'https://api.themoviedb.org/3';

const tmdbHandlers = [
  // Discover (movies / tv)
  http.get(`${TMDB_BASE}/discover/:type`, ({ params }) => {
    const isMovie = params.type === 'movie';
    return HttpResponse.json({
      page: 1,
      results: Array.from({ length: 20 }, (_, i) => ({
        id: 1000 + i,
        [isMovie ? 'title' : 'name']: `Mock ${isMovie ? 'Movie' : 'Show'} ${i + 1}`,
        poster_path: `/mock-poster-${i}.jpg`,
        backdrop_path: `/mock-backdrop-${i}.jpg`,
        overview: 'Mock overview',
        vote_average: 7.5,
        adult: false,
        genre_ids: [28, 12],
        [isMovie ? 'release_date' : 'first_air_date']: '2024-01-01',
      })),
      total_pages: 5,
      total_results: 100,
    });
  }),

  // Trending
  http.get(`${TMDB_BASE}/trending/:mediaType/:window`, () => {
    return HttpResponse.json({
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    });
  }),

  // Genre list
  http.get(`${TMDB_BASE}/genre/:type/list`, () => {
    return HttpResponse.json({
      genres: [
        { id: 28, name: 'Action' },
        { id: 12, name: 'Adventure' },
        { id: 16, name: 'Animation' },
        { id: 35, name: 'Comedy' },
      ],
    });
  }),

  // Détails movie / tv
  http.get(`${TMDB_BASE}/movie/:id`, ({ params }) => {
    return HttpResponse.json({
      id: Number(params.id),
      title: `Mock Movie ${params.id}`,
      poster_path: '/mock-poster.jpg',
      backdrop_path: '/mock-backdrop.jpg',
      overview: 'Mock overview',
      runtime: 120,
      vote_average: 7.5,
      release_date: '2024-01-01',
      genres: [{ id: 28, name: 'Action' }],
    });
  }),
  http.get(`${TMDB_BASE}/tv/:id`, ({ params }) => {
    return HttpResponse.json({
      id: Number(params.id),
      name: `Mock Show ${params.id}`,
      poster_path: '/mock-poster.jpg',
      backdrop_path: '/mock-backdrop.jpg',
      overview: 'Mock overview',
      number_of_seasons: 3,
      number_of_episodes: 30,
      episode_run_time: [45],
      vote_average: 8.0,
      first_air_date: '2024-01-01',
      genres: [{ id: 18, name: 'Drama' }],
    });
  }),

  // Watch providers
  http.get(`${TMDB_BASE}/movie/:id/watch/providers`, () => {
    return HttpResponse.json({
      results: {
        FR: {
          link: 'https://example.com',
          flatrate: [
            { provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.jpg', display_priority: 1 },
          ],
        },
      },
    });
  }),
  http.get(`${TMDB_BASE}/tv/:id/watch/providers`, () => {
    return HttpResponse.json({ results: {} });
  }),

  // Search
  http.get(`${TMDB_BASE}/search/:type`, () => {
    return HttpResponse.json({ page: 1, results: [], total_pages: 0, total_results: 0 });
  }),

  // Similar / recommendations (catch-all)
  http.get(`${TMDB_BASE}/movie/:id/similar`, () =>
    HttpResponse.json({ page: 1, results: [], total_pages: 0 })
  ),
  http.get(`${TMDB_BASE}/tv/:id/similar`, () =>
    HttpResponse.json({ page: 1, results: [], total_pages: 0 })
  ),
];

// ============================================
// Cloudinary (uploads)
// ============================================
const cloudinaryHandlers = [
  http.post('https://api.cloudinary.com/v1_1/:account/image/upload', () => {
    return HttpResponse.json({
      secure_url: 'https://res.cloudinary.com/test/image/upload/v1/test.jpg',
      public_id: 'test/test-public-id',
      width: 500,
      height: 750,
      format: 'jpg',
    });
  }),
];

// ============================================
// Google OAuth (token + userinfo)
// ============================================
const googleHandlers = [
  http.post('https://oauth2.googleapis.com/token', () => {
    return HttpResponse.json({
      access_token: 'mock-google-access-token',
      id_token:
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.mock.signature',
      expires_in: 3600,
      token_type: 'Bearer',
    });
  }),
  http.get('https://www.googleapis.com/oauth2/v2/userinfo', () => {
    return HttpResponse.json({
      id: 'mock-google-id-12345',
      email: 'mock-google@poplist.test',
      name: 'Mock Google User',
      picture: 'https://example.com/avatar.jpg',
      verified_email: true,
    });
  }),
];

// ============================================
// Image proxy (TMDB images)
// ============================================
const imageHandlers = [
  http.get('https://image.tmdb.org/t/p/:size/*', () => {
    // 1x1 PNG transparent (rare appel pendant les tests, mais évite un crash)
    return new HttpResponse(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), {
      headers: { 'Content-Type': 'image/png' },
    });
  }),
];

export const server = setupServer(
  ...tmdbHandlers,
  ...cloudinaryHandlers,
  ...googleHandlers,
  ...imageHandlers
);
