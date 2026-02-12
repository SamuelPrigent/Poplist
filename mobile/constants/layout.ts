import { Dimensions } from 'react-native'

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

export const CONTENT_PADDING = 16
export const CARD_GAP = 12
export const POSTER_ASPECT_RATIO = 2 / 3
export const POSTER_WIDTH = (SCREEN_WIDTH - CONTENT_PADDING * 2 - CARD_GAP) / 2
export const POSTER_HEIGHT = POSTER_WIDTH / POSTER_ASPECT_RATIO
