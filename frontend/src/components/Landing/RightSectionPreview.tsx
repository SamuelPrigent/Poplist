import watchlistsPreview from "@/assets/preview/watchlists.png";

export function RightSectionPreview() {
	return (
		<div className="relative">
			<div className="relative overflow-hidden rounded-[30px] border-4 border-border">
				{/* Real app screenshot */}
				<div className="relative aspect-[4/3]">
					<img
						src={watchlistsPreview}
						alt="Aperçu de l'application WatchlistHub"
						className="relative left-[-21px] top-[10px] h-full w-full object-cover object-left"
					/>
				</div>
				{/* Gradient fade overlay */}
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background"></div>
			</div>
		</div>
	);
}
