import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect } from "react";

interface NavigationArrowsProps {
	onPrevious?: () => void;
	onNext?: () => void;
	enableKeyboard?: boolean;
}

export function NavigationArrows({
	onPrevious,
	onNext,
	enableKeyboard = true,
}: NavigationArrowsProps) {
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "ArrowLeft" && onPrevious) {
				e.preventDefault();
				onPrevious();
			} else if (e.key === "ArrowRight" && onNext) {
				e.preventDefault();
				onNext();
			}
		},
		[onPrevious, onNext]
	);

	useEffect(() => {
		if (!enableKeyboard || (!onPrevious && !onNext)) return;
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [enableKeyboard, onPrevious, onNext, handleKeyDown]);

	if (!onPrevious && !onNext) return null;

	return (
		<>
			{onPrevious && (
				<div
					role="button"
					tabIndex={0}
					data-nav-button
					onClick={(e) => {
						e.stopPropagation();
						onPrevious();
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							onPrevious();
						}
					}}
					className="pointer-events-auto fixed top-1/2 left-4 z-100 flex aspect-square w-16 -translate-y-1/2 cursor-pointer items-center justify-center"
					aria-label="Previous"
				>
					<ChevronLeft className="h-9 w-9 opacity-90 transition-opacity hover:opacity-100" />
				</div>
			)}
			{onNext && (
				<div
					role="button"
					tabIndex={0}
					data-nav-button
					onClick={(e) => {
						e.stopPropagation();
						onNext();
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							onNext();
						}
					}}
					className="pointer-events-auto fixed top-1/2 right-4 z-100 flex aspect-square w-16 -translate-y-1/2 cursor-pointer items-center justify-center"
					aria-label="Next"
				>
					<ChevronRight className="h-9 w-9 opacity-90 transition-opacity hover:opacity-100" />
				</div>
			)}
		</>
	);
}
