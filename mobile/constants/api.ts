/**
 * Backend HTTP appelé par l'app mobile.
 *
 * Par défaut : la production Railway (comportement historique inchangé).
 * Surchargeable via `EXPO_PUBLIC_API_URL` (inliné par Expo au bundling) pour
 * pointer sur un backend local — typiquement pour le développement/QA :
 *
 *   # émulateur Android : 10.0.2.2 = la machine hôte vue depuis l'émulateur
 *   EXPO_PUBLIC_API_URL=http://10.0.2.2:4005 npx expo run:android   # backend de TEST
 *
 * ⚠️ Sans rapport avec `DATABASE_URL` (backend) : cette variable dit seulement
 * QUEL backend l'app contacte, pas quelle base ce backend utilise.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://poplist-production.up.railway.app';

// Google OAuth client IDs (created in Google Cloud Console)
// expoClientId = Web application type, redirect URI: https://auth.expo.io/@{EXPO_USERNAME}/poplist
export const GOOGLE_EXPO_CLIENT_ID =
  '31083873731-utp0kdcctml6t5770ssrdtqb2ak9cgrk.apps.googleusercontent.com';
// androidClientId = Android type (needed for production standalone builds)
export const GOOGLE_ANDROID_CLIENT_ID = '';

/**
 * Site web public (PWA) — utilisé pour les liens sortants de l'app,
 * ex. la politique de confidentialité de l'onglet Compte.
 */
export const WEB_APP_URL = 'https://poplist.me';

/** Lien de soutien, identique au footer de la PWA. */
export const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/samuelprigl';
