import type { Content } from "./content";

// Genre categories only (platforms removed)
export const GENRE_CATEGORIES = [
	"movies",
	"series",
	"anime",
	"enfant",
	"documentaries",
	"jeunesse",
	"action",
] as const;

export type GenreCategory = (typeof GENRE_CATEGORIES)[number];

export interface CategoryInfo {
	id: GenreCategory;
	name: string;
	description: string;
	gradient: string;
	cardGradient: string;
	headerGradient: string;
	sectionGradient: string;
}

// Helper function to get translated category info
export const getCategoryInfo = (
	categoryId: GenreCategory,
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
export const CATEGORY_INFO: Record<GenreCategory, Omit<CategoryInfo, "id">> = {
	movies: {
		name: "Films",
		description: "Les meilleurs films du moment",
		gradient: "linear-gradient(135deg, #4A90E2 0%, #667EEA 100%)",
		cardGradient: "linear-gradient(135deg, #4A90E2, #667EEA)",
		headerGradient:
			"linear-gradient(168deg, rgb(74 144 226) 0%, rgb(102 126 234) 60%, rgb(74 144 226) 100%)",
		sectionGradient:
			"linear-gradient(rgb(74 144 226 / 32%) 0%, transparent 120px)",
	},
	series: {
		name: "Séries",
		description: "Les séries à ne pas manquer",
		gradient: "linear-gradient(135deg, #4A90E2 0%, #667EEA 100%)",
		cardGradient: "linear-gradient(135deg, #4A90E2, #667EEA)",
		headerGradient:
			"linear-gradient(168deg, rgb(74 144 226) 0%, rgb(102 126 234) 60%, rgb(74 144 226) 100%)",
		sectionGradient:
			"linear-gradient(rgb(74 144 226 / 32%) 0%, transparent 120px)",
	},
	anime: {
		name: "Animation",
		description: "Les meilleurs séries et films d'animation et manga adaptés",
		gradient: "linear-gradient(135deg, #4A90E2 0%, #667EEA 100%)",
		cardGradient: "linear-gradient(135deg, #4A90E2, #667EEA)",
		headerGradient:
			"linear-gradient(168deg, rgb(74 144 226) 0%, rgb(102 126 234) 60%, rgb(74 144 226) 100%)",
		sectionGradient:
			"linear-gradient(rgb(74 144 226 / 32%) 0%, transparent 120px)",
	},
	enfant: {
		name: "Enfant",
		description: "Films et séries pour enfant",
		gradient: "linear-gradient(135deg, #4A90E2 0%, #667EEA 100%)",
		cardGradient: "linear-gradient(135deg, #4A90E2, #667EEA)",
		headerGradient:
			"linear-gradient(168deg, rgb(74 144 226) 0%, rgb(102 126 234) 60%, rgb(74 144 226) 100%)",
		sectionGradient:
			"linear-gradient(rgb(74 144 226 / 32%) 0%, transparent 120px)",
	},
	documentaries: {
		name: "Documentaires",
		description: "Documentaires captivants et éducatifs",
		gradient: "linear-gradient(135deg, #4A90E2 0%, #667EEA 100%)",
		cardGradient: "linear-gradient(135deg, #4A90E2, #667EEA)",
		headerGradient:
			"linear-gradient(168deg, rgb(74 144 226) 0%, rgb(102 126 234) 60%, rgb(74 144 226) 100%)",
		sectionGradient:
			"linear-gradient(rgb(74 144 226 / 32%) 0%, transparent 120px)",
	},
	jeunesse: {
		name: "Jeunesse",
		description: "Films et séries adolescent et adulte",
		gradient: "linear-gradient(135deg, #4A90E2 0%, #667EEA 100%)",
		cardGradient: "linear-gradient(135deg, #4A90E2, #667EEA)",
		headerGradient:
			"linear-gradient(168deg, rgb(74 144 226) 0%, rgb(102 126 234) 60%, rgb(74 144 226) 100%)",
		sectionGradient:
			"linear-gradient(rgb(74 144 226 / 32%) 0%, transparent 120px)",
	},
	action: {
		name: "Action",
		description: "Classiques et nouveautés films d'actions",
		gradient: "linear-gradient(135deg, #4A90E2 0%, #667EEA 100%)",
		cardGradient: "linear-gradient(135deg, #4A90E2, #667EEA)",
		headerGradient:
			"linear-gradient(168deg, rgb(74 144 226) 0%, rgb(102 126 234) 60%, rgb(74 144 226) 100%)",
		sectionGradient:
			"linear-gradient(rgb(74 144 226 / 32%) 0%, transparent 120px)",
	},
};
