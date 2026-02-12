import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type ColumnCount = 2 | 3
export type Handedness = 'right' | 'left'

interface PreferencesState {
  columns: ColumnCount
  setColumns: (columns: ColumnCount) => void
  handedness: Handedness
  setHandedness: (handedness: Handedness) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      columns: 2,
      setColumns: (columns: ColumnCount) => set({ columns }),
      handedness: 'right' as Handedness,
      setHandedness: (handedness: Handedness) => set({ handedness }),
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
