import sharp from 'sharp'

const FALLBACK_COLOR = '#1a1a2e'

/**
 * Extrait la couleur dominante d'un Buffer image via Sharp.
 */
export async function extractDominantColor(imageBuffer: Buffer): Promise<string> {
  try {
    const { dominant } = await sharp(imageBuffer).stats()
    const hex = `#${dominant.r.toString(16).padStart(2, '0')}${dominant.g.toString(16).padStart(2, '0')}${dominant.b.toString(16).padStart(2, '0')}`
    return hex
  } catch {
    return FALLBACK_COLOR
  }
}

/**
 * Extrait la couleur dominante depuis une image base64 (data:image/...;base64,...).
 */
export async function extractDominantColorFromBase64(base64Data: string): Promise<string> {
  try {
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Content, 'base64')
    return extractDominantColor(buffer)
  } catch {
    return FALLBACK_COLOR
  }
}

/**
 * Extrait la couleur dominante depuis une URL (ex: poster TMDB).
 */
export async function extractDominantColorFromUrl(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) return FALLBACK_COLOR
    const buffer = Buffer.from(await response.arrayBuffer())
    return extractDominantColor(buffer)
  } catch {
    return FALLBACK_COLOR
  }
}

export { FALLBACK_COLOR }
