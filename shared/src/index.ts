/**
 * @poplist/shared — SDK partagé entre backend, frontend et mobile.
 *
 * Tout le contrat API est GÉNÉRÉ par Kubb depuis le spec OpenAPI
 * (`shared/openapi.json`), lui-même dérivé des schémas zod du backend
 * (`backend/src/schemas/*.schemas.ts`). Ne rien écrire à la main ici :
 * `npm run kubb:generate` régénère tout.
 *
 * Points d'entrée :
 *   - `@poplist/shared/generated`      → types, clients, hooks react-query
 *   - `@poplist/shared/client-runtime` → transport injectable (setApiTransport)
 */
export * from './generated/index';
