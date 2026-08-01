import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Content } from '../types/content'
import { fr } from '../lib/content/fr'
import { en } from '../lib/content/en'
import { de } from '../lib/content/de'
import { es } from '../lib/content/es'
import { it } from '../lib/content/it'
import { pt } from '../lib/content/pt'

export type Language = 'fr' | 'en' | 'de' | 'es' | 'it' | 'pt'

interface LanguageState {
  language: Language
  content: Content
  setLanguage: (lang: Language) => void
}

const contentMap: Record<Language, Content> = { fr, en, de, es, it, pt }

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'fr',
      content: fr,
      setLanguage: (lang: Language) =>
        set({ language: lang, content: contentMap[lang] }),
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // ⚠️ On ne persiste QUE la langue.
      //
      // Persister `content` figeait une COPIE du fichier de traductions dans
      // AsyncStorage : à la réhydratation, ce cliché écrasait l'import frais.
      // Toute clé ajoutée depuis l'installation restait donc introuvable sur
      // les appareils existants (crash « Cannot read property 'name' of
      // undefined » au premier rendu après l'ajout de la catégorie
      // `animation`). Le contenu est désormais TOUJOURS dérivé de la langue.
      partialize: (state) => ({ language: state.language }),
      merge: (persisted, current) => {
        const language = (persisted as Partial<LanguageState> | undefined)?.language
        return language && contentMap[language]
          ? { ...current, language, content: contentMap[language] }
          : current
      },
    },
  ),
)
