import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WatchlistFiltersState {
	showOwned: boolean;
	showSaved: boolean;
	setShowOwned: (show: boolean) => void;
	setShowSaved: (show: boolean) => void;
	toggleOwned: () => void;
	toggleSaved: () => void;
}

export const useListFiltersStore = create<WatchlistFiltersState>()(
	persist(
		(set) => ({
			showOwned: true,
			// true par défaut : cohérent avec mobile (qui montre tout) et avec le
			// SSR (qui rend toutes les cards) → pas de layout shift au rehydrate
			// pour un utilisateur qui n'a jamais touché aux filtres. false ici
			// faisait disparaître les listes suivies du HTML initial (CLS, cf.
			// private/lighthouse.md §7).
			showSaved: true,
			setShowOwned: (show: boolean) => set({ showOwned: show }),
			setShowSaved: (show: boolean) => set({ showSaved: show }),
			toggleOwned: () => set((state) => ({ showOwned: !state.showOwned })),
			toggleSaved: () => set((state) => ({ showSaved: !state.showSaved })),
		}),
		{
			name: "watchlist-filters-storage",
			skipHydration: true,
		},
	),
);
