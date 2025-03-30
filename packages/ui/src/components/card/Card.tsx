import { cn } from "@jsandy/ui/cn";
import * as React from "react";

/**
 * Card component for containing and organizing content
 *
 * The Card component provides a flexible container for displaying related content in a visually distinct and structured manner. It serves as a foundational element for creating various UI patterns such as product cards, user profiles, or information panels.
 *
 * Key features:
 * - Provides a visually distinct container with rounded corners and a subtle shadow
 * - Can be composed with CardHeader, CardContent, and CardFooter for structured layout
 * - Customizable through className prop for tailored styling
 * - Accessible, with proper semantic structure
 *
 * Usage considerations:
 * - Use cards to group related information and actions
 * - Maintain consistent padding and spacing within cards for a polished look
 * - Consider using CardTitle and CardDescription within CardHeader for clear content hierarchy
 * - Utilize CardFooter for actions or additional information related to the card's content
 */
const Card = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"rounded-lg border bg-card text-card-foreground shadow-xs",
			className,
		)}
		{...props}
	/>
));
Card.displayName = "Card";

/**
 * CardHeader component for the top section of a card
 *
 * This component is designed to contain the main identifying information of a card, such as its title and a brief description. It provides consistent spacing and layout for these elements.
 */
const CardHeader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex flex-col space-y-1.5 p-6", className)}
		{...props}
	/>
));
CardHeader.displayName = "CardHeader";

/**
 * CardTitle component for the title of a card
 *
 * This component renders the main heading of a card. It uses a larger font size and bold weight to stand out and provide clear identification of the card's purpose or content.
 */
const CardTitle = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
	<h3
		ref={ref}
		className={cn(
			"flex gap-2 font-semibold text-2xl leading-none tracking-tight",
			className,
		)}
		{...props}
	/>
));
CardTitle.displayName = "CardTitle";

/**
 * CardDescription component for additional text in a card
 *
 * This component is used to provide supplementary information or context for the card's content. It's styled with a smaller font size and muted color to visually distinguish it from the main content.
 */
const CardDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<p
		ref={ref}
		className={cn("text-muted-foreground text-sm", className)}
		{...props}
	/>
));
CardDescription.displayName = "CardDescription";

/**
 * CardContent component for the main content area of a card
 *
 * This component is designed to contain the primary content of the card. It provides consistent padding and can house various types of content, from text to complex layouts.
 */
const CardContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

/**
 * CardFooter component for the bottom section of a card
 *
 * This component is used to contain elements that should appear at the bottom of the card, such as action buttons, links, or summary information. It provides consistent spacing and alignment for its contents.
 */
const CardFooter = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex items-center p-6 pt-0", className)}
		{...props}
	/>
));
CardFooter.displayName = "CardFooter";

export {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardDescription,
	CardContent,
};
