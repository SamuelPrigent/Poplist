import type { Content } from './content';

// Genre categories only (platforms removed)
export const GENRE_CATEGORIES = [
  'movies',
  'series',
  'animation',
  'enfant',
  'jeunesse',
  'documentaries',
  'anime',
  'action',
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

// Gradients communs à toutes les catégories. Si un jour on veut différencier
// par catégorie, basculer sur un Record<GenreCategory, ...>.
const SHARED_GRADIENTS = {
  gradient: 'linear-gradient(135deg, #4A90E2 0%, #667EEA 100%)',
  cardGradient: 'linear-gradient(135deg, #4A90E2, #667EEA)',
  headerGradient:
    'linear-gradient(168deg, rgb(74 144 226) 0%, rgb(102 126 234) 60%, rgb(74 144 226) 100%)',
  sectionGradient: 'linear-gradient(rgb(74 144 226 / 32%) 0%, transparent 120px)',
} as const;

// Helper function to get translated category info
export const getCategoryInfo = (categoryId: GenreCategory, content: Content): CategoryInfo => {
  const translations = content.categories.list[categoryId];
  return {
    id: categoryId,
    name: translations.name,
    description: translations.description,
    ...SHARED_GRADIENTS,
  };
};
