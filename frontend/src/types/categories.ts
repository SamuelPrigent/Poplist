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
  gradient: string; // Gradient for detail page headers
  cardGradient: string; // Gradient for cards in lists
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
  },
  series: {
    name: "Séries",
    description: "Les séries à ne pas manquer",
    gradient:
      "linear-gradient(135deg, #f59e0b 0%, #d97706 40%, #b45309 60%, #92400e 100%)",
    cardGradient: "linear-gradient(16deg, #f59e0b, #7c4d07 30%, #000000)",
  },
  netflix: {
    name: "Netflix",
    description: "Les pépites Netflix",
    gradient:
      "linear-gradient(135deg, #e50914 0%, #b20710 40%, #8b0a0d 60%, #5c0709 100%)",
    cardGradient: "linear-gradient(16deg, #e50914, #8b0a0d 30%, #000000)",
  },
  "prime-video": {
    name: "Prime Video",
    description: "Exclusivités Amazon Prime",
    gradient:
      "linear-gradient(135deg, #00a8e1 0%, #0284c7 40%, #0369a1 60%, #075985 100%)",
    cardGradient: "linear-gradient(16deg, #00a8e1, #005573 30%, #000000)",
  },
  "disney-plus": {
    name: "Disney+",
    description: "L'univers Disney, Pixar, Marvel et Star Wars",
    gradient:
      "linear-gradient(135deg, #14b8a6 0%, #0d9488 40%, #0f766e 60%, #115e59 100%)",
    cardGradient: "linear-gradient(16deg, #14b8a6, #0a5c53 30%, #000000)",
  },
  anime: {
    name: "Animation",
    description: "Les meilleurs séries et films d'animation et manga adaptés",
    gradient:
      "linear-gradient(135deg, #ec4899 0%, #db2777 40%, #be185d 60%, #9f1239 100%)",
    cardGradient: "linear-gradient(16deg, #ec4899, #831843 30%, #000000)",
  },
  documentaries: {
    name: "Documentaires",
    description: "Documentaires captivants et éducatifs",
    gradient:
      "linear-gradient(135deg, #06b6d4 0%, #0891b2 40%, #0e7490 60%, #155e75 100%)",
    cardGradient: "linear-gradient(16deg, #06b6d4, #164e63 30%, #000000)",
  },
  jeunesse: {
    name: "Jeunesse",
    description: "Films et séries adolescent et adulte",
    gradient:
      "linear-gradient(135deg, #6b7280 0%, #4b5563 40%, #374151 60%, #1f2937 100%)",
    cardGradient: "linear-gradient(16deg, #6b7280, #374151 30%, #000000)",
  },
  enfant: {
    name: "Enfant",
    description: "Films et séries pour enfant",
    gradient:
      "linear-gradient(135deg, #3b82f6 0%, #2563eb 40%, #1d4ed8 60%, #1e40af 100%)",
    cardGradient: "linear-gradient(16deg, #3b82f6, #1e3a8a 30%, #000000)",
  },
  action: {
    name: "Action",
    description: "Classiques et nouveautés films d'actions",
    gradient:
      "linear-gradient(135deg, #ef4444 0%, #dc2626 40%, #b91c1c 60%, #991b1b 100%)",
    cardGradient: "linear-gradient(16deg, #ef4444, #7f1d1d 30%, #000000)",
  },
};
