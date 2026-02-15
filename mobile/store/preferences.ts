import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type ColumnCount = 2 | 3
export type ExploreColumnCount = 2 | 3 | 4
export type Handedness = 'right' | 'left'
export type BgTheme = 'ocean' | 'midnight'

interface PreferencesState {
  columns: ColumnCount
  setColumns: (columns: ColumnCount) => void
  exploreColumns: ExploreColumnCount
  setExploreColumns: (columns: ExploreColumnCount) => void
  handedness: Handedness
  setHandedness: (handedness: Handedness) => void
  bgTheme: BgTheme
  setBgTheme: (theme: BgTheme) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      columns: 2,
      setColumns: (columns: ColumnCount) => set({ columns }),
      exploreColumns: 3 as ExploreColumnCount,
      setExploreColumns: (exploreColumns: ExploreColumnCount) => set({ exploreColumns }),
      handedness: 'right' as Handedness,
      setHandedness: (handedness: Handedness) => set({ handedness }),
      bgTheme: 'midnight' as BgTheme,
      setBgTheme: (bgTheme: BgTheme) => set({ bgTheme }),
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
