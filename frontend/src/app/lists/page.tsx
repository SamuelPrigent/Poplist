import type { Metadata } from 'next';
import ListsContent from './ListsContent';

export const metadata: Metadata = {
  title: 'Listes',
  description: 'Découvrez les listes de films et séries partagées par la communauté.',
};

export default function CommunityListsPage() {
  return <ListsContent />;
}
