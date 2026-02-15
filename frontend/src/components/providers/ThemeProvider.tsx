"use client";

import { useEffect } from "react";
import { themes } from "@/lib/themes";
import { useThemeStore } from "@/store/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const { theme } = useThemeStore();

	useEffect(() => {
		const root = document.documentElement;
		const vars = themes[theme];
		for (const [key, value] of Object.entries(vars)) {
			root.style.setProperty(key, value);
		}
		root.setAttribute("data-theme", theme);
	}, [theme]);

	return <>{children}</>;
}
