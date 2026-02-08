import type { Metadata } from "next";
import { Suspense } from "react";
import { ListsContent } from "./ListsContent";

export const metadata: Metadata = {
	title: "Mes Listes",
	description: "Gérez vos listes de films et séries",
};

function ListsLoading() {
	return (
		<div className="container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-4 pt-8">
			<div className="bg-muted/50 mb-3 h-9 w-48 animate-pulse rounded-lg" />
			<div className="mb-6 flex items-center justify-between">
				<div className="flex gap-2">
					<div className="bg-muted/50 h-8 w-32 animate-pulse rounded-full" />
					<div className="bg-muted/50 h-8 w-24 animate-pulse rounded-full" />
				</div>
				<div className="bg-muted/50 h-9 w-36 animate-pulse rounded-2xl" />
			</div>
			<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
				{Array.from({ length: 10 }).map((_, i) => (
					<div key={i} className="bg-muted/30 rounded-lg p-2">
						<div className="bg-muted/50 aspect-square w-full animate-pulse rounded-md" />
						<div className="mt-3 space-y-2">
							<div className="bg-muted/50 h-4 w-3/4 animate-pulse rounded" />
							<div className="bg-muted/50 h-3 w-1/2 animate-pulse rounded" />
						</div>
					</div>
				))}
			</div>
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
