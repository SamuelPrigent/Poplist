import { getWatchProviderLogo } from "@/lib/api-client";
import { useLanguageStore } from "@/store/language";
import {
	getCategoryInfo,
	PLATFORM_CATEGORIES,
	type PlatformCategory,
} from "@/types/categories";

interface PlatformSelectorProps {
	selected: PlatformCategory[];
	onChange: (selected: PlatformCategory[]) => void;
	disabled?: boolean;
}

export function PlatformSelector({
	selected,
	onChange,
	disabled = false,
}: PlatformSelectorProps) {
	const { content } = useLanguageStore();

	const togglePlatform = (platform: PlatformCategory) => {
		if (disabled) return;

		if (selected.includes(platform)) {
			onChange(selected.filter((p) => p !== platform));
		} else {
			onChange([...selected, platform]);
		}
	};

	return (
		<div className="flex flex-wrap gap-2">
			{PLATFORM_CATEGORIES.map((platform) => {
				const logo = getWatchProviderLogo(platform);
				const categoryInfo = getCategoryInfo(platform, content);
				const isSelected = selected.includes(platform);

				// Don't render if no logo exists
				if (!logo) return null;

				return (
					<button
						type="button"
						key={platform}
						onClick={() => togglePlatform(platform)}
						disabled={disabled}
						className={`group relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border-2 transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
							isSelected
								? "border-primary bg-primary/10 shadow-md"
								: "border-border bg-muted/50 hover:border-muted-foreground/30 hover:bg-muted"
						}`}
						title={categoryInfo.name}
					>
						{/* Logo */}
						<div className="flex h-full w-full items-center justify-center p-1">
							<img
								src={logo}
								alt={categoryInfo.name}
								className={`h-full w-full object-contain transition-opacity ${
									isSelected
										? "opacity-100"
										: "opacity-100 group-hover:opacity-100"
								}`}
							/>
						</div>
					</button>
				);
			})}
		</div>
	);
}
