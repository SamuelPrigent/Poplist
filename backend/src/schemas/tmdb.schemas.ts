/**
 * Schémas zod des RÉPONSES /tmdb/*.
 *
 * Les endpoints TMDB renvoient tous des entités TMDB (listes paginées, genres,
 * providers). On réutilise directement les schémas d'entités.
 */
import {
  tmdbListResponseSchema,
  tmdbGenresResponseSchema,
  tmdbProvidersResponseSchema,
} from './entities.schemas.js';

export { tmdbListResponseSchema, tmdbGenresResponseSchema, tmdbProvidersResponseSchema };
