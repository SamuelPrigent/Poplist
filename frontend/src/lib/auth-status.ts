import { getAuthStatus } from '@/server/auth';

/**
 * Version rapide de `getAuthStatus` pour les `beforeLoad` de routes.
 *
 * - SSR : server fn (lecture du cookie sur la requête entrante), inchangé.
 * - Client : lecture synchrone du flag optimiste `poplist_auth` (posé par
 *   AuthContext au login/signup, retiré au logout) → ZÉRO aller-retour réseau
 *   par navigation. Avant ce helper, chaque navigation client payait un RTT
 *   complet vers Nitro juste pour vérifier la présence d'un cookie.
 *
 * Même sémantique « session probable » que le check cookie de la server fn :
 * aucune des deux ne valide le JWT. Si le flag est faux-positif (cookie
 * expiré), les queries auth échouent en 401 et le handler d'erreur global de
 * l'API client reprend la main, comme avant.
 */
export async function getAuthStatusFast(): Promise<{ isAuthenticated: boolean }> {
  if (typeof window === 'undefined') {
    const { isAuthenticated } = await getAuthStatus();
    return { isAuthenticated };
  }
  try {
    const stored = window.localStorage.getItem('poplist_auth');
    if (stored) {
      const parsed = JSON.parse(stored) as { isAuthenticated?: boolean };
      return { isAuthenticated: parsed.isAuthenticated ?? false };
    }
  } catch {
    // JSON corrompu ou storage indisponible → considéré non connecté
  }
  return { isAuthenticated: false };
}
