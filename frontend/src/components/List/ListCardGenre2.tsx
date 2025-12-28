import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useState } from "react";
import type { Watchlist } from "@/lib/api-client";
import type { Content } from "@/types/content";

interface ListCardGenre2Props {
	watchlist: Watchlist;
	content: Content;
	href: string;
	genreId?: string;
	showOwner?: boolean;
	index?: number;
}

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

// Meteors component
function Meteors({ number = 3 }: { number?: number }) {
	const meteors = new Array(number).fill(true);
	return (
		<>
			{meteors.map((_, idx) => (
				<motion.span
					key={idx}
					className="absolute top-0 left-1/2 h-0.5 w-0.5 rounded-full bg-white shadow-[0_0_0_1px_#ffffff10]"
					style={{
						top: `${Math.random() * 100}%`,
						left: `${Math.random() * 100}%`,
					}}
					animate={{
						x: [0, -300],
						y: [0, 300],
						opacity: [1, 0],
					}}
					transition={{
						duration: Math.random() * 2 + 2,
						repeat: Number.POSITIVE_INFINITY,
						repeatDelay: Math.random() * 5 + 5,
						ease: "linear",
					}}
				>
					<svg
						width="100"
						height="2"
						viewBox="0 0 100 2"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="absolute -z-10 -translate-y-1/2"
					>
						<path
							d="M0 1H100"
							stroke="url(#gradient)"
							strokeWidth="2"
							strokeLinecap="round"
						/>
						<defs>
							<linearGradient id="gradient" x1="0" y1="0" x2="100" y2="0">
								<stop offset="0%" stopColor="white" stopOpacity="0" />
								<stop offset="100%" stopColor="white" stopOpacity="1" />
							</linearGradient>
						</defs>
					</svg>
				</motion.span>
			))}
		</>
	);
}

export function ListCardGenre2({
	watchlist,
	content,
	href,
	showOwner = false,
	index = 0,
}: ListCardGenre2Props) {
	// Apply color variation based on card index
	const colors = {
		from: varyColor(baseColors.from, index),
		to: varyColor(baseColors.to, index),
		accent: varyColor(baseColors.accent, index),
	};

	// Create very transparent tinted background based on the first color (2% opacity)
	const tintedBg = `${colors.from}05`;

	const [isHovered, setIsHovered] = useState(false);

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
				className="relative mb-3 aspect-square w-full overflow-hidden rounded-xl"
				style={{ backgroundColor: tintedBg }}
			>
				{/* Animated gradient border */}
				<motion.div
					className="absolute inset-0 rounded-xl opacity-75"
					style={{
						background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
						padding: "2px",
					}}
				>
					<div className="h-full w-full rounded-xl" style={{ backgroundColor: tintedBg }}></div>
				</motion.div>

				{/* Content */}
				<div className="absolute inset-[2px] flex items-center justify-center overflow-hidden rounded-xl p-6" style={{ backgroundColor: tintedBg }}>
					{/* Meteors effect */}
					{isHovered && <Meteors number={5} />}

					{/* Gradient accent line */}
					<motion.div
						className="absolute top-0 right-0 left-0 h-1"
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
					></motion.div>

					{/* Genre name with modern typography */}
					<div className="relative z-10 text-center">
						<motion.h3
							className="text-2xl font-bold tracking-tight"
							style={{
								background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
								WebkitBackgroundClip: "text",
								WebkitTextFillColor: "transparent",
								backgroundClip: "text",
								color: "transparent",
							}}
							whileHover={{ scale: 1.05 }}
						>
							{watchlist.name}
						</motion.h3>

						{/* Underline accent */}
						<motion.div
							className="mx-auto mt-2 h-0.5"
							style={{ backgroundColor: colors.accent }}
							initial={{ width: 0 }}
							animate={{ width: "60%" }}
							transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
						></motion.div>
					</div>

					{/* Corner accents */}
					<div
						className="absolute top-2 left-2 h-4 w-4 rounded-tl border-t-2 border-l-2"
						style={{ borderColor: colors.accent }}
					></div>
					<div
						className="absolute right-2 bottom-2 h-4 w-4 rounded-br border-r-2 border-b-2"
						style={{ borderColor: colors.accent }}
					></div>

					{/* Floating particles on hover */}
					{isHovered && (
						<>
							{[...Array(8)].map((_, i) => (
								<motion.div
									key={i}
									className="absolute h-1 w-1 rounded-full"
									style={{
										backgroundColor: colors.accent,
										top: `${Math.random() * 100}%`,
										left: `${Math.random() * 100}%`,
									}}
									animate={{
										y: [0, -50, -100],
										opacity: [0, 1, 0],
										scale: [0, 1, 0],
									}}
									transition={{
										duration: 2,
										delay: i * 0.1,
										repeat: Number.POSITIVE_INFINITY,
									}}
								/>
							))}
						</>
					)}
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
