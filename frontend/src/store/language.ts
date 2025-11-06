import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fr } from "@/lib/content/fr";
import { en } from "@/lib/content/en";
import type { Content } from "@/lib/content/fr";

export type Language = "fr" | "en";

interface LanguageState {
  language: Language;
  content: Content;
  setLanguage: (lang: Language) => void;
}

const contentMap: Record<Language, Content> = {
  fr,
  en,
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
    }
  )
);
