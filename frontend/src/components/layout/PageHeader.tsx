"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
	title: string;
	subtitle?: string;
	backLabel: string;
	onBack: () => void;
}

export function PageHeader({
	title,
	subtitle,
	backLabel,
	onBack,
}: PageHeaderProps) {
	return (
		<>
			{/* Back Button */}
			<div className="mt-1 mb-3">
				<Button variant="nav-link" size="auto" onClick={onBack}>
					<ArrowLeft className="h-4 w-4" />
					<span>{backLabel}</span>
				</Button>
			</div>

			{/* Header */}
			<div className="mb-8">
				<h1 className="mb-2 text-4xl font-bold text-white">{title}</h1>
				{subtitle && (
					<p className="text-muted-foreground text-base">{subtitle}</p>
				)}
			</div>
		</>
	);
}
