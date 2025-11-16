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

export const useWatchlistFiltersStore = create<WatchlistFiltersState>()(
  persist(
    (set) => ({
      showOwned: true,
      showSaved: false,
      setShowOwned: (show: boolean) => set({ showOwned: show }),
      setShowSaved: (show: boolean) => set({ showSaved: show }),
      toggleOwned: () => set((state) => ({ showOwned: !state.showOwned })),
      toggleSaved: () => set((state) => ({ showSaved: !state.showSaved })),
    }),
    {
      name: "watchlist-filters-storage",
    },
  ),
);
