import type { Metadata } from 'next';
import { ListsOfflineContent } from './ListsOfflineContent';

export const metadata: Metadata = {
  title: 'Mes Listes (Local)',
  description: 'Gérez vos listes locales de films et séries',
};

export default function LocalListsPage() {
  return <ListsOfflineContent />;
}
