import { ListChecks, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";
import type { Content } from "@/types/content";

interface TrendingItem {
	id: number;
	title?: string;
	name?: string;
	poster_path?: string;
	backdrop_path?: string;
	media_type: string;
}

interface HeroSectionProps {
	content: Content;
	trending: TrendingItem[];
	watchlistsUrl: string;
}

const GRID_INDICES = Array.from({ length: 24 }, (_, i) => i);
const POSTER_SLOTS = [0, 1, 2, 3];

export function HeroSection({
	content,
	trending,
	watchlistsUrl,
}: HeroSectionProps) {
	// Create organized watchlist groups with cycling through available items
	const createWatchlistGroup = (items: TrendingItem[], startIdx: number) => {
		if (items.length === 0) return [];

		// Create 4 items by cycling through the trending array
		return Array.from({ length: 4 }, (_, i) => {
			const index = (startIdx + i) % items.length;
			return items[index];
		});
	};

	return (
		<section className="to-background relative min-h-[80vh] overflow-hidden bg-linear-to-br from-slate-900">
			{/* Organized Watchlist Background Grid - Static */}
			<div className="absolute inset-0 opacity-20">
				<div className="container mx-auto grid h-full grid-cols-6 gap-3 p-8">
					{/* Create mini watchlist cards */}
					{GRID_INDICES.map((groupIdx) => (
						<div
							key={`watchlist-${groupIdx}`}
							className="flex flex-col gap-1 rounded-lg border border-white/10 bg-slate-900/50 p-2 backdrop-blur-sm"
						>
							{/* Mini watchlist title bar */}
							<div className="mb-1 h-2 w-3/4 rounded bg-white/20"></div>
							{/* Mini poster grid 2x2 */}
							<div className="grid grid-cols-2 gap-0.5">
								{(() => {
									const groupItems = createWatchlistGroup(
										trending,
										groupIdx * 4
									);
									if (groupItems.length === 0) return null;
									return POSTER_SLOTS.map((slotIdx) => {
										const item = groupItems[slotIdx];
										return (
											<div
												key={`poster-${groupIdx}-${slotIdx}`}
												className="aspect-2/3 overflow-hidden rounded-sm bg-slate-800"
											>
												{item?.poster_path && (
													<img
														src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
														alt=""
														className="h-full w-full object-cover opacity-60"
													/>
												)}
											</div>
										);
									});
								})()}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Gradient Overlays */}
			<div className="via-background/60 to-background pointer-events-none absolute inset-0 bg-linear-to-b from-transparent"></div>
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>

			{/* Hero Content */}
			<div className="relative z-10 flex min-h-[80vh] flex-col items-center justify-center px-4 py-20 text-center">
				{/* Feature Pills - Top */}
				<div className="mb-8 flex flex-wrap items-center justify-center gap-4">
					<div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 backdrop-blur-sm">
						<ListChecks className="h-4 w-4 text-blue-400" />
						<span className="text-sm text-gray-300">
							{content.home.hero.pills.organize}
						</span>
					</div>
					<div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 backdrop-blur-sm">
						<Users className="h-4 w-4 text-purple-400" />
						<span className="text-sm text-gray-300">
							{content.home.hero.pills.share}
						</span>
					</div>
					<div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 backdrop-blur-sm">
						<Sparkles className="h-4 w-4 text-yellow-400" />
						<span className="text-sm text-gray-300">
							{content.home.hero.pills.discover}
						</span>
					</div>
				</div>

				{/* Main Title */}
				<h1 className="mb-6 max-w-4xl text-5xl leading-tight font-bold md:text-7xl">
					<span className="text-white">
						{content.home.hero.title.split(" ").slice(0, 2).join(" ")}
					</span>{" "}
					<span className="text-gray-400">
						{content.home.hero.title.split(" ").slice(2).join(" ")}
					</span>
				</h1>

				<p className="mb-12 max-w-2xl text-xl text-gray-300">
					{content.home.hero.subtitle}
				</p>

				{/* CTA Button - Gray */}
				<Link
					to={watchlistsUrl}
					className="corner-squircle inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-gray-200 px-6 py-[1.4rem] text-sm font-semibold whitespace-nowrap text-black transition-colors hover:bg-gray-300"
				>
					{content.home.hero.cta}
				</Link>
			</div>
		</section>
	);
}
