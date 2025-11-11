import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fr } from "@/lib/content/fr";
import { en } from "@/lib/content/en";
import { es } from "@/lib/content/es";
import type { Content } from "@/types/content";

export type Language = "fr" | "en" | "es";

interface LanguageState {
  language: Language;
  content: Content;
  setLanguage: (lang: Language) => void;
}

const contentMap: Record<Language, Content> = {
  fr,
  en,
  es,
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
