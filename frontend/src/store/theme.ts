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
			theme: "ocean",
			setTheme: (theme: Theme) => set({ theme }),
		}),
		{
			name: "theme-storage",
		},
	),
);
