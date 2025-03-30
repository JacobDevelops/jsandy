import { cn } from "@jsandy/ui/cn";
import { Slot } from "@jsandy/ui/slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

export const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:bg-primary/90",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/90",
				outline:
					"border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/60",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-9 rounded-md px-3",
				lg: "h-11 rounded-md px-8",
				icon: "h-10 w-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	/** When true, the component will render its children directly instead of wrapping them in a button element. This is useful for creating custom button-like components that leverage the Button styles. */
	asChild?: boolean;
}

/**
 * Button component for user interactions
 *
 * The Button component is a versatile and customizable element used for triggering actions or navigation in a user interface. It supports various visual styles and sizes to accommodate different design needs and interaction contexts.
 *
 * Key features:
 * - Multiple visual variants to convey different types of actions
 * - Size options to fit various layout requirements
 * - Support for custom styling through className prop
 * - Accessible focus states for keyboard navigation
 * - Disabled state styling
 *
 * Usage considerations:
 * - Use the appropriate variant to match the importance and context of the action
 * - Choose a size that fits well with surrounding elements and the overall layout
 * - Ensure the button's purpose is clear through its label or icon
 * - Consider using the 'asChild' prop for advanced customization scenarios
 *
 * The Button component is designed to be flexible and can be used in various contexts such as forms, dialogs, navigation menus, or as standalone call-to-action elements.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);

export { Button };
