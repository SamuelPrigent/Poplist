import type { Platform } from "@poplist/shared";
import { apiFetch } from "./client";

export interface ProviderLogo {
	path: string;
	className?: string;
}

interface TMDBProviderEntry {
	logo_path: string;
	provider_id: number;
	provider_name: string;
	display_priority: number;
}

interface TMDBProvidersResponse {
	results: {
		[countryCode: string]: {
			link: string;
			flatrate?: TMDBProviderEntry[];
			buy?: TMDBProviderEntry[];
			rent?: TMDBProviderEntry[];
		};
	};
}

export async function fetchTMDBProviders(
	tmdbId: string,
	type: "movie" | "tv",
	region: string = "FR",
): Promise<Platform[]> {
	try {
		const data = await apiFetch<TMDBProvidersResponse>(
			`/tmdb/${type}/${tmdbId}/providers`,
			{ query: { region } }
		);

		const regionData = data.results[region];
		if (!regionData) {
			return [{ name: "Inconnu", logoPath: "" }];
		}

		const allProviders: Platform[] = [];
		const collect = (entries?: TMDBProviderEntry[]) => {
			if (!entries) return;
			for (const p of entries) {
				allProviders.push({ name: p.provider_name, logoPath: p.logo_path });
			}
		};
		collect(regionData.flatrate);
		collect(regionData.buy);
		collect(regionData.rent);

		const uniqueProviders = new Map<string, Platform>();
		for (const provider of allProviders) {
			if (!uniqueProviders.has(provider.name)) {
				uniqueProviders.set(provider.name, provider);
			}
		}

		const result = Array.from(uniqueProviders.values());
		return result.length > 0 ? result : [{ name: "Inconnu", logoPath: "" }];
	} catch (error) {
		console.error("Failed to fetch TMDB providers:", error);
		return [{ name: "Inconnu", logoPath: "" }];
	}
}

export function getWatchProviderLogo(providerName: string): ProviderLogo | null {
	const nameMap: Record<string, ProviderLogo | null> = {
		netflix: { path: "/watchProvider/netflix.svg" },
		"netflix standard with ads": { path: "/watchProvider/netflix.svg" },
		"amazon prime video": { path: "/watchProvider/primeVideo.svg" },
		"amazon prime video with ads": { path: "/watchProvider/primeVideo.svg" },
		"amazon video": { path: "/watchProvider/primeVideo.svg" },
		"prime video": { path: "/watchProvider/primeVideo.svg" },
		"prime-video": { path: "/watchProvider/primeVideo.svg" },
		youtube: { path: "/watchProvider/youtube.svg" },
		"youtube premium": { path: "/watchProvider/youtube.svg" },
		"apple tv": { path: "/watchProvider/appleTv.svg" },
		"apple tv+": { path: "/watchProvider/appleTv.svg" },
		"apple tv plus": { path: "/watchProvider/appleTv.svg" },
		"apple tv store": { path: "/watchProvider/appleTv.svg" },
		"apple-tv": { path: "/watchProvider/appleTv.svg" },
		"disney plus": { path: "/watchProvider/disneyplus.svg" },
		"disney+": { path: "/watchProvider/disneyplus.svg" },
		"disney-plus": { path: "/watchProvider/disneyplus.svg" },
		crunchyroll: { path: "/watchProvider/Crunchyroll.svg" },
		"hbo max": { path: "/watchProvider/hbo.svg" },
		"hbo max  amazon channel": { path: "/watchProvider/hbo.svg" },
		"hbo-max": { path: "/watchProvider/hbo.svg" },
		hbo: { path: "/watchProvider/hbo.svg" },
		max: { path: "/watchProvider/hbo.svg" },
		"google play movies": { path: "/watchProvider/googleplay.svg", className: "p-2" },
		"google play": { path: "/watchProvider/googleplay.svg", className: "p-2" },
		"orange vod": { path: "/watchProvider/orange.svg" },
		orange: { path: "/watchProvider/orange.svg" },
	};

	const normalized = providerName.toLowerCase().trim();

	if (nameMap[normalized]) {
		return nameMap[normalized];
	}

	for (const [key, logo] of Object.entries(nameMap)) {
		if (logo && (normalized.includes(key) || key.includes(normalized))) {
			return logo;
		}
	}

	return null;
}
