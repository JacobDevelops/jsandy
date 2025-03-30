import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@jsandy/ui/cn";

const badgeVariants = cva(
	"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
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

/**
 * Badge component for displaying short pieces of information or status indicators.
 *
 * Badges are small, colorful components typically used to highlight information, show counts, or indicate status. They provide a compact and visually distinct way to draw attention to specific elements or convey quick bits of information.
 *
 * Key features:
 * - Compact design suitable for inline use
 * - Multiple visual variants to convey different types of information
 * - Customizable through className prop for further styling
 * - Accessible focus states for keyboard navigation
 *
 * Common use cases:
 * - Displaying notification counts
 * - Indicating status (e.g., "New", "Updated", "In Progress")
 * - Highlighting features or categories
 * - Showing small counts or metrics
 *
 * The Badge component is designed to be flexible and can be used in various contexts such as next to navigation items, in tables, alongside form elements, or within other components to provide additional visual information.
 */
function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	);
}

export { Badge, badgeVariants };
