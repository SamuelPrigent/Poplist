/**
 * Source UNIQUE des URLs e2e (front de test + back de test).
 *
 * Ports par défaut : front 3005, back 4005 (cf. backend/.env.test PORT=4005 et
 * `vite dev --mode test --port 3005`). Surchargeables via les variables
 * d'env E2E_FRONTEND_URL / E2E_BACKEND_URL.
 *
 * Tout le code e2e (specs + helpers) importe d'ici — on ne hardcode plus de
 * port nulle part, pour qu'un changement de port = un seul endroit à toucher.
 */
export const FRONTEND_BASE = process.env.E2E_FRONTEND_URL ?? 'http://localhost:3005';
export const BACKEND_URL = process.env.E2E_BACKEND_URL ?? 'http://localhost:4005';
