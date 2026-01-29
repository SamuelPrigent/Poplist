import type { Metadata } from 'next';
import CategoriesContent from './CategoriesContent';

export const metadata: Metadata = {
  title: 'Catégories',
  description: 'Explorez les listes par catégorie : action, comédie, horreur et plus encore.',
};

export default function CategoriesPage() {
  return <CategoriesContent />;
}
