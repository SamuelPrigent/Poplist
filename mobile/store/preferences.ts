import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type ColumnCount = 1 | 2 | 3
export type ExploreColumnCount = 2 | 3 | 4

interface PreferencesState {
  columns: ColumnCount
  setColumns: (columns: ColumnCount) => void
  exploreColumns: ExploreColumnCount
  setExploreColumns: (columns: ExploreColumnCount) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      columns: 2,
      setColumns: (columns: ColumnCount) => set({ columns }),
      exploreColumns: 3 as ExploreColumnCount,
      setExploreColumns: (exploreColumns: ExploreColumnCount) => set({ exploreColumns }),
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
