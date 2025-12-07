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

export function HeroSection2({
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

	// Map groupIdx to avoid repetition in last column (col 6)
	// Last column (col 6: indices 5, 11, 17, 23) uses images from column 3 (indices 2, 8, 14, 20)
	const getStartIdx = (groupIdx: number) => {
		// Check if this is column 6 (last column in 6-column grid)
		if (groupIdx % 6 === 5) {
			// Map to column 3 (same row)
			const remappedIdx = groupIdx - 3;
			return remappedIdx * 4;
		}
		return groupIdx * 4;
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
									const isColumn6 = groupIdx % 6 === 5;

									if (isColumn6) {
										// For column 6, use images 2,3 from column 3 and images 2,3 from column 4
										const col3Idx = groupIdx - 3;
										const col4Idx = groupIdx - 2;

										const col3Items = createWatchlistGroup(
											trending,
											col3Idx * 4
										);
										const col4Items = createWatchlistGroup(
											trending,
											col4Idx * 4
										);

										if (col3Items.length === 0 || col4Items.length === 0)
											return null;

										// Combine: [img2 col3, img3 col3, img2 col4, img3 col4]
										const combinedItems = [
											col3Items[2],
											col3Items[3],
											col4Items[2],
											col4Items[3],
										];

										return combinedItems.map((item, renderIdx) => (
											<div
												key={`poster-${groupIdx}-${renderIdx}`}
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
										));
									}

									// For all other columns, use normal logic
									const groupItems = createWatchlistGroup(
										trending,
										getStartIdx(groupIdx)
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
						<Sparkles className="h-4 w-4 text-yellow-400" />
						<span className="text-sm text-gray-300">
							{content.home.hero.pills.discover}
						</span>
					</div>
					<div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 backdrop-blur-sm">
						<Users className="h-4 w-4 text-purple-400" />
						<span className="text-sm text-gray-300">
							{content.home.hero.pills.share}
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

				{/* CTA Buttons */}
				<div className="flex flex-wrap items-center justify-center gap-4">
					<Link
						to={watchlistsUrl}
						className="corner-squircle inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-gray-200 px-6 py-[1.4rem] text-sm font-semibold whitespace-nowrap text-black transition-colors hover:bg-gray-300"
					>
						{content.home.hero.cta}
					</Link>
					<button
						type="button"
						onClick={() => {
							const featuresSection = document.querySelector(
								"section:nth-of-type(3)"
							);
							featuresSection?.scrollIntoView({
								behavior: "smooth",
								block: "start",
							});
						}}
						className="corner-squircle inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-gray-400/30 bg-transparent px-6 py-[1.4rem] text-sm font-semibold whitespace-nowrap text-gray-200 transition-colors hover:border-gray-400/50 hover:bg-gray-400/10"
					>
						{content.home.hero.ctaSecondary}
					</button>
				</div>
			</div>
		</section>
	);
}
