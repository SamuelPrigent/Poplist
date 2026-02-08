import type { Metadata } from 'next';
import LandingContent from './LandingContent';

export const metadata: Metadata = {
  title: 'Poplist - Créez des listes de films et séries',
  description: 'Créez, partagez et découvrez des listes de films et séries avec vos amis.',
};

export default function LandingPage() {
  return <LandingContent />;
}
