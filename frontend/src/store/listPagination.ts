import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Préférence de pagination des items dans une watchlist.
 * - `30` ou `60` : nombre d'items par page
 * - `'all'`      : afficher tous les items (pas de pagination)
 *
 * La préférence est globale (partagée entre toutes les listes consultées) et
 * persistée en localStorage pour survivre aux reloads.
 */
export type ItemsPerPagePreference = number | "all";

interface ListPaginationState {
	itemsPerPage: ItemsPerPagePreference;
	setItemsPerPage: (value: ItemsPerPagePreference) => void;
}

export const useListPaginationStore = create<ListPaginationState>()(
	persist(
		(set) => ({
			itemsPerPage: "all",
			setItemsPerPage: (value: ItemsPerPagePreference) => set({ itemsPerPage: value }),
		}),
		{
			name: "list-pagination-storage",
		},
	),
);
