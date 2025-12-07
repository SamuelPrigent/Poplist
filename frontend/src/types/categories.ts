import type { Content } from "./content";

// Genre categories
export const GENRE_CATEGORIES = [
	"movies",
	"series",
	"anime",
	"enfant",
	"documentaries",
	"jeunesse",
	"action",
] as const;

// Platform/Watch Provider categories
export const PLATFORM_CATEGORIES = [
	"netflix",
	"prime-video",
	"disney-plus",
	"crunchyroll",
	"hbo-max",
	"youtube",
	"apple-tv",
] as const;

// Platforms with available logos (for display purposes)
export const PLATFORM_CATEGORIES_WITH_LOGOS = [
	"netflix",
	"prime-video",
	"disney-plus",
	"crunchyroll",
	"hbo-max",
	"youtube",
	"apple-tv",
] as const;

// Combined type for all categories
export const WATCHLIST_CATEGORIES = [
	...GENRE_CATEGORIES,
	...PLATFORM_CATEGORIES,
] as const;

export type GenreCategory = (typeof GENRE_CATEGORIES)[number];
export type PlatformCategory = (typeof PLATFORM_CATEGORIES)[number];
export type WatchlistCategory = (typeof WATCHLIST_CATEGORIES)[number];

export interface CategoryInfo {
	id: WatchlistCategory;
	name: string;
	description: string;
	gradient: string; // Gradient for detail page headers (old)
	cardGradient: string; // Gradient for cards in lists
	headerGradient: string; // New gradient for category detail header (168deg)
	sectionGradient: string; // Gradient for section below header (32% opacity)
}

// Helper function to get translated category info
export const getCategoryInfo = (
	categoryId: WatchlistCategory,
	content: Content
): CategoryInfo => {
	const translations = content.categories.list[categoryId];
	const baseInfo = CATEGORY_INFO[categoryId];

	return {
		id: categoryId,
		name: translations.name,
		description: translations.description,
		gradient: baseInfo.gradient,
		cardGradient: baseInfo.cardGradient,
		headerGradient: baseInfo.headerGradient,
		sectionGradient: baseInfo.sectionGradient,
	};
};

// Category display information (gradients only, names/descriptions come from translations)
export const CATEGORY_INFO: Record<
	WatchlistCategory,
	Omit<CategoryInfo, "id">
