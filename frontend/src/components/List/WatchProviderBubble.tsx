"use client";

import Image from "next/image";
import { getWatchProviderLogo } from "@/lib/api-client";

export interface WatchProviderBubbleProps {
	providerName: string;
	index?: number;
}

/**
 * Component to display a watch provider as a styled bubble/card
 * Each provider can have custom styling based on its name
 */
export function WatchProviderBubble({
	providerName,
	index = 0,
}: WatchProviderBubbleProps) {
	if (!providerName || providerName.toLowerCase() === "inconnu") {
		return null;
	}

	// Get local logo based on provider name
	const localLogo = getWatchProviderLogo(providerName);

	// If no logo exists for this provider, don't render anything
	if (!localLogo) {
		return null;
	}

	return (
		<div
			key={`${providerName}-${index}`}
			className="bg-muted relative h-9 w-9 shrink-0 overflow-hidden rounded-lg"
			title={providerName}
		>
			<Image
				src={localLogo}
				alt={providerName}
				fill
				sizes="36px"
				className="object-contain p-1"
			/>
			{/* Gradient overlay for depth */}
			<div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
		</div>
	);
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
	// Normalize provider name to deduplicate variants
	const normalizeProviderName = (name: string): string => {
		const normalized = name.toLowerCase().trim();

		// Map all Netflix variants to "netflix"
		if (normalized.includes("netflix")) return "netflix";

		// Map all Prime Video variants to "prime video"
		if (normalized.includes("prime video") || normalized.includes("prime"))
			return "prime video";

		// Map all HBO variants to "hbo"
		if (normalized.includes("hbo")) return "hbo";

		// Map all Crunchyroll variants to "crunchyroll"
		if (normalized.includes("crunchyroll")) return "crunchyroll";

		// Map all Disney+ variants to "disney"
		if (normalized.includes("disney")) return "disney";

		// Map all Apple TV+ variants to "apple tv"
		if (normalized.includes("apple")) return "apple tv";

		return normalized;
	};

	// Filter out invalid providers, deduplicate, and keep only those with logos
	const seen = new Set<string>();
	const validProviders = providers.filter((p) => {
		if (!p || !p.name || !p.name.trim() || p.name.toLowerCase() === "inconnu") {
			return false;
		}

		// Check if provider has a logo
		const hasLogo = getWatchProviderLogo(p.name) !== null;
		if (!hasLogo) {
			return false;
		}

		// Deduplicate by normalized name
		const normalizedName = normalizeProviderName(p.name);
		if (seen.has(normalizedName)) {
			return false; // Skip duplicate provider variant
		}
		seen.add(normalizedName);

		return true;
	});

	if (validProviders.length === 0) {
		return <span className="text-muted-foreground text-xs">—</span>;
	}

	// Limit to maxVisible providers (no "+X" indicator)
	const visibleProviders = validProviders.slice(0, maxVisible);

	return (
		<div className="flex flex-wrap gap-2">
			{visibleProviders.map((platform, idx) => (
				<WatchProviderBubble
					key={`${platform.name}-${idx}`}
					providerName={platform.name}
					index={idx}
				/>
			))}
		</div>
	);
}
