import { create } from "zustand";
import { persist } from "zustand/middleware";
import { de } from "@/lib/content/de";
import { en } from "@/lib/content/en";
import { es } from "@/lib/content/es";
import { fr } from "@/lib/content/fr";
import { it } from "@/lib/content/it";
import { pt } from "@/lib/content/pt";
import type { Content } from "@/types/content";

export type Language = "fr" | "en" | "de" | "es" | "it" | "pt";

interface LanguageState {
	language: Language;
	content: Content;
	setLanguage: (lang: Language) => void;
}

const contentMap: Record<Language, Content> = {
	fr,
	en,
	de,
	es,
	it,
	pt,
};

export const useLanguageStore = create<LanguageState>()(
	persist(
		(set) => ({
			language: "fr",
			content: fr,
			setLanguage: (lang: Language) =>
				set({
					language: lang,
					content: contentMap[lang],
				}),
		}),
		{
			name: "language-storage",
		},
	),
);
