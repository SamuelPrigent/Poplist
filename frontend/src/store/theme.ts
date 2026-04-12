import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "ocean" | "midnight";

interface ThemeState {
	theme: Theme;
	setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
	persist(
		(set) => ({
			theme: "midnight",
			setTheme: (theme: Theme) => set({ theme }),
		}),
		{
			name: "theme-storage",
		},
	),
);
