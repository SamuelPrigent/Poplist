'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { watchlists as watchlistsApi, type Watchlist } from '@/api';
import { useAuth } from '@/context/auth-context';
import { getLocalWatchlistsWithOwnership } from '@/lib/localStorageHelpers';

/**
 * Source unique des « listes de l'utilisateur », partagée par ListItemsTable,
 * l'ItemDetailsModal (via son parent) et ListRecommendations.
 *
 * - Connecté : `getMine()`. Non connecté : listes localStorage possédées (et on
 *   réécoute les changements localStorage, comme le faisait ListItemsTable).
 * - `editableWatchlists` : listes où l'on peut ajouter des items (owner ou collab) ;
 *   ce sont les cibles valides du WatchlistPickerMenu.
 * - `isInAnyOfMyLists(tmdbId)` : true si l'item est dans une de mes listes éditables
 *   (dérivé des items déjà renvoyés par getMine, donc aucune requête en plus).
 *
 * @param excludeWatchlistId liste à exclure du chargement localStorage (la liste courante)
 */
export function useMyWatchlists(excludeWatchlistId?: string) {
  const { isAuthenticated } = useAuth();
  const [myWatchlists, setMyWatchlists] = useState<Watchlist[]>([]);

  const reload = useCallback(() => {
    if (isAuthenticated) {
      watchlistsApi
        .getMine()
        .then(data => setMyWatchlists(data.watchlists))
        .catch(console.error);
    } else {
      setMyWatchlists(
        getLocalWatchlistsWithOwnership().filter(
          wl => wl.isOwner && wl.id !== excludeWatchlistId
        )
      );
    }
  }, [isAuthenticated, excludeWatchlistId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Sync localStorage (mode non connecté uniquement).
  useEffect(() => {
    if (isAuthenticated) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'watchlists') reload();
    };
    const onCustom = () => reload();
    window.addEventListener('storage', onStorage);
    window.addEventListener('localStorageWatchlistsChanged', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('localStorageWatchlistsChanged', onCustom);
    };
  }, [isAuthenticated, reload]);

  const editableWatchlists = useMemo(
    () => myWatchlists.filter(w => w.isOwner || w.isCollaborator),
    [myWatchlists]
  );

  const isInAnyOfMyLists = useCallback(
    (tmdbId: number) => editableWatchlists.some(wl => wl.items.some(it => it.tmdbId === tmdbId)),
    [editableWatchlists]
  );

  return {
    myWatchlists,
    setMyWatchlists,
    editableWatchlists,
    isInAnyOfMyLists,
    reloadMyWatchlists: reload,
    isAuthenticated,
  };
}

/**
 * Construit la liste affichée dans le WatchlistPickerMenu : la liste courante en
 * tête UNIQUEMENT si on peut l'éditer (owner/collab), puis les autres listes
 * éditables. Corrige le bug où une liste suivie (la courante) apparaissait dans
 * le picker du « + ».
 */
export function buildPickerWatchlists(
  editableWatchlists: Watchlist[],
  current: Watchlist | null,
  canEdit: boolean
): Watchlist[] {
  const others = editableWatchlists.filter(w => w.id !== current?.id);
  return canEdit && current ? [current, ...others] : others;
}
