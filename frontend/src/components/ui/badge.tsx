"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
				secondary:
					"border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
				destructive:
					"border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
				outline: "text-foreground",

				// Media type badges
				movie:
					"border-transparent bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
				tv: "border-transparent bg-purple-500/20 text-purple-400 hover:bg-purple-500/30",

				// Genre/category badges
				genre: "border-border bg-muted/50 text-muted-foreground hover:bg-muted",

				// Status badges
				watched: "border-transparent bg-green-500/20 text-green-400",
				unwatched: "border-transparent bg-yellow-500/20 text-yellow-400",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	);
}

export { Badge, badgeVariants };
