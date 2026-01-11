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
