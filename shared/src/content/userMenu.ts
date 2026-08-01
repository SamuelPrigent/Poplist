/**
 * Textes du menu utilisateur (bulle d'avatar), partagés entre la PWA et l'app
 * mobile pour éviter les doublons.
 *
 * ⚠️ Ce dossier est écrit à la MAIN : il vit hors de `shared/src/generated/`
 * et n'est donc jamais touché par `npm run kubb:generate`.
 */

export type SupportedLanguage = 'fr' | 'en' | 'de' | 'es' | 'it' | 'pt';

export interface UserMenuContent {
  /** Entrée « Paramètres du profil ». */
  profileSettings: string;
  /** Entrée « Privacy ». */
  privacy: string;
  /** Entrée « Buy me a coffee ». */
  buyMeACoffee: string;
  /** Entrée « Déconnexion ». */
  logout: string;
  /** Titre de l'écran de préférences. */
  preferences: string;
  /** Libellé du sélecteur de langue. */
  language: string;
}

export const userMenuContent: Record<SupportedLanguage, UserMenuContent> = {
  fr: {
    profileSettings: 'Paramètres du profil',
    privacy: 'Confidentialité',
    buyMeACoffee: 'Buy me a coffee',
    logout: 'Déconnexion',
    preferences: 'Préférences',
    language: 'Langue',
  },
  en: {
    profileSettings: 'Profile settings',
    privacy: 'Privacy',
    buyMeACoffee: 'Buy me a coffee',
    logout: 'Log out',
    preferences: 'Preferences',
    language: 'Language',
  },
  de: {
    profileSettings: 'Profileinstellungen',
    privacy: 'Datenschutz',
    buyMeACoffee: 'Buy me a coffee',
    logout: 'Abmelden',
    preferences: 'Einstellungen',
    language: 'Sprache',
  },
  es: {
    profileSettings: 'Ajustes del perfil',
    privacy: 'Privacidad',
    buyMeACoffee: 'Buy me a coffee',
    logout: 'Cerrar sesión',
    preferences: 'Preferencias',
    language: 'Idioma',
  },
  it: {
    profileSettings: 'Impostazioni del profilo',
    privacy: 'Privacy',
    buyMeACoffee: 'Buy me a coffee',
    logout: 'Disconnetti',
    preferences: 'Preferenze',
    language: 'Lingua',
  },
  pt: {
    profileSettings: 'Definições do perfil',
    privacy: 'Privacidade',
    buyMeACoffee: 'Buy me a coffee',
    logout: 'Terminar sessão',
    preferences: 'Preferências',
    language: 'Idioma',
  },
};

/** Liens externes communs aux deux apps. */
export const externalLinks = {
  buyMeACoffee: 'https://buymeacoffee.com/samuelprigl',
  webApp: 'https://poplist.me',
} as const;
