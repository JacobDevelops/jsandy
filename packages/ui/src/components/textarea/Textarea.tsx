import { cn } from "@jsandy/ui/cn";
import * as React from "react";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Textarea component for multi-line text input
 *
 * The Textarea component provides a customizable multi-line text input field. It's designed to be flexible and consistent with other form components while allowing for larger text inputs.
 *
 * Key features:
 * - Customizable appearance through className prop
 * - Consistent styling with other form components
 * - Supports all standard textarea attributes
 * - Accessible focus states
 * - Disabled state styling
 *
 * Usage considerations:
 * - Use for longer text inputs where multiple lines are expected or allowed
 * - Consider setting an appropriate initial height and allowing for resizing
 * - Provide clear labels or placeholders to indicate the expected input
 * - Use in conjunction with form validation for required fields
 * - Ensure sufficient color contrast for placeholder text
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, ...props }, ref) => {
		return (
			<textarea
				className={cn(
					"flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
					"placeholder:text-muted-foreground",
					"focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
					"disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Textarea.displayName = "Textarea";

export { Textarea };
