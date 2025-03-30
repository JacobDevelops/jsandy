import { cn } from "@jsandy/ui/cn";
import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Input component for text input fields
 *
 * The Input component provides a flexible and customizable text input field that can be used for various types of user input. It's designed to maintain consistent styling across your application while allowing for easy customization.
 *
 * Key features:
 * - Supports common input types: text, password, email, and number
 * - Consistent styling with other form components
 * - Customizable appearance through className prop
 * - Accessible focus states
 * - Support for disabled state
 * - File input styling
 * - Optional icon support
 *
 * Usage considerations:
 * - Use appropriate input types for different kinds of data (e.g., 'email' for email addresses)
 * - Provide clear labels or placeholders to indicate the expected input
 * - Consider using the 'required' attribute for mandatory fields
 * - Implement proper form validation for user inputs
 * - Ensure sufficient color contrast for placeholder text
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					"flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background",
					"file:border-0 file:bg-transparent file:font-medium file:text-sm",
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
Input.displayName = "Input";

export { Input };
