"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
	title: string;
	subtitle?: string;
	backLabel: string;
	onBack: () => void;
	/** Mobile (< 750px) : masque la description et resserre la marge basse. */
	hideSubtitleOnMobile?: boolean;
	/** Classes supplémentaires sur le bloc titre (ex. surcharger la marge basse). */
	className?: string;
}

export function PageHeader({
	title,
	subtitle,
	backLabel,
	onBack,
	hideSubtitleOnMobile = false,
	className,
}: PageHeaderProps) {
	return (
		<>
			{/* Back Button */}
			<div className="mt-1 mb-3 max-[749px]:mb-1">
				<Button variant="nav-link" size="auto" onClick={onBack}>
					<ArrowLeft className="h-4 w-4" />
					<span>{backLabel}</span>
				</Button>
			</div>

			{/* Header */}
			<div
				className={cn(
					"mb-8 max-[749px]:mb-6",
					hideSubtitleOnMobile && "max-[749px]:mb-[13px]",
					className,
				)}
			>
				<h1 className="mb-2 text-4xl font-bold text-white max-[749px]:text-3xl">{title}</h1>
				{subtitle && (
					<p
						className={cn(
							"text-muted-foreground text-base max-[749px]:text-sm",
							hideSubtitleOnMobile && "max-[749px]:hidden",
						)}
					>
						{subtitle}
					</p>
				)}
			</div>
		</>
	);
}
