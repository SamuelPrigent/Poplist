/**
 * Helpers de documentation OpenAPI partagés par les fichiers de routes.
 *
 * On garde `zValidator` pour la validation runtime (zéro changement de
 * comportement) et on documente en parallèle via `describeRoute` pour alimenter
 * le spec (et donc le SDK Kubb), en réutilisant les mêmes schémas zod.
 */
import { resolver } from 'hono-openapi';
import type { OpenAPIV3_1 } from 'openapi-types';
import { z } from 'zod';

/** Réponse 200 JSON typée par un schéma zod. */
// Type de retour explicite (nommable) : le type du resolver référence des types
// internes non exportés par hono-openapi, non nommables en declaration emit
// (TS4058). Le cast est sans effet runtime : hono-openapi résout l'objet resolver
// (via `toOpenAPISchema`) lors de la génération du spec.
export function ok(schema: z.ZodType, description = 'OK'): OpenAPIV3_1.ResponsesObject {
  return {
    200: {
      description,
      content: {
        'application/json': {
          schema: resolver(schema) as unknown as OpenAPIV3_1.SchemaObject,
        },
      },
    },
  };
}

/** Corps de requête JSON typé par un schéma zod (input du zValidator). */
// hono-openapi ne résout les resolvers que dans `responses`, pas dans
// `requestBody` (l'objet resolver serait sérialisé tel quel dans le spec).
// On convertit donc directement via zod v4 (JSON Schema natif, synchrone) —
// OpenAPI 3.1 EST du JSON Schema, et Kubb en dérive les types de requête.
export function jsonBody(schema: z.ZodType): OpenAPIV3_1.RequestBodyObject {
  return {
    required: true,
    content: {
      'application/json': {
        schema: z.toJSONSchema(schema, { io: 'input' }) as OpenAPIV3_1.SchemaObject,
      },
    },
  };
}

/** Paramètres de query (strings). `required` liste les params obligatoires. */
export function queryParams(
  names: string[],
  required: string[] = [],
): OpenAPIV3_1.ParameterObject[] {
  return names.map((name) => ({
    name,
    in: 'query',
    required: required.includes(name),
    schema: { type: 'string' },
  }));
}