> = {
	movies: {
		name: "Films",
		description: "Les meilleurs films du moment",
		gradient:
			"linear-gradient(135deg, #4A90E2 0%, #667EEA 100%)",
		cardGradient: "linear-gradient(135deg, #4A90E2, #667EEA)",
		headerGradient:
			"linear-gradient(168deg, rgb(74 144 226) 0%, rgb(102 126 234) 60%, rgb(74 144 226) 100%)",
		sectionGradient:
			"linear-gradient(rgb(74 144 226 / 32%) 0%, transparent 120px)",
	},
	series: {
		name: "Séries",
		description: "Les séries à ne pas manquer",
		gradient:
			"linear-gradient(135deg, #4A90E2 0%, #667EEA 100%)",
		cardGradient: "linear-gradient(135deg, #4A90E2, #667EEA)",
		headerGradient:
			"linear-gradient(168deg, rgb(74 144 226) 0%, rgb(102 126 234) 60%, rgb(74 144 226) 100%)",
		sectionGradient:
			"linear-gradient(rgb(74 144 226 / 32%) 0%, transparent 120px)",
	},
	netflix: {
		name: "Netflix",
		description: "Les pépites de Netflix",
		gradient:
			"linear-gradient(135deg, #e50914 0%, #b20710 40%, #8b0a0d 60%, #5c0709 100%)",
		cardGradient: "linear-gradient(16deg, #e50914, #8b0a0d 30%, #000000)",
		headerGradient:
			"linear-gradient(168deg, rgb(139 10 13) 0%, rgb(178 7 16) 60%, rgb(139 10 13) 100%)",
		sectionGradient:
			"linear-gradient(rgb(229 9 20 / 32%) 0%, transparent 120px)",
	},
	"prime-video": {
		name: "Prime Video",
		description: "Watchlists disponibles sur Amazon Prime",
		gradient:
			"linear-gradient(135deg, #00a8e1 0%, #0284c7 40%, #0369a1 60%, #075985 100%)",
		cardGradient: "linear-gradient(16deg, #00a8e1, #005573 30%, #000000)",
		headerGradient:
			"linear-gradient(168deg, rgb(3 105 161) 0%, rgb(2 132 199) 60%, rgb(3 105 161) 100%)",
		sectionGradient:
			"linear-gradient(rgb(0 168 225 / 32%) 0%, transparent 120px)",
	},
	"disney-plus": {
		name: "Disney+",
		description: "L'univers Disney, Pixar, Marvel et Star Wars",
		gradient:
			"linear-gradient(135deg, #14b8a6 0%, #0d9488 40%, #0f766e 60%, #115e59 100%)",
		cardGradient: "linear-gradient(16deg, #14b8a6, #0a5c53 30%, #000000)",
		headerGradient:
			"linear-gradient(168deg, rgb(15 118 110) 0%, rgb(13 148 136) 60%, rgb(15 118 110) 100%)",
		sectionGradient:
			"linear-gradient(rgb(20 184 166 / 32%) 0%, transparent 120px)",
	},
	anime: {
		name: "Animation",
		description: "Les meilleurs séries et films d'animation et manga adaptés",
		gradient:
			"linear-gradient(135deg, #4A90E2 0%, #667EEA 100%)",
		cardGradient: "linear-gradient(135deg, #4A90E2, #667EEA)",
		headerGradient:
			"linear-gradient(168deg, rgb(74 144 226) 0%, rgb(102 126 234) 60%, rgb(74 144 226) 100%)",
		sectionGradient:
			"linear-gradient(rgb(74 144 226 / 32%) 0%, transparent 120px)",
	},
	documentaries: {
		name: "Documentaires",
		description: "Documentaires captivants et éducatifs",
		gradient:
			"linear-gradient(135deg, #4A90E2 0%, #667EEA 100%)",
		cardGradient: "linear-gradient(135deg, #4A90E2, #667EEA)",
		headerGradient:
			"linear-gradient(168deg, rgb(74 144 226) 0%, rgb(102 126 234) 60%, rgb(74 144 226) 100%)",
		sectionGradient:
			"linear-gradient(rgb(74 144 226 / 32%) 0%, transparent 120px)",
	},
	jeunesse: {
		name: "Jeunesse",
		description: "Films et séries adolescent et adulte",
		gradient:
			"linear-gradient(135deg, #4A90E2 0%, #667EEA 100%)",
		cardGradient: "linear-gradient(135deg, #4A90E2, #667EEA)",
		headerGradient:
			"linear-gradient(168deg, rgb(74 144 226) 0%, rgb(102 126 234) 60%, rgb(74 144 226) 100%)",
		sectionGradient:
			"linear-gradient(rgb(74 144 226 / 32%) 0%, transparent 120px)",
	},
	enfant: {
		name: "Enfant",
		description: "Films et séries pour enfant",
		gradient:
			"linear-gradient(135deg, #4A90E2 0%, #667EEA 100%)",
		cardGradient: "linear-gradient(135deg, #4A90E2, #667EEA)",
		headerGradient:
			"linear-gradient(168deg, rgb(74 144 226) 0%, rgb(102 126 234) 60%, rgb(74 144 226) 100%)",
		sectionGradient:
			"linear-gradient(rgb(74 144 226 / 32%) 0%, transparent 120px)",
	},
	action: {
		name: "Action",
		description: "Classiques et nouveautés films d'actions",
		gradient:
			"linear-gradient(135deg, #4A90E2 0%, #667EEA 100%)",
		cardGradient: "linear-gradient(135deg, #4A90E2, #667EEA)",
		headerGradient:
			"linear-gradient(168deg, rgb(74 144 226) 0%, rgb(102 126 234) 60%, rgb(74 144 226) 100%)",
		sectionGradient:
			"linear-gradient(rgb(74 144 226 / 32%) 0%, transparent 120px)",
	},
	"apple-tv": {
		name: "Apple TV+",
		description: "Les productions originales Apple TV+",
		gradient:
			"linear-gradient(135deg, #94a3b8 0%, #64748b 40%, #475569 60%, #334155 100%)",
		cardGradient: "linear-gradient(16deg, #94a3b8, #334155 30%, #000000)",
		headerGradient:
			"linear-gradient(168deg, rgb(71 85 105) 0%, rgb(100 116 139) 60%, rgb(71 85 105) 100%)",
		sectionGradient:
			"linear-gradient(rgb(148 163 184 / 32%) 0%, transparent 120px)",
	},
	crunchyroll: {
		name: "Crunchyroll",
		description: "Les meilleurs animes en streaming",
		gradient:
			"linear-gradient(135deg, #f97316 0%, #ea580c 40%, #c2410c 60%, #9a3412 100%)",
		cardGradient: "linear-gradient(16deg, #f97316, #7c2d12 30%, #000000)",
		headerGradient:
			"linear-gradient(168deg, rgb(194 65 12) 0%, rgb(234 88 12) 60%, rgb(194 65 12) 100%)",
		sectionGradient:
			"linear-gradient(rgb(249 115 22 / 32%) 0%, transparent 120px)",
	},
	"hbo-max": {
		name: "HBO Max",
		description: "Les séries et films HBO",
		gradient:
			"linear-gradient(135deg, #8b5cf6 0%, #7c3aed 40%, #6d28d9 60%, #5b21b6 100%)",
		cardGradient: "linear-gradient(16deg, #8b5cf6, #4c1d95 30%, #000000)",
		headerGradient:
			"linear-gradient(168deg, rgb(109 40 217) 0%, rgb(124 58 237) 60%, rgb(109 40 217) 100%)",
		sectionGradient:
			"linear-gradient(rgb(139 92 246 / 32%) 0%, transparent 120px)",
	},
	youtube: {
		name: "YouTube",
		description: "Films et séries disponibles sur YouTube",
		gradient:
			"linear-gradient(135deg, #dc2626 0%, #b91c1c 40%, #991b1b 60%, #7f1d1d 100%)",
		cardGradient: "linear-gradient(16deg, #dc2626, #7f1d1d 30%, #000000)",
		headerGradient:
			"linear-gradient(168deg, rgb(153 27 27) 0%, rgb(185 28 28) 60%, rgb(153 27 27) 100%)",
		sectionGradient:
			"linear-gradient(rgb(220 38 38 / 32%) 0%, transparent 120px)",
	},
	// "canal-plus": {
	// 	name: "Canal+",
	// 	description: "Les programmes Canal+",
	// 	gradient:
	// 		"linear-gradient(135deg, #000000 0%, #18181b 40%, #27272a 60%, #3f3f46 100%)",
	// 	cardGradient: "linear-gradient(16deg, #18181b, #000000 30%, #000000)",
	// 	headerGradient:
	// 		"linear-gradient(168deg, rgb(39 39 42) 0%, rgb(24 24 27) 60%, rgb(39 39 42) 100%)",
	// 	sectionGradient:
	// 		"linear-gradient(rgb(24 24 27 / 32%) 0%, transparent 120px)",
	// },
	// ocs: {
	// 	name: "OCS",
	// 	description: "Le meilleur du cinéma et des séries",
	// 	gradient:
	// 		"linear-gradient(135deg, #f59e0b 0%, #d97706 40%, #b45309 60%, #92400e 100%)",
	// 	cardGradient: "linear-gradient(16deg, #f59e0b, #78350f 30%, #000000)",
	// 	headerGradient:
	// 		"linear-gradient(168deg, rgb(180 83 9) 0%, rgb(217 119 6) 60%, rgb(180 83 9) 100%)",
	// 	sectionGradient:
	// 		"linear-gradient(rgb(245 158 11 / 32%) 0%, transparent 120px)",
	// },
	// "paramount-plus": {
	// 	name: "Paramount+",
	// 	description: "Films et séries Paramount+",
	// 	gradient:
	// 		"linear-gradient(135deg, #0ea5e9 0%, #0284c7 40%, #0369a1 60%, #075985 100%)",
	// 	cardGradient: "linear-gradient(16deg, #0ea5e9, #0c4a6e 30%, #000000)",
	// 	headerGradient:
	// 		"linear-gradient(168deg, rgb(3 105 161) 0%, rgb(2 132 199) 60%, rgb(3 105 161) 100%)",
	// 	sectionGradient:
	// 		"linear-gradient(rgb(14 165 233 / 32%) 0%, transparent 120px)",
	// },
	// "rakuten-tv": {
	// 	name: "Rakuten TV",
	// 	description: "Location et achat de films",
	// 	gradient:
	// 		"linear-gradient(135deg, #dc2626 0%, #b91c1c 40%, #991b1b 60%, #7f1d1d 100%)",
	// 	cardGradient: "linear-gradient(16deg, #dc2626, #450a0a 30%, #000000)",
	// 	headerGradient:
	// 		"linear-gradient(168deg, rgb(153 27 27) 0%, rgb(185 28 28) 60%, rgb(153 27 27) 100%)",
	// 	sectionGradient:
	// 		"linear-gradient(rgb(220 38 38 / 32%) 0%, transparent 120px)",
	// },
};
