import { cn } from "@jsandy/ui/cn";
import type * as React from "react";

/**
 * Skeleton component for displaying a placeholder while content is loading
 *
 * The Skeleton component provides a visual placeholder that mimics the shape and structure of the content that is being loaded. It's used to improve perceived performance and create a smoother user experience during content loading.
 *
 * Key features:
 * - Animated pulse effect to indicate loading state
 * - Customizable appearance through className prop
 * - Adapts to the size of its container
 * - Can be used for various content types (text, images, buttons, etc.)
 *
 * Usage considerations:
 * - Use Skeletons to represent the layout of your page before the content has loaded
 * - Match the Skeleton's shape and size to the content it's replacing for a smoother transition
 * - Consider using multiple Skeleton components to represent complex layouts
 * - Avoid using Skeletons for very short loading times (less than 300ms) as it may create a flickering effect
 * - Ensure sufficient color contrast between the Skeleton and its background for visibility
 */
export function Skeleton({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("animate-pulse rounded-md bg-zinc-200", className)}
			{...props}
		/>
	);
}
