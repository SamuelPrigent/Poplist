import { Dimensions } from 'react-native'

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

export const CONTENT_PADDING = 16
export const CARD_GAP = 12
export const POSTER_ASPECT_RATIO = 2 / 3
export const POSTER_WIDTH = (SCREEN_WIDTH - CONTENT_PADDING * 2 - CARD_GAP) / 2
export const POSTER_HEIGHT = POSTER_WIDTH / POSTER_ASPECT_RATIO

/**
 * L'affichage est TOUJOURS en grille : le choix grille/liste et le réglage du
 * nombre de colonnes ont été retirés des préférences, et le store zustand
 * correspondant supprimé. Ces constantes remplacent l'ancien
 * `usePreferencesStore().columns` / `.exploreColumns`.
 */

/** Grille des cards de listes (accueil, catégories, profils, populaires). */
export const GRID_COLUMNS = 3

/** Grille des affiches de la page Explorer. */
export const EXPLORE_COLUMNS = 3
