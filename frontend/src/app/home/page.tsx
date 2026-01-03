import type { Metadata } from "next";
import { HomeContent } from "./HomeContent";

export const metadata: Metadata = {
	title: "Accueil",
	description: "Découvrez les films et séries tendance",
};

export default function HomePage() {
	return <HomeContent />;
}
