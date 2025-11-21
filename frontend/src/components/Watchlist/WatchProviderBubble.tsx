import { getWatchProviderLogo } from "@/lib/api-client";
// import appleTv from "../../assets/watchProvider/appleTv.svg";

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
			className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted"
			title={providerName}
		>
			<img
				src={localLogo}
				alt={providerName}
				className="aspect-auto h-full w-full object-contain p-1"
				loading="lazy"
			/>
			{/* Gradient overlay for depth */}
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
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
	maxVisible = 4,
}: WatchProviderListProps) {
	// Filter out invalid providers and those without logos
	// Also deduplicate Prime Video variants (keep only one)
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

		// Deduplicate Prime Video variants
		const normalizedName = p.name.toLowerCase();
		if (normalizedName.includes("prime video")) {
			if (seen.has("prime video")) {
				return false; // Skip duplicate Prime Video
			}
			seen.add("prime video");
		}

		return true;
	});

	if (validProviders.length === 0) {
		return <span className="text-xs text-muted-foreground">—</span>;
	}

	const visibleProviders = validProviders.slice(0, maxVisible);
	const remainingCount = validProviders.length - maxVisible;

	return (
		<div className="flex flex-wrap gap-2">
			{visibleProviders.map((platform, idx) => (
				<WatchProviderBubble
					key={`${platform.name}-${idx}`}
					providerName={platform.name}
					index={idx}
				/>
			))}
			{remainingCount > 0 && (
				<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground">
					+{remainingCount}
				</div>
			)}
		</div>
	);
}
