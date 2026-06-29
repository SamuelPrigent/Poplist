import sharp from 'sharp'

const FALLBACK_COLOR = '#1a1a2e'

/**
 * Convertit RGB en HSL, sature au max (S=100%), puis reconvertit en RGB hex.
 */
function saturate(r: number, g: number, b: number): string {
  // Normalize to 0-1
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255

  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2

  // Calculate hue
  let h = 0
  const d = max - min
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
    else if (max === gn) h = ((bn - rn) / d + 2) / 6
    else h = ((rn - gn) / d + 4) / 6
  }

  // If achromatic (gray/black/white), return as-is — can't saturate
  if (d === 0) {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  // Reconstruct with S=1 (full saturation), keep H and L
  const s = 1
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  const hue2rgb = (pp: number, qq: number, t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return pp + (qq - pp) * 6 * tt
    if (tt < 1 / 2) return qq
    if (tt < 2 / 3) return pp + (qq - pp) * (2 / 3 - tt) * 6
    return pp
  }

  const ro = Math.round(hue2rgb(p, q, h + 1 / 3) * 255)
  const go = Math.round(hue2rgb(p, q, h) * 255)
  const bo = Math.round(hue2rgb(p, q, h - 1 / 3) * 255)

  return `#${ro.toString(16).padStart(2, '0')}${go.toString(16).padStart(2, '0')}${bo.toString(16).padStart(2, '0')}`
}

/**
 * Extrait la couleur dominante d'un Buffer image via Sharp, saturée au max.
 */
export async function extractDominantColor(imageBuffer: Buffer): Promise<string> {
  try {
    const { dominant } = await sharp(imageBuffer).stats()
    return saturate(dominant.r, dominant.g, dominant.b)
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
