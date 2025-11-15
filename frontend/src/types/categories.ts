// Allowed watchlist categories/tags
export const WATCHLIST_CATEGORIES = [
  "movies",
  "series",
  "netflix",
  "prime-video",
  "disney-plus",
  "jeunesse",
  "enfant",
  "action",
  "anime",
  "documentaries",
] as const;

export type WatchlistCategory = (typeof WATCHLIST_CATEGORIES)[number];

export interface CategoryInfo {
  id: WatchlistCategory;
  name: string;
  description: string;
  gradient: string;
}

// Category display information
export const CATEGORY_INFO: Record<WatchlistCategory, Omit<CategoryInfo, "id">> = {
  movies: {
    name: "Films",
    description: "Les meilleurs films du moment",
    gradient: "linear-gradient(16deg, #10b981, #0a4d3a 60%, #000000)",
  },
  series: {
    name: "Séries",
    description: "Les séries à ne pas manquer",
    gradient: "linear-gradient(16deg, #f59e0b, #7c4d07 60%, #000000)",
  },
  netflix: {
    name: "Netflix",
    description: "Les pépites Netflix",
    gradient: "linear-gradient(16deg, #e50914, #8b0a0d 60%, #000000)",
  },
  "prime-video": {
    name: "Prime Video",
    description: "Exclusivités Amazon Prime",
    gradient: "linear-gradient(16deg, #00a8e1, #005573 60%, #000000)",
  },
  "disney-plus": {
    name: "Disney+",
    description: "L'univers Disney, Pixar, Marvel et Star Wars",
    gradient: "linear-gradient(16deg, #14b8a6, #0a5c53 60%, #000000)",
  },
  jeunesse: {
    name: "Jeunesse",
    description: "Films et séries adolescent et adulte",
    gradient: "linear-gradient(16deg, #6b7280, #374151 60%, #000000)",
  },
  enfant: {
    name: "Enfant",
    description: "Films et séries pour enfant",
    gradient: "linear-gradient(16deg, #3b82f6, #1e3a8a 60%, #000000)",
  },
  action: {
    name: "Action",
    description: "Classiques et nouveautés films d'actions",
    gradient: "linear-gradient(16deg, #ef4444, #7f1d1d 60%, #000000)",
  },
  anime: {
    name: "Anime",
    description: "Les meilleurs anime et manga adaptés",
    gradient: "linear-gradient(16deg, #ec4899, #831843 60%, #000000)",
  },
  documentaries: {
    name: "Documentaires",
    description: "Documentaires captivants et éducatifs",
    gradient: "linear-gradient(16deg, #06b6d4, #164e63 60%, #000000)",
  },
};
