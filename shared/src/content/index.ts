/**
 * Contenu partagé écrit à la MAIN (hors `src/generated/`, donc jamais touché
 * par `npm run kubb:generate`).
 *
 * Passe par un index plutôt qu'un export wildcard `./content/*` : Metro (React
 * Native) ne résout pas les motifs wildcard des `exports`, seulement les
 * chemins exacts.
 */
export * from './userMenu';
