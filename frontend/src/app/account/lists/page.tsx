import type { Metadata } from "next";
import { Suspense } from "react";
import { ListsContent } from "./ListsContent";

export const metadata: Metadata = {
	title: "Mes Listes",
	description: "Gérez vos listes de films et séries",
};

function ListsLoading() {
	return (
		<div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 py-8">
			<div className="text-muted-foreground">Chargement...</div>
		</div>
	);
}

export default function AccountListsPage() {
	return (
		<Suspense fallback={<ListsLoading />}>
			<ListsContent />
		</Suspense>
	);
}
