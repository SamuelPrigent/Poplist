"use client";

import Image from "next/image";
import { getWatchProviderLogo } from "@/lib/api-client";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export interface WatchProviderBubbleProps {
	providerName: string;
	logoPath?: string;
	index?: number;
}

/**
 * Component to display a watch provider as a styled bubble/card
 * Uses local SVG when available, falls back to TMDB logo
 */
export function WatchProviderBubble({
	providerName,
	logoPath,
	index = 0,
}: WatchProviderBubbleProps) {
	if (!providerName || providerName.toLowerCase() === "inconnu") {
		return null;
	}

	const providerLogo = getWatchProviderLogo(providerName);
	const tmdbLogo = logoPath ? `https://image.tmdb.org/t/p/w92${logoPath}` : null;
	const logo = providerLogo?.path || tmdbLogo;

	if (!logo) {
		return null;
	}

	return (
		<Tooltip delayDuration={800}>
			<TooltipTrigger asChild>
				<div
					key={`${providerName}-${index}`}
					className="bg-muted relative h-9 w-9 shrink-0 overflow-hidden rounded-lg"
				>
					<Image
						src={logo}
						alt={providerName}
						fill
						sizes="36px"
						className={providerLogo ? `object-contain ${providerLogo.className ?? "p-1"}` : "object-cover"}
						unoptimized={!providerLogo}
					/>
					{/* Gradient overlay for depth */}
					<div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
				</div>
			</TooltipTrigger>
			<TooltipContent>
				{providerName}
			</TooltipContent>
		</Tooltip>
	);
}

/**
 * Normalize provider name to deduplicate variants (e.g. "Netflix Standard with Ads" → "netflix")
 */
function normalizeProviderName(name: string): string {
	const normalized = name.toLowerCase().trim();

	if (normalized.includes("netflix")) return "netflix";
	if (normalized.includes("prime video") || normalized === "amazon video") return "prime video";
	if (normalized.includes("hbo") || normalized === "max" || normalized.includes("max amazon")) return "hbo";
	if (normalized.includes("crunchyroll")) return "crunchyroll";
	if (normalized.includes("disney")) return "disney";
	if (normalized.includes("apple")) return "apple tv";
	if (normalized.includes("canal+") || normalized.includes("canal ")) return "canal+";
	if (normalized.includes("paramount")) return "paramount+";
	if (normalized.includes("ocs") || normalized.includes("cine+ ocs")) return "ocs";
	if (normalized.includes("arte")) return "arte";
	if (normalized.includes("google play")) return "google play";
	if (normalized.includes("rakuten")) return "rakuten";
	if (normalized.includes("orange")) return "orange";
	if (normalized.includes("youtube")) return "youtube";

	return normalized;
}

/**
 * Component to display a list of watch providers with overflow indicator
 */
export interface WatchProviderListProps {
	providers: Array<{ name: string; logoPath: string }>;
	maxVisible?: number;
}

export function WatchProviderList({
	providers,
	maxVisible = 5,
}: WatchProviderListProps) {
	// Filter out invalid providers and deduplicate by normalized name
	const seen = new Set<string>();
	const validProviders = providers.filter((p) => {
		if (!p || !p.name || !p.name.trim() || p.name.toLowerCase() === "inconnu") {
			return false;
		}

		// Must have either a local SVG or a TMDB logo path
		const hasLocalLogo = getWatchProviderLogo(p.name)?.path != null;
		const hasTmdbLogo = !!p.logoPath;
		if (!hasLocalLogo && !hasTmdbLogo) {
			return false;
		}

		// Deduplicate by normalized name
		const normalizedName = normalizeProviderName(p.name);
		if (seen.has(normalizedName)) {
			return false;
		}
		seen.add(normalizedName);

		return true;
	});

	if (validProviders.length === 0) {
		return <span className="text-muted-foreground text-xs">—</span>;
	}

	const visibleProviders = validProviders.slice(0, maxVisible);

	return (
		<TooltipProvider skipDelayDuration={0}>
			<div className="flex flex-wrap gap-2">
				{visibleProviders.map((platform, idx) => (
					<WatchProviderBubble
						key={`${platform.name}-${idx}`}
						providerName={platform.name}
						logoPath={platform.logoPath}
						index={idx}
					/>
				))}
			</div>
		</TooltipProvider>
	);
}
