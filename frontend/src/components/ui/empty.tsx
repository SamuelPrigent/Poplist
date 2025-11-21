import * as React from "react";
import { cn } from "@/lib/cn";

const Empty = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center",
			className,
		)}
		{...props}
	/>
));
Empty.displayName = "Empty";

const EmptyHeader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex flex-col items-center gap-3", className)}
		{...props}
	/>
));
EmptyHeader.displayName = "EmptyHeader";

const EmptyMedia = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & { variant?: "icon" | "image" }
>(({ className, variant = "icon", ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"flex items-center justify-center",
			variant === "icon" && "rounded-full bg-muted p-4",
			className,
		)}
		{...props}
	/>
));
EmptyMedia.displayName = "EmptyMedia";

const EmptyTitle = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
	<h3
		ref={ref}
		className={cn("text-lg font-semibold text-foreground", className)}
		{...props}
	/>
));
EmptyTitle.displayName = "EmptyTitle";

const EmptyDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<p
		ref={ref}
		className={cn("text-sm text-muted-foreground", className)}
		{...props}
	/>
));
EmptyDescription.displayName = "EmptyDescription";

const EmptyContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex items-center gap-2", className)}
		{...props}
	/>
));
EmptyContent.displayName = "EmptyContent";

export {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
	EmptyDescription,
	EmptyContent,
};
