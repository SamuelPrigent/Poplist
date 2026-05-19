import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Scrolls the window to the top of the page
 * @param behavior - The scroll behavior ('auto', 'smooth', or 'instant')
 */
export function scrollToTop(behavior: ScrollBehavior = "instant"): void {
	window.scrollTo({
		top: 0,
		left: 0,
		behavior,
	});
}

/**
 * Convert app language code to TMDB language code
 * @param lang - The app language code (fr, en, de, es, it, pt)
 * @returns The TMDB language code (fr-FR, en-US, etc.)
 */
export function getTMDBLanguage(lang: string): string {
	const langMap: Record<string, string> = {
		fr: "fr-FR",
		en: "en-US",
		es: "es-ES",
		de: "de-DE",
		it: "it-IT",
		pt: "pt-BR",
	};
	return langMap[lang] || "en-US";
}

/**
 * Convert app language code to region code
 * @param lang - The app language code (fr, en, de, es, it, pt)
 * @returns The region code (FR, US, etc.)
 */
export function getTMDBRegion(lang: string): string {
	const regionMap: Record<string, string> = {
		fr: "FR",
		en: "US",
		es: "ES",
		de: "DE",
		it: "IT",
		pt: "BR",
	};
	return regionMap[lang] || "US";
}

/**
 * Resize a TMDB poster URL to a different width
 * Handles any existing width (w92, w154, w185, w342, w500, w780, original)
 * @param url - The TMDB poster URL
 * @param size - The desired size (w92, w154, w185, w342, w500, w780)
 * @returns The resized URL
 */
export function resizeTMDBPoster(url: string, size: string): string {
	if (!url) return url;
	return url.replace(/\/w\d+\/|\/original\//, `/${size}/`);
}

/**
 * Génère un srcSet TMDB à partir d'un chemin poster pour permettre
 * au browser de choisir la résolution adaptée au viewport.
 *
 * Exemple d'usage :
 *   <img
 *     src={`https://image.tmdb.org/t/p/w342${path}`}
 *     srcSet={tmdbPosterSrcSet(path)}
 *     sizes="(max-width: 640px) 50vw, 25vw"
 *   />
 *
 * Retourne une chaîne vide si `path` est null/undefined, ce qui laisse
 * le browser tomber sur l'attribut `src` natif.
 */
export function tmdbPosterSrcSet(
	path: string | null | undefined,
	widths: Array<"w185" | "w342" | "w500"> = ["w185", "w342", "w500"]
): string {
	if (!path) return "";
	return widths
		.map(w => `https://image.tmdb.org/t/p/${w}${path} ${Number(w.slice(1))}w`)
		.join(", ");
}

/**
 * Build a full TMDB image URL from a path (or substitute the size of an
 * existing URL).
 *
 * @param path - Le path TMDB (`/abc.jpg`) OU une URL TMDB déjà complète
 *               (`https://image.tmdb.org/t/p/w500/abc.jpg`). Le backend stocke
 *               souvent la version full-URL (héritage), il faut la
 *               réécrire à la bonne taille pour éviter de charger des images
 *               10× trop lourdes (genre w500 pour un thumbnail de 36×36).
 * @param size - Taille souhaitée (w92 / w154 / w185 / w342 / w500 / etc.)
 * @returns L'URL TMDB avec la taille demandée, ou null si `path` est vide.
 */
export function getTMDBImageUrl(
	path: string | null | undefined,
	size: "w45" | "w92" | "w154" | "w185" | "w300" | "w342" | "w500" | "w780" | "w1280" | "h632" | "original" = "w342"
): string | null {
	if (!path) return null;
	// URL TMDB complète : on remplace le segment de taille (w154, w500, etc.).
	const tmdbUrlMatch = path.match(/^https?:\/\/image\.tmdb\.org\/t\/p\/[^/]+(\/.+)$/);
	if (tmdbUrlMatch) {
		return `https://image.tmdb.org/t/p/${size}${tmdbUrlMatch[1]}`;
	}
	// Autre URL externe (avatar Cloudinary, etc.) : on touche pas.
	if (path.startsWith("http")) return path;
	// Path brut TMDB : on construit l'URL.
	return `https://image.tmdb.org/t/p/${size}${path}`;
}
