/**
 * Helpers d'invalidation par domaine.
 *
 * Les query keys générées par Kubb sont PAR ENDPOINT : il n'y a plus de
 * matching par préfixe (`['watchlists', id]` couvrait implicitement toutes les
 * variantes). Ces helpers recréent cette couche d'abstraction explicitement :
 * la liste des queries couvertes par une écriture est écrite noir sur blanc,
 * au lieu d'être implicite dans une convention de préfixe.
 *
 * Règle (cf. CLAUDE.md) : tout nouveau endpoint GET d'un domaine doit être
 * ajouté au helper correspondant.
 */
import type { QueryClient } from '@tanstack/react-query';
import {
  getMyWatchlistsQueryKey,
  getWatchlistByIdQueryKey,
  getPublicWatchlistQueryKey,
  getPublicFeaturedQueryKey,
  getWatchlistsByGenreQueryKey,
  getWatchlistCountByGenreQueryKey,
  getWatchlistRecommendationsQueryKey,
  getProfileQueryKey,
  getUserProfileByUsernameQueryKey,
  meQueryKey,
} from '@poplist/shared/generated';

// ========================================
// Watchlists
// ========================================

/** Invalide la liste « mes watchlists ». */
export function invalidateMyWatchlists(qc: QueryClient): Promise<void> {
  return qc.invalidateQueries({ queryKey: getMyWatchlistsQueryKey() });
}

/**
 * Invalide toutes les vues d'UNE watchlist (détail auth, détail public,
 * recommandations — toutes langues) + « mes watchlists ».
 * Équivalent de l'ancien `invalidateQueries({ queryKey: ['watchlists', id] })`
 * par préfixe, en explicite.
 */
export function invalidateWatchlist(qc: QueryClient, id: string): Promise<void> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: getWatchlistByIdQueryKey(id) }),
    qc.invalidateQueries({ queryKey: getPublicWatchlistQueryKey(id) }),
    // Recommandations : key = [{url, params}, {language}] → on matche sur le
    // premier élément quel que soit le param language.
    qc.invalidateQueries({ queryKey: [getWatchlistRecommendationsQueryKey(id)[0]] }),
    qc.invalidateQueries({ queryKey: getMyWatchlistsQueryKey() }),
  ]).then(() => undefined);
}

/** Purge (sans refetch) toutes les vues d'une watchlist (ex. après delete). */
export function removeWatchlist(qc: QueryClient, id: string): void {
  qc.removeQueries({ queryKey: getWatchlistByIdQueryKey(id) });
  qc.removeQueries({ queryKey: getPublicWatchlistQueryKey(id) });
  qc.removeQueries({ queryKey: [getWatchlistRecommendationsQueryKey(id)[0]] });
}

/** Invalide les listings publics (featured toutes limites + genres). */
export function invalidatePublicListings(qc: QueryClient): Promise<void> {
  return Promise.all([
    // Featured : key = [{url}, {limit}?] → matcher sur le premier élément
    // couvre toutes les valeurs de limit.
    qc.invalidateQueries({ queryKey: [getPublicFeaturedQueryKey()[0]] }),
    qc.invalidateQueries({
      predicate: (q) =>
        (q.queryKey[0] as { url?: string } | undefined)?.url ===
          getWatchlistsByGenreQueryKey('')[0].url ||
        (q.queryKey[0] as { url?: string } | undefined)?.url ===
          getWatchlistCountByGenreQueryKey('')[0].url,
    }),
  ]).then(() => undefined);
}

/**
 * Invalide TOUT le domaine watchlists (équivalent de l'ancien
 * `invalidateQueries({ queryKey: ['watchlists'] })`, utilisé au login).
 */
export function invalidateAllWatchlists(qc: QueryClient): Promise<void> {
  return qc.invalidateQueries({
    predicate: (q) => {
      const url = (q.queryKey[0] as { url?: string } | undefined)?.url;
      return typeof url === 'string' && url.startsWith('/watchlists');
    },
  });
}

/**
 * Purge (sans refetch) les queries watchlists LIÉES À LA SESSION (mine +
 * détails auth). Les vues publiques restent en cache : elles sont valides
 * quelle que soit la session. Utilisé au logout/deleteAccount.
 */
export function removeAuthWatchlists(qc: QueryClient): void {
  qc.removeQueries({
    predicate: (q) => {
      const url = (q.queryKey[0] as { url?: string } | undefined)?.url;
      return url === '/watchlists/mine' || url === '/watchlists/:id';
    },
  });
}

// ========================================
// Users
// ========================================

/** Invalide les profils (privé + publics, tous usernames). */
export function invalidateUserProfiles(qc: QueryClient): Promise<void> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: getProfileQueryKey() }),
    qc.invalidateQueries({
      predicate: (q) =>
        (q.queryKey[0] as { url?: string } | undefined)?.url ===
        getUserProfileByUsernameQueryKey('')[0].url,
    }),
  ]).then(() => undefined);
}

/** Purge (sans refetch) le profil privé (logout/deleteAccount). */
export function removeAuthUserProfile(qc: QueryClient): void {
  qc.removeQueries({ queryKey: getProfileQueryKey() });
}

// ========================================
// Auth
// ========================================

/** Purge (sans refetch) la session — évite le refetch 401 en boucle. */
export function removeMe(qc: QueryClient): void {
  qc.removeQueries({ queryKey: meQueryKey() });
}
