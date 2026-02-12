/**
 * Convert app language code to TMDB language code
 */
export function getTMDBLanguage(lang: string): string {
  const langMap: Record<string, string> = {
    fr: 'fr-FR',
    en: 'en-US',
    es: 'es-ES',
    de: 'de-DE',
    it: 'it-IT',
    pt: 'pt-BR',
  }
  return langMap[lang] || 'en-US'
}

/**
 * Convert app language code to region code
 */
export function getTMDBRegion(lang: string): string {
  const regionMap: Record<string, string> = {
    fr: 'FR',
    en: 'US',
    es: 'ES',
    de: 'DE',
    it: 'IT',
    pt: 'BR',
  }
  return regionMap[lang] || 'US'
}

/**
 * Resize a TMDB poster URL to a different width
 */
export function resizeTMDBPoster(url: string, size: string): string {
  if (!url) return url
  return url.replace(/\/w\d+\/|\/original\//, `/${size}/`)
}

/**
 * Build a full TMDB image URL from a path
 */
export function getTMDBImageUrl(
  path: string | null | undefined,
  size: 'w45' | 'w92' | 'w154' | 'w185' | 'w300' | 'w342' | 'w500' | 'w780' | 'w1280' | 'h632' | 'original' = 'w342'
): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `https://image.tmdb.org/t/p/${size}${path}`
}
