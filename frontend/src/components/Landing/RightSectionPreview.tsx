import watchlistsPreview from "@/assets/preview/watchlists.png";

export function RightSectionPreview() {
	return (
		<div className="relative">
			<div className="border-border relative overflow-hidden rounded-[30px] border-4">
				{/* Real app screenshot */}
				<div className="relative aspect-4/3">
					<img
						src={watchlistsPreview}
						alt="Aperçu de l'application WatchlistHub"
						className="relative top-[10px] left-[-21px] h-full w-full object-cover object-left"
					/>
				</div>
				{/* Gradient fade overlay */}
				<div className="to-background pointer-events-none absolute inset-0 bg-linear-to-r from-transparent via-transparent"></div>
			</div>
		</div>
	);
}
