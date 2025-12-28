import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useState } from "react";
import type { Watchlist } from "@/lib/api-client";
import type { Content } from "@/types/content";
import arcane from "../../assets/categories/jinx-arcane.png";
import simba from "../../assets/categories/simba.png";
import neo from "../../assets/categories/neo.png";
import friends from "../../assets/categories/friends.png";
import vindiesel from "../../assets/categories/vindiesel.png";
import avatar from "../../assets/categories/avatar.png";
import animal from "../../assets/categories/perroquet.png";

interface WatchlistCardGenre {
	watchlist: Watchlist;
	content: Content;
	href: string;
	genreId?: string;
	showOwner?: boolean;
	index?: number;
}

// Mapping des catégories vers les images iconiques
const categoryImages: Record<string, string> = {
	anime: arcane, // Jinx de Arcane
	enfant: simba, // Simba du Roi Lion
	movies: avatar, // Navi d'Avatar
	series: friends, // Jennifer Aniston de Friends
	documentaries: animal, // Ours blanc
	jeunesse: vindiesel, // Vin Diesel
	action: neo, // Neo de Matrix
};

// Base colors for all categories
const baseColors = { from: "#4A90E2", to: "#667EEA", accent: "#7B68EE" };

// Color variation function to create unique colors per card
function varyColor(baseColor: string, index: number): string {
	// Parse hex color
	const r = Number.parseInt(baseColor.slice(1, 3), 16);
	const g = Number.parseInt(baseColor.slice(3, 5), 16);
	const b = Number.parseInt(baseColor.slice(5, 7), 16);

	// Apply hue rotation based on index
	const variation = (index * 35) % 360; // Rotate hue by 35 degrees per index
	const hsl = rgbToHsl(r, g, b);
	hsl[0] = (hsl[0] + variation) % 360;

	const rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
	return `#${rgb.map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
				break;
			case g:
				h = ((b - r) / d + 2) / 6;
				break;
			case b:
				h = ((r - g) / d + 4) / 6;
				break;
		}
	}

	return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
	h /= 360;
	let r: number;
	let g: number;
	let b: number;

	if (s === 0) {
		r = g = b = l;
	} else {
		const hue2rgb = (p: number, q: number, t: number) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};

		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	return [r * 255, g * 255, b * 255];
}

export function WatchlistCardGenre({
	watchlist,
	content,
	href,
	genreId,
	showOwner = false,
	index = 0,
}: WatchlistCardGenre) {
	// Apply color variation based on card index
	const colors = {
		from: varyColor(baseColors.from, index),
		to: varyColor(baseColors.to, index),
		accent: varyColor(baseColors.accent, index),
	};

	const [isHovered, setIsHovered] = useState(false);

	// Get the category image
	const categoryImage = genreId
		? categoryImages[genreId] || categoryImages.default
		: categoryImages.default;

	return (
		<Link
			to={href}
			className="group block cursor-pointer rounded-lg p-2 transition-colors hover:bg-[#36363780]"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Minimal Card with Border Animation */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.2, ease: "easeOut" }}
				className="relative mb-3 aspect-square w-full overflow-hidden rounded-xl bg-[hsl(227,6%,31%)]"
			>
				{/* Animated gradient border */}
				<motion.div
					className="absolute inset-0 rounded-xl opacity-75"
					style={{
						background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
						padding: "2px",
					}}
				>
					<div className="h-full w-full rounded-xl bg-[hsl(225,13%,25%)]"></div>
				</motion.div>

				{/* Content */}
				<div className="absolute inset-[2px] flex items-end justify-center overflow-hidden rounded-xl bg-[hsl(222.2,84%,4.9%)] p-6">
					{/* Background image - 70% height, centered */}
					{categoryImage && (
						<div className="absolute inset-0 flex items-end justify-center">
							<img
								src={categoryImage}
								alt=""
								className="h-[85%] w-auto object-contain opacity-70"
								style={{ objectPosition: "center bottom" }}
							/>
						</div>
					)}

					{/* Gradient overlay - from transparent to gray */}
					<div
						className="absolute inset-0"
						style={{
							background:
								"linear-gradient(to top, rgba(26, 27, 41, 0.15) 0%, transparent 60%)",
						}}
					/>

					{/* Gradient accent line - only on hover */}
					{isHovered && (
						<motion.div
							className="absolute top-0 right-0 left-0 h-0.5 opacity-40"
							style={{
								background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
							}}
							animate={{
								x: ["-100%", "200%"],
							}}
							transition={{
								duration: 2,
								repeat: Number.POSITIVE_INFINITY,
								ease: "linear",
							}}
						/>
					)}

					{/* Genre name with modern typography */}
					<div className="relative z-10 w-full text-center">
						<motion.h3
							className="text-[22px] font-bold tracking-tight"
							style={{
								// background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
								// WebkitBackgroundClip: "text",
								// WebkitTextFillColor: "transparent",
								// backgroundClip: "text",
								color: "transparent",
								// color: "white",
								backgroundImage:
									"linear-gradient(99deg,rgba(255,255,255,0.717) 0%,rgba(255,255,255,1) 26%,rgba(255,255,255,1) 76%,rgba(255,255,255,0.706) 100%)",
								backgroundClip: "text",
							}}
							animate={{
								scale: isHovered ? 1.02 : 1,
							}}
							transition={{
								duration: 0.2,
								ease: "easeOut",
							}}
						>
							{watchlist.name}
						</motion.h3>
					</div>
				</div>
			</motion.div>

			{/* Text Info */}
			<div className="flex items-center gap-1">
				<h3 className="line-clamp-2 text-[14.5px] font-semibold text-white">
					{watchlist.name}
				</h3>
			</div>

			{showOwner && (
				<p className="text-muted-foreground mt-1 text-xs">
					par{" "}
					{typeof watchlist.ownerId === "object" &&
					watchlist.ownerId !== null &&
					"username" in watchlist.ownerId &&
					watchlist.ownerId.username ? (
						<span className="text-white capitalize">
							{watchlist.ownerId.username}
						</span>
					) : (
						<span className="capitalize">Anonyme</span>
					)}
				</p>
			)}

			<div className="text-muted-foreground mt-1 flex items-center justify-between text-xs">
				<span className="text-muted-foreground">
					{watchlist.items.length}{" "}
					{watchlist.items.length === 1
						? content.watchlists.item
						: content.watchlists.items}
				</span>
			</div>
		</Link>
	);
}
