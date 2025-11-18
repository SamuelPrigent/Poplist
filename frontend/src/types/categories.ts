import type { Content } from "./content";

// Allowed watchlist categories/tags
export const WATCHLIST_CATEGORIES = [
  "movies",
  "series",
  "netflix",
  "prime-video",
  "disney-plus",
  "anime",
  "action",
  "documentaries",
  "enfant",
  "jeunesse",
] as const;

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
  content: Content,
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
      "linear-gradient(135deg, #10b981 0%, #059669 40%, #047857 60%, #065f46 100%)",
    cardGradient: "linear-gradient(16deg, #10b981, #0a4d3a 30%, #000000)",
    headerGradient:
      "linear-gradient(168deg, rgb(4 120 87) 0%, rgb(5 150 105) 60%, rgb(4 120 87) 100%)",
    sectionGradient:
      "linear-gradient(rgb(16 185 129 / 32%) 0%, transparent 120px)",
  },
  series: {
    name: "Séries",
    description: "Les séries à ne pas manquer",
    gradient:
      "linear-gradient(135deg, #f59e0b 0%, #d97706 40%, #b45309 60%, #92400e 100%)",
    cardGradient: "linear-gradient(16deg, #f59e0b, #7c4d07 30%, #000000)",
    headerGradient:
      "linear-gradient(168deg, rgb(180 83 9) 0%, rgb(217 119 6) 60%, rgb(180 83 9) 100%)",
    sectionGradient:
      "linear-gradient(rgb(245 158 11 / 32%) 0%, transparent 120px)",
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
      "linear-gradient(135deg, #ec4899 0%, #db2777 40%, #be185d 60%, #9f1239 100%)",
    cardGradient: "linear-gradient(16deg, #ec4899, #831843 30%, #000000)",
    headerGradient:
      "linear-gradient(168deg, rgb(190 24 93) 0%, rgb(219 39 119) 60%, rgb(190 24 93) 100%)",
    sectionGradient:
      "linear-gradient(rgb(236 72 153 / 32%) 0%, transparent 120px)",
  },
  documentaries: {
    name: "Documentaires",
    description: "Documentaires captivants et éducatifs",
    gradient:
      "linear-gradient(135deg, #06b6d4 0%, #0891b2 40%, #0e7490 60%, #155e75 100%)",
    cardGradient: "linear-gradient(16deg, #06b6d4, #164e63 30%, #000000)",
    headerGradient:
      "linear-gradient(168deg, rgb(14 116 144) 0%, rgb(8 145 178) 60%, rgb(14 116 144) 100%)",
    sectionGradient:
      "linear-gradient(rgb(6 182 212 / 32%) 0%, transparent 120px)",
  },
  jeunesse: {
    name: "Jeunesse",
    description: "Films et séries adolescent et adulte",
    gradient:
      "linear-gradient(135deg, #6b7280 0%, #4b5563 40%, #374151 60%, #1f2937 100%)",
    cardGradient: "linear-gradient(16deg, #6b7280, #374151 30%, #000000)",
    headerGradient:
      "linear-gradient(168deg, rgb(55 65 81) 0%, rgb(75 85 99) 60%, rgb(55 65 81) 100%)",
    sectionGradient:
      "linear-gradient(rgb(107 114 128 / 32%) 0%, transparent 120px)",
  },
  enfant: {
    name: "Enfant",
    description: "Films et séries pour enfant",
    gradient:
      "linear-gradient(135deg, #3b82f6 0%, #2563eb 40%, #1d4ed8 60%, #1e40af 100%)",
    cardGradient: "linear-gradient(16deg, #3b82f6, #1e3a8a 30%, #000000)",
    headerGradient:
      "linear-gradient(168deg, rgb(29 78 216) 0%, rgb(37 99 235) 60%, rgb(29 78 216) 100%)",
    sectionGradient:
      "linear-gradient(rgb(59 130 246 / 32%) 0%, transparent 120px)",
  },
  action: {
    name: "Action",
    description: "Classiques et nouveautés films d'actions",
    gradient:
      "linear-gradient(135deg, #ef4444 0%, #dc2626 40%, #b91c1c 60%, #991b1b 100%)",
    cardGradient: "linear-gradient(16deg, #ef4444, #7f1d1d 30%, #000000)",
    headerGradient:
      "linear-gradient(168deg, rgb(185 28 28) 0%, rgb(220 38 38) 60%, rgb(185 28 28) 100%)",
    sectionGradient:
      "linear-gradient(rgb(239 68 68 / 32%) 0%, transparent 120px)",
  },
};
