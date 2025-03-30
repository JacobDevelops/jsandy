import { ChevronLeft, ChevronRight, Ellipsis } from "lucide-react";
import { type ButtonProps, buttonVariants } from "@jsandy/ui/button";
import { cn } from "@jsandy/ui/cn";
import * as React from "react";

/**
 * Pagination component for navigating through multiple pages of content.
 *
 * This component serves as the main container for pagination controls. It manages the current page state and renders the necessary pagination elements, such as previous, next, and page links.
 */
const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
	<nav
		aria-label="pagination"
		className={cn("mx-auto flex w-full justify-center", className)}
		{...props}
	/>
);
Pagination.displayName = "Pagination";

/**
 * PaginationContent component for rendering the content associated with the current page.
 *
 * This component displays the content for the currently selected page in the pagination system. It is typically used to dynamically update content based on the active page.
 */

const PaginationContent = React.forwardRef<
	HTMLUListElement,
	React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
	<ul
		ref={ref}
		className={cn("flex flex-row items-center gap-1", className)}
		{...props}
	/>
));
PaginationContent.displayName = "PaginationContent";

/**
 * PaginationItem component for rendering an individual page or navigation control.
 *
 * This component represents a clickable item in the pagination system, such as a specific page number or a navigation control like "Previous" or "Next."
 */
const PaginationItem = React.forwardRef<
	HTMLLIElement,
	React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
	<li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
	/** Whether the link is currently active or not */
	isActive?: boolean;
} & Pick<ButtonProps, "size"> &
	React.ComponentProps<"a">;

/**
 * PaginationLink component for rendering a clickable link to a specific page.
 *
 * This component is used to navigate between pages in the pagination system. It renders a link that directs the user to the page associated with the link's label.
 */
const PaginationLink = ({
	className,
	isActive,
	size = "icon",
	...props
}: PaginationLinkProps) => (
	<a
		aria-current={isActive ? "page" : undefined}
		className={cn(
			buttonVariants({
				variant: isActive ? "outline" : "ghost",
				size,
			}),
			className,
		)}
		{...props}
	/>
);
PaginationLink.displayName = "PaginationLink";

/**
 * PaginationPrevious component for navigating to the previous page.
 *
 * This component provides a control that allows users to go to the previous page in the pagination system. It is typically disabled if the user is on the first page.
 */
const PaginationPrevious = ({
	className,
	...props
}: React.ComponentProps<typeof PaginationLink>) => (
	<PaginationLink
		aria-label="Go to previous page"
		size="default"
		className={cn("gap-1 pl-2.5", className)}
		{...props}
	>
		<ChevronLeft className="h-4 w-4" />
		<span>Previous</span>
	</PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

/**
 * PaginationNext component for navigating to the next page.
 *
 * This component provides a control that allows users to go to the next page in the pagination system. It is typically disabled if the user is on the last page.
 */
const PaginationNext = ({
	className,
	...props
}: React.ComponentProps<typeof PaginationLink>) => (
	<PaginationLink
		aria-label="Go to next page"
		size="default"
		className={cn("gap-1 pr-2.5", className)}
		{...props}
	>
		<span>Next</span>
		<ChevronRight className="h-4 w-4" />
	</PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

/**
 * PaginationEllipsis component for indicating that there are more pages not directly visible.
 *
 * This component displays an ellipsis ("...") in the pagination system, signaling that there are additional pages between the current range of visible page links.
 */
const PaginationEllipsis = ({
	className,
	...props
}: React.ComponentProps<"span">) => (
	<span
		aria-hidden
		className={cn("flex h-9 w-9 items-center justify-center", className)}
		{...props}
	>
		<Ellipsis className="h-4 w-4" />
		<span className="sr-only">More pages</span>
	</span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
};
export type { PaginationLinkProps };
