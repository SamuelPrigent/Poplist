import type { Metadata } from 'next';
import CategoryDetailContent from './CategoryDetailContent';

export const metadata: Metadata = {
  title: 'Catégorie',
  description: 'Découvrez les listes de cette catégorie.',
};

export default function CategoryDetailPage() {
  return <CategoryDetailContent />;
}
