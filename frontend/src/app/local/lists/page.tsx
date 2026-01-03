import type { Metadata } from "next";
import { Suspense } from "react";
import { ListsOfflineContent } from "./ListsOfflineContent";

export const metadata: Metadata = {
	title: "Mes Listes (Local)",
	description: "Gérez vos listes locales de films et séries",
};

function ListsLoading() {
	return (
		<div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 py-8">
			<div className="bg-muted mb-8 h-10 w-48 animate-pulse rounded-lg" />
			<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
				{Array.from({ length: 10 }).map((_, i) => (
					<div
						key={`skeleton-${i}`}
						className="bg-muted aspect-square animate-pulse rounded-lg"
					/>
				))}
			</div>
		</div>
	);
}

export default function LocalListsPage() {
	return (
		<Suspense fallback={<ListsLoading />}>
			<ListsOfflineContent />
		</Suspense>
	);
}
