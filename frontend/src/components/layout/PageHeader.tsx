import { ArrowLeft } from "lucide-react";

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
				<button
					type="button"
					onClick={onBack}
					className="text-muted-foreground flex cursor-pointer items-center gap-2 text-sm transition-colors hover:text-white"
				>
					<ArrowLeft className="h-4 w-4" />
					<span>{backLabel}</span>
				</button>
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
