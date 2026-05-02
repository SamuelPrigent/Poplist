import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Préférence de pagination, valeurs `number` ou `'all'` pour "tout afficher".
 *
 * Deux préférences distinctes :
 * - `itemsPerPage`      : items à l'intérieur d'une watchlist (30 / 60 / all)
 * - `watchlistsPerPage` : watchlists du catalogue communautaire (50 / 100 / all)
 *
 * Persistées globalement en localStorage pour survivre aux reloads.
 */
export type ItemsPerPagePreference = number | "all";

interface ListPaginationState {
	itemsPerPage: ItemsPerPagePreference;
	watchlistsPerPage: ItemsPerPagePreference;
	setItemsPerPage: (value: ItemsPerPagePreference) => void;
	setWatchlistsPerPage: (value: ItemsPerPagePreference) => void;
}

export const useListPaginationStore = create<ListPaginationState>()(
	persist(
		(set) => ({
			itemsPerPage: "all",
			watchlistsPerPage: 50,
			setItemsPerPage: (value: ItemsPerPagePreference) => set({ itemsPerPage: value }),
			setWatchlistsPerPage: (value: ItemsPerPagePreference) =>
				set({ watchlistsPerPage: value }),
		}),
		{
			name: "list-pagination-storage",
		},
	),
);
