import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<section
			className={cn(
				"container mx-auto w-(--sectionWidth) max-w-(--maxWidth) px-12 py-11",
				className
			)}
		>
			{children}
		</section>
	);
}
