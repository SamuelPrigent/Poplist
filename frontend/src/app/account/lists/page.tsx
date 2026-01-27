import type { Metadata } from "next";
import { Suspense } from "react";
import { ListsContent } from "./ListsContent";

export const metadata: Metadata = {
	title: "Mes Listes",
	description: "Gérez vos listes de films et séries",
};

function ListsLoading() {
	return null;
}

export default function AccountListsPage() {
	return (
		<Suspense fallback={<ListsLoading />}>
			<ListsContent />
		</Suspense>
	);
}
