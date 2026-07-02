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
			// Évite l'hydratation auto à la première lecture côté client : sans ça
			// le SSR rend en `fr` (default) et le client switche immédiatement
			// vers la langue stockée (`en`, etc.), ce qui produit un mismatch
			// d'hydratation sur tout le texte traduit. On rehydrate à la main
			// dans `Providers` après le mount.
			skipHydration: true,
			// Ne persiste QUE la langue. Avant, tout le state (dont `content`)
			// partait dans le localStorage : après un deploy ajoutant de nouvelles
			// clés de traduction, les visiteurs réhydrataient un vieux `content`
			// sans ces clés → crash (ex : `titleMobile.split(...)` sur undefined).
			// `content` est maintenant toujours re-dérivé du bundle courant.
			partialize: (state) => ({ language: state.language }),
			merge: (persisted, current) => {
				const lang =
					(persisted as { language?: Language } | undefined)?.language ??
					current.language;
				return {
					...current,
					language: lang,
					content: contentMap[lang] ?? fr,
				};
			},
		},
	),
);
